/**
 * Génération de résumés automatiques pour les documents RAG
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Génère un résumé automatique d'un document
 */
export async function generateDocumentSummary(
  title: string,
  text: string
): Promise<string> {
  try {
    // Prendre les premiers 4000 caractères pour le résumé
    const textPreview = text.substring(0, 4000);

    const prompt = `Génère un résumé concis et informatif de ce document d'assurance.

Titre : ${title}

Contenu :
${textPreview}

Le résumé doit :
- Faire maximum 200 mots
- Être clair et structuré
- Mettre en évidence les points clés
- Être utile pour comprendre rapidement le contenu du document

Résumé :`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle économique pour les résumés
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.5,
      max_tokens: 300,
    });

    const summary = response.choices[0]?.message?.content?.trim() || "";

    if (!summary) {
      throw new Error("Aucun résumé généré");
    }

    return summary;
  } catch (error) {
    console.error("Erreur lors de la génération du résumé:", error);
    // Retourner un résumé basique basé sur le début du texte
    return text.substring(0, 200) + "...";
  }
}

