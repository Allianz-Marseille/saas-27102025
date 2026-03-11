/**
 * Classificateur Gemini pour les noms clients des prétermes.
 *
 * Objectif : déterminer si "Nom du client" est une personne physique ou une société.
 * Retourne un JSON strict : { type: "particulier" | "societe", confidence: 0–1 }
 *
 * Règles (specs §3.3 et §7.1) :
 * - Batch : jusqu'à 50 noms par appel pour limiter les coûts et la latence.
 * - Fallback : toute erreur API, timeout ou confidence < 0.6 → "a_valider" (société manuelle).
 * - response_mime_type: "application/json" forcé pour garantir le format.
 */

import { GoogleGenAI } from "@google/genai";
import type { TypeEntite } from "@/types/preterme";
import { normalizeClientName } from "@/lib/utils/preterme-quality";

const MODEL = "gemini-2.5-flash";
const BATCH_SIZE = 50;
const CONFIDENCE_THRESHOLD = 0.6;

export interface ClassificationResult {
  nom: string;
  type: TypeEntite;         // "particulier" | "societe" | "a_valider"
  confidence: number;       // 0–1
  fallback: boolean;        // true si résultat par défaut (erreur ou doute)
}

interface GeminiItem {
  type: "particulier" | "entreprise";
  confidence: number;
}

interface GeminiResponse {
  classifications: GeminiItem[];
}

const SOCIETE_KEYWORDS = [
  "SARL",
  "SAS",
  "SASU",
  "EURL",
  "SCI",
  "SA",
  "SNC",
  "SCM",
  "SELARL",
  "SELAS",
  "SOCIETE",
  "COMPAGNIE",
  "ASSOCIATION",
  "GROUPE",
  "HOLDING",
  "ENTREPRISE",
  "ETABLISSEMENTS",
  "ETS",
  "STE",
];

const PARTICULES_NOM = new Set(["DE", "DU", "DES", "LE", "LA", "LES", "DEL", "DI", "D"]);

function hasSocieteKeyword(normalizedNom: string): boolean {
  return SOCIETE_KEYWORDS.some((keyword) =>
    new RegExp(`(^|\\s)${keyword}(\\s|$)`).test(normalizedNom)
  );
}

