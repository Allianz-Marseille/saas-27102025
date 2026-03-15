import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { fetchEvenementsCalendrier } from "@/lib/services/bs-calendar"
import { parseEvenementsCalendrier } from "@/lib/services/bs-gemini"

/**
 * GET /api/admin/bs/calendar?mois=2026-01
 * Récupère et parse les événements Google Calendar du mois donné.
 * Retourne les événements bruts + les événements parsés par Gemini.
 */
export async function GET(req: NextRequest) {
  const authError = await verifyAdmin(req)
  if (authError) return authError

  const mois = req.nextUrl.searchParams.get("mois")
  if (!mois || !/^\d{4}-\d{2}$/.test(mois)) {
    return NextResponse.json(
      { error: "Paramètre mois invalide. Format attendu : YYYY-MM (ex: 2026-01)" },
      { status: 400 }
    )
  }

  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY manquant" },
      { status: 500 }
    )
  }

  try {
    // 1. Lecture Google Calendar
    const evenementsBruts = await fetchEvenementsCalendrier(mois)

    // 2. Parsing Gemini
    const evenementsParsed = await parseEvenementsCalendrier(evenementsBruts, geminiApiKey)

    return NextResponse.json({
      mois,
      total: evenementsBruts.length,
      bruts: evenementsBruts,
      parsed: evenementsParsed,
    })
  } catch (err) {
    console.error("[api/bs/calendar]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
