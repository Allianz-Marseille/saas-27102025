/**
 * GET  /api/courtage  — liste toutes les compagnies
 * POST /api/courtage  — crée une compagnie
 *
 * GET/POST accessibles à tous les rôles authentifiés (CRUD sans distinction de rôle).
 * L'audit (qui, dateModification) est calculé côté serveur.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { adminDb, Timestamp } from "@/lib/firebase/admin-config";
import { normalizeCompanyName, sanitizeInternetLink } from "@/lib/utils/courtage-format";
import type { CourtageFormData } from "@/types/courtage";

function nowFormatted(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

// ── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  try {
    const snap = await adminDb
      .collection("courtage")
      .orderBy("compagnie", "asc")
      .get();

    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        compagnie: normalizeCompanyName(data.compagnie),
        internet: sanitizeInternetLink(data.internet),
      };
    });
    return NextResponse.json({ items });
  } catch (err) {
    console.error("GET /api/courtage:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── POST ─────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.valid || !auth.userEmail) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  let body: CourtageFormData;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const { compagnie, identifiant, password, internet, logoUrl } = body;
  if (!compagnie?.trim()) {
    return NextResponse.json({ error: "Le nom de la compagnie est requis" }, { status: 400 });
  }

  const normalizedCompagnie = normalizeCompanyName(compagnie);
  if (!normalizedCompagnie) {
    return NextResponse.json({ error: "Le nom de la compagnie est requis" }, { status: 400 });
  }

  const qui = auth.userEmail.split("@")[0];
  const dateModification = nowFormatted();
  const sanitizedInternet = sanitizeInternetLink(internet);

  try {
    const ref = await adminDb.collection("courtage").add({
      compagnie: normalizedCompagnie,
      identifiant: identifiant?.trim() ?? "",
      password: password ?? "",
      internet: sanitizedInternet,
      logoUrl: logoUrl?.trim() ?? "",
      qui,
      dateModification,
      createdAt: Timestamp.now(),
    });

    return NextResponse.json(
      { id: ref.id, qui, dateModification, internet: sanitizedInternet, compagnie: normalizedCompagnie },
      { status: 201 }
    );
  } catch (err) {
    console.error("POST /api/courtage:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
