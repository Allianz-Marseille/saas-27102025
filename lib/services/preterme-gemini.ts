import { GoogleGenAI } from "@google/genai"

type ClassificationResult = {
  numeroContrat: string
  classification: "particulier" | "entreprise"
}

// ─── Heuristiques (mots-clés certains) ────────────────────────────────────────

const MOTS_ENTREPRISE = [
  // Activité transport
  "TRANSPORT", "TRANSPORTS", "LOGISTIQUE", "FRET", "CARGO", "LIVRAISON",
  "VTC", "TAXI", "CHAUFFEUR", "EXPRESS", "COURSIER",
  // BTP / artisanat
  "BATIMENT", "CONSTRUCTION", "CONSTRUCTIONS", "RENOVATION", "RENOVATIONS",
  "TRAVAUX", "MACONNERIE", "ELECTRICITE", "PLOMBERIE", "MENUISERIE",
  "PEINTURE", "TOITURE", "ISOLATION", "CARRELAGE", "CLIMATISATION",
  "CLIM", "CHAUFFAGE", "VENTILATION", "SECURITE",
  // Commerce / restauration
  "FOOD", "RESTAURANT", "TRAITEUR", "PIZZ", "BOULANGERIE", "PATISSERIE",
  "EPICERIE", "COMMERCE", "BOUTIQUE", "PRESSING", "LAVERIE", "COIFFURE",
  // Auto / mobilité
  "GARAGE", "CARROSSERIE", "MOTO", "CYCLES", "LOCATION",
  "PRESTIGE", "LUXURY", "PNEUS", "PARE-BRISE",
  // Services professionnels
  "SERVICES", "SERVICE", "SOLUTIONS", "CONSULTING", "CONSEIL",
  "INFORMATIQUE", "NUMERIQUE", "DIGITAL", "COMMUNICATION",
  "NETTOYAGE", "GARDIENNAGE", "SECURITE", "SURVEILLANCE",
  // Immobilier / finance
  "IMMO", "IMMOBILIER", "INVEST", "INVESTISSEMENT", "CAPITAL",
  "HOLDING", "GROUPE", "COMPAGNIE",
  // Maritime / aérien
  "MARITIME", "AVITAILLEM", "MARITIME",
  // Événementiel / loisirs
  "EVENT", "EVENEMENT", "EVÈNEMENT", "EVENEMENTS",
  // Générique entreprise
  "PARC", "PARK", "ASSOCIES", "PARTENAIRES", "INDUSTRIE",
  "NEGOCI", "NEGOCE", "IMPORT", "EXPORT", "DISTRIBUTION",
]

const FORMES_JURIDIQUES = [
  "SARL", "SAS", "SASU", "EURL", "SCI", "SNC", "GIE", "SELARL",
  "ASSOCIATION", "SYNDICAT", "COOPERATI",
]

function normalise(s: string): string {
  return s
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
}

/**
 * Retourne "entreprise", "particulier", ou null (ambiguïté → Gemini).
 */
function classifierParHeuristique(nomClient: string): "particulier" | "entreprise" | null {
  const nom = normalise(nomClient)
  const mots = nom.split(/\s+/)

  // Forme juridique → entreprise certaine
  for (const forme of FORMES_JURIDIQUES) {
    if (nom.includes(forme)) return "entreprise"
  }

  // Mot-clé d'activité → entreprise certaine
  for (const kw of MOTS_ENTREPRISE) {
    // Word-boundary : le mot-clé doit être un token entier
    if (mots.includes(kw) || mots.some(m => m.startsWith(kw) && m.length <= kw.length + 2)) {
      return "entreprise"
    }
  }

  // Sigle pur : 2-5 majuscules avec éventuellement chiffres (ex : MD2J, MMS, KFB, CCS, SM)
  // Exclure les prénoms courants de 2-3 lettres ambigus (géré par Gemini)
  if (/^[A-Z]{2,5}(\d+[A-Z]?)?$/.test(nom)) return "entreprise"

  // Acronyme + numéro de département (ex: KST 13, LUXURY CAR 92)
  if (mots.length >= 2 && /^\d{2,3}$/.test(mots[mots.length - 1])) return "entreprise"

  // Nom contenant un chiffre (hors numéro de rue potentiel) → souvent entreprise
  // ex: "BATI RENOVATION 63", "FNB ASSOCIES II"
  if (/\d/.test(nom) && mots.length >= 2) return "entreprise"

  // Nom en un seul mot trop court pour être "Prénom NOM" → ambigu
  if (mots.length === 1 && nom.length <= 5) return null

  // Nom avec II, III (numérotation entreprise)
  if (mots.includes("II") || mots.includes("III")) return "entreprise"

  return null // ambiguïté → laisser Gemini décider
}

