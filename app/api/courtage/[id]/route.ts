/**
 * PUT    /api/courtage/[id]  — modifie une compagnie
 * DELETE /api/courtage/[id]  — supprime une compagnie
 *
 * Accessible à tous les rôles authentifiés.
 */

import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/utils/auth-utils";
import { adminDb } from "@/lib/firebase/admin-config";
import { normalizeCompanyName, sanitizeInternetLink } from "@/lib/utils/courtage-format";
import type { CourtageFormData } from "@/types/courtage";

function nowFormatted(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}-${pad(d.getMinutes())}`;
}

// ── PUT ──────────────────────────────────────────────────────────────────────

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth.valid || !auth.userEmail) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

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
    const ref = adminDb.collection("courtage").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Compagnie introuvable" }, { status: 404 });
    }

    await ref.update({
      compagnie: normalizedCompagnie,
      identifiant: identifiant?.trim() ?? "",
      password: password ?? "",
      internet: sanitizedInternet,
      logoUrl: logoUrl?.trim() ?? "",
      qui,
      dateModification,
    });

    return NextResponse.json({
      qui,
      dateModification,
      internet: sanitizedInternet,
      compagnie: normalizedCompagnie,
    });
  } catch (err) {
    console.error("PUT /api/courtage/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── PATCH (tags uniquement) ───────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth.valid || !auth.userEmail) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  let body: { tags: string[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 });
  }

  const tags = Array.isArray(body.tags) ? body.tags.map((t) => String(t).trim()).filter(Boolean) : [];
  const tagsUpdatedBy = auth.userEmail.split("@")[0];
  const tagsUpdatedAt = nowFormatted();

  try {
    const ref = adminDb.collection("courtage").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Compagnie introuvable" }, { status: 404 });
    }
    await ref.update({ tags, tagsUpdatedBy, tagsUpdatedAt });
    return NextResponse.json({ tags, tagsUpdatedBy, tagsUpdatedAt });
  } catch (err) {
    console.error("PATCH /api/courtage/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAuth(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error ?? "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  try {
    const ref = adminDb.collection("courtage").doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Compagnie introuvable" }, { status: 404 });
    }

    await ref.delete();
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("DELETE /api/courtage/[id]:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
