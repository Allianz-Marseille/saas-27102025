import { NextRequest, NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/utils/auth-utils"
import { adminDb } from "@/lib/firebase/admin-config"
import { fetchEvenementsCalendrier } from "@/lib/services/bs-calendar"
import { parseEvenementsCalendrier } from "@/lib/services/bs-gemini"
import { matchEvenements, groupAbsencesParSemaine, computeTicketsRestaurants } from "@/lib/services/bs-matcher"
import { isEngagementActif } from "@/types/bs"
import type { Collaborateur } from "@/types/collaborateur"
import type { BsEngagement, BsDeclaration, SalarieDeclaration } from "@/types/bs"

/**
 * POST /api/admin/bs/preparer
 * Body : { moisKey: string }
 *
 * Orchestre la préparation du BS mensuel :
 * 1. Calendar → Gemini → matching collaborateurs → absences par semaine
 * 2. Engagements actifs → garantieVariable / primeFormation
 * 3. Merge avec déclaration existante (conserve les champs manuels)
 * 4. Sauvegarde en Firestore
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

  const geminiApiKey = process.env.GEMINI_API_KEY
  if (!geminiApiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY manquant" }, { status: 500 })
  }

  try {
    // ── 1. Google Calendar + parsing Gemini ─────────────────────────────────
    const evenementsBruts = await fetchEvenementsCalendrier(moisKey)
    const evenementsParsed = await parseEvenementsCalendrier(evenementsBruts, geminiApiKey)

    // ── 2. Collaborateurs depuis Firestore ──────────────────────────────────
    const collabSnap = await adminDb.collection("collaborateurs").get()
    const collaborateurs: Collaborateur[] = collabSnap.docs.map((d) => {
      const data = d.data()
      return {
        id: d.id,
        firstName: data.firstName as string,
        pole: data.pole as Collaborateur["pole"],
        contrat: (data.contrat ?? "cdi") as Collaborateur["contrat"],
        joursTravail: (data.joursTravail as Collaborateur["joursTravail"]) ?? [],
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    })

    // ── 3. Matching prénoms → collaborateurs ────────────────────────────────
    const { matched, prenomsSansMatch } = matchEvenements(evenementsParsed, collaborateurs)

    // ── 4. Engagements actifs ────────────────────────────────────────────────
    const engSnap = await adminDb.collection("bs_engagements").where("clos", "==", false).get()
    const engagementsActifs: BsEngagement[] = engSnap.docs
      .map((d) => {
        const data = d.data()
        return {
          id: d.id,
          collaborateurId: data.collaborateurId as string,
          type: data.type as BsEngagement["type"],
          montantMensuel: data.montantMensuel as number,
          moisDebut: data.moisDebut as string,
          moisFin: data.moisFin as string,
          nbMois: data.nbMois as number,
          clos: false,
          createdAt: new Date(),
        }
      })
      .filter((e) => isEngagementActif(e, moisKey))

    // ── 5. Déclaration existante (pour conserver les champs manuels) ─────────
    const existingSnap = await adminDb.collection("bs_declarations").doc(moisKey).get()
    const existing = existingSnap.exists ? existingSnap.data() as Record<string, unknown> : null

    if (existing?.statut === "clos") {
      return NextResponse.json({ error: "Ce mois est déjà clôturé." }, { status: 409 })
    }

    const existingSalaries = (existing?.salaries ?? {}) as Record<string, SalarieDeclaration>

    // ── 6. Construction du document salaries ────────────────────────────────
    const salaries: Record<string, SalarieDeclaration> = {}

    for (const collab of collaborateurs) {
      const existingSalarie = existingSalaries[collab.id] ?? {}
      const events = matched.get(collab.id) ?? []
      const absences = groupAbsencesParSemaine(events)
      const ticketsRestaurants = computeTicketsRestaurants(moisKey, collab.joursTravail, events)

      // Engagement actif de ce collaborateur
      const eng = engagementsActifs.find((e) => e.collaborateurId === collab.id)

      salaries[collab.id] = {
        // Champs auto (écrasés)
        absences,
        ticketsRestaurants,
        garantieVariable: eng?.type === "garantie_variable" ? eng.montantMensuel : undefined,
        primeFormation: eng?.type === "prime_formation" ? eng.montantMensuel : undefined,
        // Champs manuels (conservés)
        commissions: existingSalarie.commissions,
        boostGoogle: existingSalarie.boostGoogle,
        primeMacron: existingSalarie.primeMacron,
        primeNoel: existingSalarie.primeNoel,
        avance: existingSalarie.avance,
        avanceFrais: existingSalarie.avanceFrais,
        frais: existingSalarie.frais,
        heuresSup: existingSalarie.heuresSup,
        regul: existingSalarie.regul,
      }
    }

    // ── 7. Sauvegarde ────────────────────────────────────────────────────────
    const now = new Date()
    const declaration: BsDeclaration = {
      moisKey,
      statut: "en_cours",
      salaries,
      prenomsSansMatch,
      createdAt: existing ? (existing.createdAt as Date ?? now) : now,
      updatedAt: now,
    }

    await adminDb.collection("bs_declarations").doc(moisKey).set({
      ...declaration,
      createdAt: existing
        ? existingSnap.data()?.createdAt  // conserver la date de création originale
        : new Date(),
      updatedAt: new Date(),
    })

    return NextResponse.json({
      moisKey,
      statut: "en_cours",
      prenomsSansMatch,
      nbCollaborateurs: collaborateurs.length,
      nbEvenementsTraites: evenementsParsed.filter((e) => e.type !== "ignore").length,
    })
  } catch (err) {
    console.error("[api/bs/preparer]", err)
    const message = err instanceof Error ? err.message : "Erreur inconnue"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
