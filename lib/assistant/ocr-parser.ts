/**
 * Fonction utilitaire pour extraire les données OCR Lagon depuis la réponse de l'IA
 */

export interface LagonOCRData {
  typeClient?: "particulier" | "tns" | "entreprise" | null;
  nom?: string | null;
  prenom?: string | null;
  raisonSociale?: string | null;
  adresse?: string | null;
  codePostal?: string | null;
  ville?: string | null;
  telephone?: string | null;
  mobile?: string | null;
  email?: string | null;
  situationPro?: string | null;
  siret?: string | null;
  siren?: string | null;
  apeNaf?: string | null;
  contactDirigeant?: string | null;
  personneAContacter?: string | null;
  pointDeVente?: string | null;
  chargeDeClientele?: string | null;
}

/**
 * Extrait les données OCR Lagon depuis la réponse de l'IA
 * @param aiResponse La réponse complète de l'IA
 * @returns Les données extraites ou null si non trouvées
 */
export function extractLagonOCRData(aiResponse: string): LagonOCRData | null {
  const regex = /<LAGON_OCR_JSON>([\s\S]*?)<\/LAGON_OCR_JSON>/;
  const match = aiResponse.match(regex);
  
  if (match && match[1]) {
    try {
      const parsed = JSON.parse(match[1].trim());
      return parsed as LagonOCRData;
    } catch (e) {
      console.error("Erreur parsing JSON OCR:", e);
      return null;
    }
  }
  
  return null;
}

