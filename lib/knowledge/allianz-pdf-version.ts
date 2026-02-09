/**
 * Parser des noms de fichiers PDF Allianz : référence + version pour détection doublons et comparaison.
 * Patterns : vademecums (REF-REF-Nom_Vmm-yy), Guide (RES...-VmmYY), DG (COM...-VmmYY).
 */

export interface AllianzPdfParsed {
  reference: string;
  version: string;
  versionOrderable: number;
}

/**
 * Normalise une référence pour comparaison (minuscules, espaces/tirets unifiés).
 */
function normalizeReference(ref: string): string {
  return ref
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/_/g, "-")
    .replace(/-+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-|-$/g, "");
}

/**
 * Parse une version Vmm-yy ou Vmmyy en YYYYMM (ex. V04-23 → 202304, V0425 → 202504).
 */
function parseVersionToOrderable(versionStr: string): number {
  const v = versionStr.toUpperCase().replace(/^V/, "").replace(/-/g, "");
  if (v.length === 4) {
    const mm = parseInt(v.slice(0, 2), 10);
    const yy = parseInt(v.slice(2, 4), 10);
    if (Number.isNaN(mm) || Number.isNaN(yy)) return 0;
    const year = yy >= 0 && yy <= 99 ? 2000 + yy : yy;
    if (mm >= 1 && mm <= 12) return year * 100 + mm;
  }
  if (v.length === 5) {
    const mm = parseInt(v.slice(0, 2), 10);
    const yyy = parseInt(v.slice(2, 5), 10);
    if (Number.isNaN(mm) || Number.isNaN(yyy)) return 0;
    const year = yyy >= 200 && yyy <= 299 ? 2000 + (yyy % 100) : yyy >= 2000 ? yyy : 0;
    if (mm >= 1 && mm <= 12 && year >= 2000) return year * 100 + mm;
  }
  return 0;
}

/**
 * Extrait référence et version depuis un nom de fichier Allianz (sans .pdf).
 * Retourne null si le nom ne correspond à aucun pattern Allianz.
 */
export function parseAllianzPdfFilename(filename: string): AllianzPdfParsed | null {
  const base = filename.replace(/\.pdf$/i, "").trim();
  if (!base) return null;

  const vVersionMatch = base.match(/_V(\d{2}-\d{2})(?:_|$|-|\.)/i) ?? base.match(/_V(\d{4})(?:_|$|-|\.)/i);
  if (vVersionMatch) {
    const versionPart = "V" + vVersionMatch[1];
    const versionOrderable = parseVersionToOrderable(versionPart);
    if (versionOrderable === 0) return null;
    const beforeVersion = base.slice(0, base.indexOf("_V" + vVersionMatch[1]));
    const ref = beforeVersion.trim();
    if (ref.length > 0) {
      return {
        reference: normalizeReference(ref),
        version: versionPart,
        versionOrderable,
      };
    }
  }

  const guideMatch = base.match(/\bRES(\d+)-V(\d{4})/i) ?? base.match(/\bRES(\d+)\s*-\s*V(\d{4})/i);
  if (guideMatch) {
    const ref = "guide_souscription_res" + guideMatch[1];
    const versionPart = "V" + guideMatch[2];
    const versionOrderable = parseVersionToOrderable(versionPart);
    if (versionOrderable === 0) return null;
    return {
      reference: normalizeReference(ref),
      version: versionPart,
      versionOrderable,
    };
  }

  const dgMatch = base.match(/\bCOM(\d+)-V(\d{4})/i) ?? base.match(/\bCOM(\d+)\s*-\s*V(\d{4})/i);
  if (dgMatch) {
    const ref = "com" + dgMatch[1];
    const versionPart = "V" + dgMatch[2];
    const versionOrderable = parseVersionToOrderable(versionPart);
    if (versionOrderable === 0) return null;
    return {
      reference: normalizeReference(ref),
      version: versionPart,
      versionOrderable,
    };
  }

  const suffixV = base.match(/-V(\d{2}-\d{2})(?:-|$)/i) ?? base.match(/-V(\d{4})(?:-|$|_)/i);
  if (suffixV) {
    const versionPart = "V" + suffixV[1];
    const versionOrderable = parseVersionToOrderable(versionPart);
    if (versionOrderable === 0) return null;
    const beforeSuffix = base.slice(0, base.indexOf("-V" + suffixV[1]));
    const ref = beforeSuffix.trim();
    if (ref.length > 0) {
      return {
        reference: normalizeReference(ref),
        version: versionPart,
        versionOrderable,
      };
    }
  }

  return null;
}
