/**
 * Catégorisation automatique des documents
 * Utilise OpenAI pour analyser le contenu et suggérer une catégorie
 */

import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const DOCUMENT_CATEGORIES = [
  "contrats",
  "procedures",
  "offres",
  "guides",
  "conditions-generales",
  "formulaires",
  "autres",
] as const;

export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

/**
 * Catégorise automatiquement un document en analysant son contenu
 */
export async function categorizeDocument(
  title: string,
  text: string,
  existingCategory?: string
): Promise<DocumentCategory> {
  try {
    // Si une catégorie existe déjà, la retourner
    if (existingCategory && DOCUMENT_CATEGORIES.includes(existingCategory as DocumentCategory)) {
      return existingCategory as DocumentCategory;
    }

    // Prendre les premiers 2000 caractères pour l'analyse (limite de tokens)
    const textPreview = text.substring(0, 2000);

    const prompt = `Analyse ce document et détermine sa catégorie parmi les options suivantes :
- contrats : Contrats d'assurance, conventions, accords
- procedures : Procédures internes, guides opérationnels, processus
- offres : Offres commerciales, produits, tarifs
- guides : Guides utilisateur, documentation, manuels
- conditions-generales : Conditions générales, clauses contractuelles
- formulaires : Formulaires à remplir, documents administratifs
- autres : Autres types de documents

Titre du document : ${title}
Extrait du contenu : ${textPreview}

Réponds UNIQUEMENT avec le nom de la catégorie (sans explication, sans ponctuation).`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modèle plus économique pour la catégorisation
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3, // Plus déterministe pour la catégorisation
      max_tokens: 50,
    });

    const category = response.choices[0]?.message?.content?.trim().toLowerCase();

    // Valider que la catégorie est dans la liste
    if (category && DOCUMENT_CATEGORIES.includes(category as DocumentCategory)) {
      return category as DocumentCategory;
    }

    // Fallback sur "autres" si la catégorie n'est pas valide
    return "autres";
  } catch (error) {
    console.error("Erreur lors de la catégorisation:", error);
    // En cas d'erreur, retourner "autres"
    return "autres";
  }
}

