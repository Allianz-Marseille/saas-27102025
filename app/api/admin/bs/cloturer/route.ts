import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb, FieldValue } from "@/lib/firebase/admin-config"

/**
 * POST /api/admin/bs/cloturer
 * Body : { moisKey: string }
 * Clôture une déclaration BS — action irréversible.
 */
export async function POST(req: NextRequest) {
  try {
    await verifyAdmin(req)
  } catch {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  const { moisKey } = body as { moisKey?: string }

  if (!moisKey || !/^\d{4}-\d{2}$/.test(moisKey)) {
    return NextResponse.json({ error: "moisKey invalide (format YYYY-MM)" }, { status: 400 })
  }

  try {
    const snap = await adminDb.collection("bs_declarations").doc(moisKey).get()
    if (!snap.exists) {
      return NextResponse.json({ error: "Déclaration introuvable" }, { status: 404 })
    }
    if (snap.data()?.statut === "clos") {
      return NextResponse.json({ error: "Déjà clôturé" }, { status: 409 })
    }

    await adminDb.collection("bs_declarations").doc(moisKey).update({
      statut: "clos",
      closedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    })

    return NextResponse.json({ moisKey, statut: "clos" })
  } catch (err) {
    console.error("[api/bs/cloturer]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
