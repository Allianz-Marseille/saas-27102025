import { GoogleGenAI } from "@google/genai"

type ClassificationResult = {
  numeroContrat: string
  classification: "particulier" | "entreprise"
}

const SYSTEM_PROMPT = `Tu es un classificateur de clients pour une compagnie d'assurance automobile française.
Pour chaque client, détermine si le nom est un PARTICULIER (personne physique) ou une ENTREPRISE (personne morale).

ENTREPRISE si le nom contient :
- Un mot d'activité : TRANSPORT, TRANSPORTS, LOGISTIQUE, CONSTRUCTION, CONSTRUCTIONS, BATIMENT, RENOVATION, SERVICES, SERVICE, FOOD, PRESTIGE, LUXURY, IMMO, IMMOBILIER, PNEUS, CLIM, CHAUFFAGE, DISTRIBUTION, NÉGOCE, NEGOCI, MARITIME, AVITAILLEM, ÉVÉNEMENT, EVENEMENT, EVENT, PIZZ, PARC, PARK, EXPRESS
- Un sigle ou acronyme (2-5 majuscules sans voyelle ou avec chiffre) : MD2J, MMS, KST, VTC, KFB, FNB, CCS, MEO, EKO, MK, DC, SM
- Un mot juridique : SARL, SAS, EURL, SA, SCI, SNC, COMPAGNIE, ASSOCIES, GROUPE, HOLDING
- Une enseigne/marque : NEPTING, PRAGMA, TALIS, APPS, INITRAME, SEGEDIA

PARTICULIER si le nom est : Prénom NOM ou NOM Prénom (personne physique identifiable).

En cas d'ambiguïté sur un prénom rare ou nom court, préfère ENTREPRISE.

Réponds UNIQUEMENT avec un tableau JSON, sans texte ni balises markdown.
Format strict : [{"numeroContrat": "...", "classification": "particulier"}, {"numeroContrat": "...", "classification": "entreprise"}]`

export async function classifyClientsWithGemini(
  clients: { numeroContrat: string; nomClient: string }[],
  apiKey: string
): Promise<ClassificationResult[]> {
  const ai = new GoogleGenAI({ apiKey })
  const input = JSON.stringify(clients)
  const prompt = `${SYSTEM_PROMPT}\n\nClients à classifier :\n${input}`

  async function attempt(): Promise<ClassificationResult[]> {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: { responseMimeType: "application/json" },
    })
    const raw = response.text ?? "[]"
    return JSON.parse(raw) as ClassificationResult[]
  }

  try {
    return await attempt()
  } catch {
    try {
      return await attempt()
    } catch {
      return clients.map(c => ({
        numeroContrat: c.numeroContrat,
        classification: "particulier" as const,
      }))
    }
  }
}
