import { GoogleGenAI } from "@google/genai"

type ClassificationResult = {
  numeroContrat: string
  classification: "particulier" | "entreprise"
}

const SYSTEM_PROMPT = `Tu es un classificateur. Pour chaque entrée, détermine si le nom correspond à un particulier (nom + prénom d'une personne physique) ou à une entreprise (raison sociale, sigle, forme juridique comme SARL, SAS, EURL, SA, SCI, AUTO-ENTREPRENEUR, etc.).

Réponds UNIQUEMENT avec un tableau JSON valide, sans texte avant ni après, sans balises markdown.
Format de réponse : [{ "numeroContrat": "...", "classification": "particulier" | "entreprise" }]

En cas d'ambiguïté, utilise "particulier" par défaut.`

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
