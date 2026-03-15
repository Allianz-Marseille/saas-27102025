import { GoogleGenAI } from "@google/genai"

export type TypeEvenement = "cp" | "malade" | "ecole" | "ignore"

export interface EvenementCalendrier {
  /** Titre brut de l'événement Google Calendar */
  titre: string
  /** Date ISO (YYYY-MM-DD) ou plage "YYYY-MM-DD/YYYY-MM-DD" */
  date: string
  /** true si l'événement a une heure de début (= demi-journée) */
  avecHeure: boolean
}

export interface EvenementParse {
  /** Prénom du salarié tel qu'il apparaît dans la fiche (normalisé) */
  prenom: string
  type: TypeEvenement
  date: string
  /** true = demi-journée (événement avec heure de début/fin) */
  demiJournee: boolean
  /** Titre brut original pour traçabilité */
  titreOriginal: string
}

const GEMINI_PROMPT = `Tu es un assistant RH. On te donne une liste d'événements bruts issus d'un calendrier Google d'agence.

Pour chaque événement, tu dois extraire :
- "prenom" : le prénom du salarié concerné, en minuscules, sans accent, sans tiret (ex: "virginie", "karen", "jean michel")
- "type" : "cp" si congé payé, "malade" si maladie / arrêt maladie, "ecole" si journée école alternant, "ignore" si aucun de ces cas
- "date" : la date telle que fournie (ne pas modifier)
- "demiJournee" : true si l'événement a une heure (ex: "9h-12h30") dans le titre ou dans le champ avecHeure, false sinon
- "titreOriginal" : le titre brut fourni

Règles d'interprétation :
- Les titres peuvent être écrits de toutes les façons : "virginie cp", "virginie-cp", "cp virginie", "VIRGINIE CP", "Virginie - CP", "cp de virginie", etc. → type = "cp"
- "maladie", "malade", "arrêt maladie", "arret", "am" → type = "malade"
- "école", "ecole", "école", "school" → type = "ecole"
- Si le titre contient une heure (ex: "9h", "9h30", "14h00") → demiJournee = true
- Si tu ne peux pas identifier de salarié ou de type, retourne type = "ignore"
- Ne jamais inventer de données — si incertain sur le prénom, retourne le fragment le plus probable

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte autour.

Format de sortie :
[
  { "prenom": "virginie", "type": "cp", "date": "2026-01-05", "demiJournee": false, "titreOriginal": "virginie cp" },
  ...
]`

export async function parseEvenementsCalendrier(
  evenements: EvenementCalendrier[],
  apiKey: string
): Promise<EvenementParse[]> {
  if (evenements.length === 0) return []

  const ai = new GoogleGenAI({ apiKey })

  const input = evenements.map((e) => ({
    titre: e.titre,
    date: e.date,
    avecHeure: e.avecHeure,
  }))

  const prompt = `${GEMINI_PROMPT}\n\nÉvénements :\n${JSON.stringify(input, null, 2)}`

  async function attempt(): Promise<EvenementParse[]> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    })
    const raw = (response.text ?? "").trim()
    const match = raw.match(/\[[\s\S]*\]/)
    if (!match) throw new Error("Pas de JSON valide dans la réponse Gemini")
    return JSON.parse(match[0]) as EvenementParse[]
  }

  try {
    return await attempt()
  } catch {
    // Retry x1
    try {
      return await attempt()
    } catch {
      console.error("[bs-gemini] Échec après 2 tentatives — retour tableau vide")
      return []
    }
  }
}