// ─── Gemini pour les cas ambigus ─────────────────────────────────────────────

const GEMINI_PROMPT = `Tu es un classificateur de clients assurance automobile française.
Classe chaque nom en "particulier" (personne physique : prénom + nom) ou "entreprise" (raison sociale).
Réponds UNIQUEMENT avec un tableau JSON strict, sans texte ni balises.
Format : [{"numeroContrat":"...","classification":"particulier"},{"numeroContrat":"...","classification":"entreprise"}]

Exemples :
- "DUPUY PAULINE" → particulier
- "AHAROUNIAN SERGE" → particulier
- "NEPTING" → entreprise
- "PRAGMA" → entreprise
- "TALIS" → entreprise
- "NOUR" → entreprise (nom commercial court)
- "VALENTIN" → entreprise (un seul mot non identifiable comme personne)`

async function classifierAvecGemini(
  clients: { numeroContrat: string; nomClient: string }[],
  apiKey: string
): Promise<ClassificationResult[]> {
  if (clients.length === 0) return []

  const ai = new GoogleGenAI({ apiKey })
  const input = clients.map(c => ({ numeroContrat: c.numeroContrat, nomClient: c.nomClient }))
  const prompt = `${GEMINI_PROMPT}\n\nClients :\n${JSON.stringify(input)}`

  async function attempt(): Promise<ClassificationResult[]> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    })
    const raw = (response.text ?? "").trim()
    // Extraire le tableau JSON même si Gemini ajoute du texte autour
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("Pas de JSON valide")
    const parsed = JSON.parse(match[0]) as ClassificationResult[]
    // Normaliser les numéros de contrat (Gemini peut renvoyer des nombres)
    return parsed.map(r => ({
      ...r,
      numeroContrat: String(r.numeroContrat),
    }))
  }

  try {
    return await attempt()
  } catch {
    try {
      return await attempt()
    } catch {
      // Fallback : Gemini a échoué deux fois → on classe les ambigus comme particuliers
      return clients.map(c => ({ numeroContrat: c.numeroContrat, classification: "particulier" as const }))
    }
  }
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function classifyClientsWithGemini(
  clients: { numeroContrat: string; nomClient: string }[],
  apiKey: string
): Promise<ClassificationResult[]> {
  const results: ClassificationResult[] = []
  const ambigus: typeof clients = []

  // Passe 1 : heuristiques déterministes
  for (const c of clients) {
    const h = classifierParHeuristique(c.nomClient)
    if (h !== null) {
      results.push({ numeroContrat: c.numeroContrat, classification: h })
    } else {
      ambigus.push(c)
    }
  }

  // Passe 2 : Gemini uniquement pour les ambigus
  const geminiResults = await classifierAvecGemini(ambigus, apiKey)
  const geminiMap = new Map(geminiResults.map(r => [r.numeroContrat, r.classification]))

  for (const c of ambigus) {
    results.push({
      numeroContrat: c.numeroContrat,
      classification: geminiMap.get(c.numeroContrat) ?? "particulier",
    })
  }

  return results
}