function looksLikePersonName(normalizedNom: string): boolean {
  const tokens = normalizedNom.split(" ").filter(Boolean);
  if (tokens.length < 2 || tokens.length > 5) return false;
  if (tokens.some((token) => /\d/.test(token))) return false;
  if (tokens.some((token) => token.length === 1 && token !== "D")) return false;
  if (tokens.some((token) => !/^[A-Z'’-]+$/.test(token))) return false;
  if (tokens.some((token) => hasSocieteKeyword(token))) return false;

  const meaningfulTokens = tokens.filter((token) => !PARTICULES_NOM.has(token));
  return meaningfulTokens.length >= 2;
}

export function classifierNomAvecHeuristiques(nom: string): ClassificationResult | null {
  const normalizedNom = normalizeClientName(nom);
  if (!normalizedNom) {
    return { nom, type: "a_valider", confidence: 0, fallback: true };
  }

  if (/\d/.test(normalizedNom) || hasSocieteKeyword(normalizedNom)) {
    return { nom, type: "societe", confidence: 0.95, fallback: false };
  }

  if (looksLikePersonName(normalizedNom)) {
    return { nom, type: "particulier", confidence: 0.93, fallback: false };
  }

  return null;
}

function buildPrompt(noms: string[]): string {
  return `Tu es un classificateur de noms de clients pour une agence d'assurance française.
Pour chaque nom fourni, détermine s'il s'agit d'une personne physique (particulier) ou d'une personne morale (entreprise/société/association).

Règles :
- "particulier" : nom de famille + prénom, ex: "AHAROUNIAN SERGE", "MARTIN JEAN-PIERRE"
- "entreprise" : raison sociale, sigle, enseigne commerciale, ex: "SERVICES MARITIMES ET AVITAILLEM", "SCI LES PINS", "SARL DUPONT"
- En cas de doute : préférer "entreprise" avec confidence < 0.6
- La confidence doit refléter ta certitude (1.0 = très sûr, 0.5 = incertain)

Réponds UNIQUEMENT avec un objet JSON valide, sans markdown ni texte autour :
{
  "classifications": [
    { "type": "particulier" | "entreprise", "confidence": 0.0–1.0 },
    ...
  ]
}

Les classifications doivent être dans le MÊME ORDRE que la liste de noms fournie.

Noms à classifier (${noms.length}) :
${noms.map((n, i) => `${i + 1}. ${n}`).join("\n")}`;
}

async function classifyBatch(
  client: GoogleGenAI,
  noms: string[]
): Promise<ClassificationResult[]> {
  try {
    const response = await client.models.generateContent({
      model: MODEL,
      contents: buildPrompt(noms),
      config: {
        responseMimeType: "application/json",
        temperature: 0.1,
      },
    });

    const text = response.text?.trim() ?? "";
    const parsed: GeminiResponse = JSON.parse(text);

    if (!Array.isArray(parsed.classifications)) {
      throw new Error("Format de réponse inattendu");
    }

    return noms.map((nom, i) => {
      const item = parsed.classifications[i];
      if (!item) {
        return { nom, type: "a_valider" as TypeEntite, confidence: 0, fallback: true };
      }

      const confidence = typeof item.confidence === "number" ? item.confidence : 0;
      const isParticulier = item.type === "particulier" && confidence >= CONFIDENCE_THRESHOLD;
      const isSociete = item.type === "entreprise" && confidence >= CONFIDENCE_THRESHOLD;

      return {
        nom,
        type: isParticulier
          ? ("particulier" as TypeEntite)
          : isSociete
          ? ("societe" as TypeEntite)
          : ("a_valider" as TypeEntite),
        confidence,
        fallback: !isParticulier && !isSociete,
      };
    });
  } catch {
    // Fallback total sur le batch : tous classés "a_valider"
    return noms.map((nom) => ({
      nom,
      type: "a_valider" as TypeEntite,
      confidence: 0,
      fallback: true,
    }));
  }
}

/**
 * Classifie une liste de noms clients en lots (batch de 50).
 * Toujours retourne un résultat pour chaque nom (jamais de rejet).
 */
export async function classifierNoms(
  noms: string[],
  apiKey: string
): Promise<ClassificationResult[]> {
  const finalResults: Array<ClassificationResult | null> = new Array(noms.length).fill(null);
  const nomsPourGemini: string[] = [];
  const indexesPourGemini: number[] = [];

  noms.forEach((nom, index) => {
    const heuristic = classifierNomAvecHeuristiques(nom);
    if (heuristic) {
      finalResults[index] = heuristic;
      return;
    }
    nomsPourGemini.push(nom);
    indexesPourGemini.push(index);
  });

  if (nomsPourGemini.length === 0) {
    return finalResults as ClassificationResult[];
  }

  if (!apiKey) {
    indexesPourGemini.forEach((index) => {
      finalResults[index] = {
        nom: noms[index],
        type: "a_valider" as TypeEntite,
        confidence: 0,
        fallback: true,
      };
    });
    return finalResults as ClassificationResult[];
  }

  const client = new GoogleGenAI({ apiKey });

  for (let i = 0; i < nomsPourGemini.length; i += BATCH_SIZE) {
    const batchNoms = nomsPourGemini.slice(i, i + BATCH_SIZE);
    const batchIndexes = indexesPourGemini.slice(i, i + BATCH_SIZE);
    const batchResults = await classifyBatch(client, batchNoms);

    batchResults.forEach((result, batchPosition) => {
      const originalIndex = batchIndexes[batchPosition];
      if (originalIndex === undefined) return;
      finalResults[originalIndex] = result;
    });
  }

  return finalResults.map((result, index) => (
    result ?? {
      nom: noms[index],
      type: "a_valider" as TypeEntite,
      confidence: 0,
      fallback: true,
    }
  ));
}
