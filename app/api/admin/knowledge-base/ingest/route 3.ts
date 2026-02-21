/**
 * POST /api/admin/knowledge-base/ingest
 * Ingère un PDF dans une base de connaissance RAG (extraction + embedding OpenAI + Firestore).
 * Détection doublons (même docId) et versions Allianz (même référence) ; proposition de remplacement si version plus récente.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/utils/auth-utils";
import { getKnowledgeBaseById } from "@/lib/knowledge/registry";
import { slugFromFilename } from "@/lib/knowledge/extract-pdf";
import { parseAllianzPdfFilename } from "@/lib/knowledge/allianz-pdf-version";
import { extractTextFromPDFBuffer } from "@/lib/assistant/file-extraction";
import { generateEmbedding } from "@/lib/knowledge/embedding";
import { getAdminDb, getStorageBucket } from "@/lib/firebase/admin-config";
import { Timestamp } from "firebase-admin/firestore";
import OpenAI from "openai";

const MAX_FILE_SIZE = 20 * 1024 * 1024;

function getOpenAIClient(): OpenAI {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdmin(request);
    if (!auth.valid) {
      return NextResponse.json({ error: auth.error }, { status: 401 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY non configurée" },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const knowledgeBaseId = formData.get("knowledgeBaseId") as string | null;
    const docIdParam = formData.get("docId") as string | null;
    const replaceDocIdParam = formData.get("replaceDocId") as string | null;
    const replaceDocId = replaceDocIdParam?.toString().trim() || null;

    if (!file || !knowledgeBaseId) {
      return NextResponse.json(
        { error: "Paramètres manquants : file et knowledgeBaseId requis" },
        { status: 400 }
      );
    }

    const config = getKnowledgeBaseById(knowledgeBaseId);
    if (!config) {
      return NextResponse.json(
        { error: `Base de connaissance inconnue : ${knowledgeBaseId}` },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Fichier trop volumineux (max ${MAX_FILE_SIZE / 1024 / 1024} Mo)` },
        { status: 400 }
      );
    }

    if (file.size === 0) {
      return NextResponse.json({ error: "Le fichier est vide" }, { status: 400 });
    }

    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith(".pdf")) {
      return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés" }, { status: 400 });
    }

    const title = file.name.replace(/\.pdf$/i, "");
    const collection = getAdminDb().collection(config.firestoreCollection);

    if (replaceDocId) {
      const oldDoc = await collection.doc(replaceDocId).get();
      if (oldDoc.exists) {
        const oldData = oldDoc.data();
        const oldStoragePath = oldData?.storagePath;
        if (oldStoragePath) {
          try {
            const bucket = getStorageBucket();
            await bucket.file(oldStoragePath).delete();
          } catch {
            // Ignorer si le fichier n'existe pas
          }
        }
        await collection.doc(replaceDocId).delete();
      }
    }

    const docId = replaceDocId ? slugFromFilename(file.name) : (docIdParam?.trim() || slugFromFilename(file.name));
    if (!docId) {
      return NextResponse.json({ error: "Impossible de générer un identifiant pour le document" }, { status: 400 });
    }

    if (!replaceDocId) {
      const existingByDocId = await collection.doc(docId).get();
      if (existingByDocId.exists) {
        return NextResponse.json(
          {
            code: "DUPLICATE_DOC_ID",
            docId,
            message: "Un document avec le même nom existe déjà.",
          },
          { status: 409 }
        );
      }

      const parsed = parseAllianzPdfFilename(title);
      if (parsed) {
        const snapshot = await collection.get();
        const sameRef: { docId: string; title: string; versionOrderable: number; documentVersion?: string }[] = [];
        for (const doc of snapshot.docs) {
          const data = doc.data();
          const storedRef = data?.documentReference as string | undefined;
          const storedOrderable = data?.versionOrderable as number | undefined;
          const docTitle = (data?.title as string) || doc.id;
          const ref = storedRef ?? parseAllianzPdfFilename(docTitle)?.reference ?? "";
          if (ref && ref === parsed.reference) {
            const orderable = storedOrderable ?? parseAllianzPdfFilename(docTitle)?.versionOrderable ?? 0;
            sameRef.push({
              docId: doc.id,
              title: docTitle,
              versionOrderable: orderable,
              documentVersion: data?.documentVersion as string | undefined,
            });
          }
        }
        if (sameRef.length > 0) {
          const best = sameRef.reduce((a, b) => (a.versionOrderable >= b.versionOrderable ? a : b));
          if (parsed.versionOrderable <= best.versionOrderable) {
            return NextResponse.json(
              {
                code: "OLDER_OR_SAME_VERSION",
                existingDocId: best.docId,
                existingTitle: best.title,
                existingVersion: best.documentVersion,
                message: "Une version plus récente ou identique est déjà en base.",
              },
              { status: 409 }
            );
          }
          return NextResponse.json({
            code: "NEWER_VERSION_AVAILABLE",
            replaceSuggested: true,
            existingDocId: best.docId,
            existingTitle: best.title,
            incomingVersion: parsed.version,
            message: "Une version plus récente est disponible. Remplacer l'ancienne ?",
          });
        }
      }
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const content = await extractTextFromPDFBuffer(buffer);

    const storagePath = `knowledge-base/${knowledgeBaseId}/${docId}.pdf`;

    if (docIdParam?.trim() && docId === docIdParam.trim()) {
      const existingDoc = await collection.doc(docId).get();
      const oldStoragePath = existingDoc.data()?.storagePath;
      if (oldStoragePath) {
        try {
          const bucket = getStorageBucket();
          await bucket.file(oldStoragePath).delete();
        } catch {
          // Ignorer si le fichier n'existe pas
        }
      }
    }

    const bucket = getStorageBucket();
    const fileRef = bucket.file(storagePath);
    await fileRef.save(buffer, {
      contentType: "application/pdf",
      metadata: { cacheControl: "private, max-age=3600" },
    });

    const openai = getOpenAIClient();
    const embedding = await generateEmbedding(content, openai);

    const allianzMeta = parseAllianzPdfFilename(title);
    const payload: Record<string, unknown> = {
      title,
      content,
      updatedAt: Timestamp.now(),
      embedding,
      storagePath,
    };
    if (allianzMeta) {
      payload.documentReference = allianzMeta.reference;
      payload.documentVersion = allianzMeta.version;
      payload.versionOrderable = allianzMeta.versionOrderable;
    }

    await collection.doc(docId).set(payload, { merge: true });

    const written = await collection.doc(docId).get();
    if (!written.exists) {
      console.error("Ingest: document écrit mais relecture introuvable", { docId, collection: config.firestoreCollection });
      return NextResponse.json(
        { error: "Document écrit mais vérification échouée (relecture introuvable)" },
        { status: 500 }
      );
    }
    const data = written.data();
    const hasTitle = data && typeof data.title === "string" && data.title.length > 0;
    const hasContent = data && typeof data.content === "string";
    const hasEmbedding = data && Array.isArray(data.embedding) && data.embedding.length > 0;
    if (!hasTitle || !hasContent || !hasEmbedding) {
      console.error("Ingest: document écrit mais champs RAG invalides", {
        docId,
        hasTitle: !!hasTitle,
        hasContent: !!hasContent,
        hasEmbedding: !!hasEmbedding,
      });
      return NextResponse.json(
        {
          error: "Document écrit mais vérification échouée : le document doit contenir title, content et embedding pour être disponible pour le bot.",
        },
        { status: 500 }
      );
    }

    const isUpdate = !!docIdParam?.trim() || !!replaceDocId;

    return NextResponse.json({
      success: true,
      docId,
      title,
      charsExtracted: content.length,
      updated: isUpdate,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";
    console.error("Erreur POST /api/admin/knowledge-base/ingest:", error);

    const isExtractionError =
      message.includes("Aucun texte extrait") ||
      message.includes("texte extrait") ||
      message.includes("PDF corrompu") ||
      message.includes("PDF invalide") ||
      message.includes("mot de passe") ||
      message.includes("chiffré");

    if (isExtractionError) {
      const hint =
        message.includes("scanné") || message.includes("OCR")
          ? " Les PDF scannés sont traités par OCR (5 premières pages). Vérifiez que Google Vision est configuré (GOOGLE_APPLICATION_CREDENTIALS_JSON)."
          : " Utilisez un PDF avec texte sélectionnable ou une version déjà numérisée.";
      return NextResponse.json(
        {
          error: "Impossible d'extraire le texte du PDF",
          details: message + hint,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de l'ingestion", details: message },
      { status: 500 }
    );
  }
}
