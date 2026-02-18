/**
 * Parsing des noms de fichiers PDF Allianz (format COM/V/DIG + version VMMYY).
 * Permet de détecter les doublons et de comparer les versions.
 */

export interface AllianzPdfParsed {
  reference: string;
  version: string;
  versionOrderable: number;
}

/**
 * Pattern Allianz typique : CODE-VMMYY-BD (ex: COM18112-V1124-BD, DIG20627-V0918-BD).
 * versionOrderable = MM * 100 + YY pour comparaison (ex: 1124 = nov. 24 → 1124, 0325 = mars 25 → 325).
 */
const ALLIANZ_REF_PATTERN = /([A-Z]{3}\d{5,}-V\d{4,}(?:-BD)?)/i;

export function parseAllianzPdfFilename(filename: string): AllianzPdfParsed | null {
  const match = filename.match(ALLIANZ_REF_PATTERN);
  if (!match) return null;

  const reference = match[1];
  const versionMatch = reference.match(/-V(\d{4,})/i);
  const version = versionMatch ? versionMatch[1] : "";

  if (!version || version.length < 4) return { reference, version, versionOrderable: 0 };

  const mm = parseInt(version.slice(0, 2), 10) || 0;
  const yy = parseInt(version.slice(2, 4), 10) || 0;
  const versionOrderable = mm * 100 + yy;

  return {
    reference,
    version,
    versionOrderable,
  };
}
