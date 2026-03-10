/**
 * Parser Excel pour les exports de prétermes Allianz (périmètre Auto)
 *
 * Schéma : 20 colonnes fixes, identifiées par leur libellé en-tête (avec trim).
 * Identification de l'agence : nom de fichier contenant "H91358" ou "H92083".
 */

import ExcelJS from "exceljs";
import type { AgenceCode } from "@/types/preterme";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ParsedPretermeRow {
  // Colonnes export Allianz
  nomClient: string;
  numeroContrat: string;
  brancheContrat: string;
  echeancePrincipale: string;
  codeProduit: string;
  modeReglement: string;
  codeFractionnement: string;
  primeTTCAnnuellePrecedente: number | null;
  primeTTCAnnuelleActualisee: number | null;
  tauxVariation: number | null;
  surveillancePortefeuille: string;
  avantageClient: string;
  formule: string;
  packs: string;
  nbSinistres: number | null;
  bonusMalus: string;
  etp: number | null;
  codeGestionCentrale: string;
  tauxModulationCommission: string;
  dateDernierAvenant: string;
  // Méta
  ligneSource: number;
}

export interface PretermeParseResult {
  rows: ParsedPretermeRow[];
  agenceDetectee: AgenceCode | null;
  erreurs: Array<{ ligne: number; message: string }>;
  nbLignesTotal: number;
  nbLignesValides: number;
}

// ─── Mapping headers → clés ───────────────────────────────────────────────────

/** Normalise un libellé de colonne : trim + lowercase + supprime accents */
function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const HEADER_MAP: Record<string, keyof ParsedPretermeRow> = {
  "nom du client": "nomClient",
  "n de contrat": "numeroContrat",
  "no de contrat": "numeroContrat",
  "n° de contrat": "numeroContrat",
  "branche": "brancheContrat",
  "echeance principale": "echeancePrincipale",
  "echeance": "echeancePrincipale",
  "code produit": "codeProduit",
  "mode de reglement": "modeReglement",
  "code fractionnement": "codeFractionnement",
  "prime ttc annuelle precedente": "primeTTCAnnuellePrecedente",
  "prime ttc annuelle actualisee": "primeTTCAnnuelleActualisee",
  "taux de variation": "tauxVariation",
  "surveillance portefeuille": "surveillancePortefeuille",
  "avantage client": "avantageClient",
  "formule": "formule",
  "packs": "packs",
  "nb sinistres": "nbSinistres",
  "bonus malus": "bonusMalus",
  "bonus/malus": "bonusMalus",
  "etp": "etp",
  "code gestion centrale": "codeGestionCentrale",
  "taux de modulation commission": "tauxModulationCommission",
  "date d effet du dernier avenant": "dateDernierAvenant",
  "date du dernier avenant": "dateDernierAvenant",
};

// ─── Helpers de conversion ────────────────────────────────────────────────────

function cellToString(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "object" && "result" in v) return String((v as ExcelJS.CellFormulaValue).result ?? "").trim();
  if (typeof v === "object" && "richText" in v) {
    return (v as ExcelJS.CellRichTextValue).richText.map((r) => r.text).join("").trim();
  }
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).trim();
}

function cellToNumber(cell: ExcelJS.Cell): number | null {
  const v = cell.value;
  if (v === null || v === undefined || v === "") return null;

  let raw: string | number;
  if (typeof v === "object" && "result" in v) {
    raw = (v as ExcelJS.CellFormulaValue).result as string | number ?? "";
  } else if (typeof v === "number") {
    raw = v;
  } else {
    raw = String(v).trim();
  }

  if (typeof raw === "number") return isNaN(raw) ? null : raw;

  // Nettoyage format français : "1 234,56" → 1234.56
  const cleaned = String(raw).replace(/\s/g, "").replace(",", ".");
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? null : parsed;
}

function excelDateToISO(v: ExcelJS.CellValue): string {
  if (!v) return "";
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === "number") {
    // Date Excel : jours depuis 1899-12-30
    const d = new Date(Math.round((v - 25569) * 86400 * 1000));
    return d.toISOString().slice(0, 10);
  }
  return String(v).trim();
}

// ─── Détection agence ─────────────────────────────────────────────────────────

export function detectAgenceFromFilename(filename: string): AgenceCode | null {
  if (filename.includes("H91358") || filename.includes("h91358")) return "H91358";
  if (filename.includes("H92083") || filename.includes("h92083")) return "H92083";
  return null;
}

// ─── Parser principal ─────────────────────────────────────────────────────────

export async function parsePretermeExcel(
  buffer: Buffer,
  filename: string
): Promise<PretermeParseResult> {
  const agenceDetectee = detectAgenceFromFilename(filename);
  const erreurs: Array<{ ligne: number; message: string }> = [];
  const rows: ParsedPretermeRow[] = [];

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);

  const sheet = workbook.worksheets[0];
  if (!sheet) throw new Error("Aucune feuille trouvée dans le fichier Excel.");

  // ── Lire et mapper les en-têtes (ligne 1) ──
  const headerRow = sheet.getRow(1);
  const colIndex: Partial<Record<keyof ParsedPretermeRow, number>> = {};

  headerRow.eachCell((cell, colNumber) => {
    const label = normalizeHeader(cellToString(cell));
    const key = HEADER_MAP[label];
    if (key) colIndex[key] = colNumber;
  });

  // Vérifier les colonnes obligatoires
  const required: (keyof ParsedPretermeRow)[] = [
    "nomClient", "numeroContrat", "primeTTCAnnuellePrecedente",
    "primeTTCAnnuelleActualisee", "tauxVariation", "etp",
  ];
  const missing = required.filter((k) => !colIndex[k]);
  if (missing.length > 0) {
    throw new Error(
      `Colonnes obligatoires introuvables : ${missing.join(", ")}. ` +
      `Vérifiez que le fichier est bien un export préterme Allianz.`
    );
  }

  // ── Parser les lignes de données ──
  let nbLignesTotal = 0;

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header

    // Ignorer les lignes vides (no nomClient + no numeroContrat)
    const nomRaw = colIndex.nomClient ? cellToString(row.getCell(colIndex.nomClient)) : "";
    const contratRaw = colIndex.numeroContrat ? cellToString(row.getCell(colIndex.numeroContrat)) : "";
    if (!nomRaw && !contratRaw) return;

    nbLignesTotal++;

    try {
      const get = (k: keyof ParsedPretermeRow) =>
        colIndex[k] ? row.getCell(colIndex[k]!) : null;

      // Dates
      const echeanceCell = get("echeancePrincipale");
      const echeance = echeanceCell ? excelDateToISO(echeanceCell.value) : "";
      const dateAvenantCell = get("dateDernierAvenant");
      const dateAvenant = dateAvenantCell ? excelDateToISO(dateAvenantCell.value) : "";

      const parsed: ParsedPretermeRow = {
        nomClient:                   nomRaw,
        numeroContrat:               contratRaw,
        brancheContrat:              get("brancheContrat") ? cellToString(row.getCell(colIndex.brancheContrat!)) : "",
        echeancePrincipale:          echeance,
        codeProduit:                 get("codeProduit") ? cellToString(row.getCell(colIndex.codeProduit!)) : "",
        modeReglement:               get("modeReglement") ? cellToString(row.getCell(colIndex.modeReglement!)) : "",
        codeFractionnement:          get("codeFractionnement") ? cellToString(row.getCell(colIndex.codeFractionnement!)) : "",
        primeTTCAnnuellePrecedente:  get("primeTTCAnnuellePrecedente") ? cellToNumber(row.getCell(colIndex.primeTTCAnnuellePrecedente!)) : null,
        primeTTCAnnuelleActualisee:  get("primeTTCAnnuelleActualisee") ? cellToNumber(row.getCell(colIndex.primeTTCAnnuelleActualisee!)) : null,
        tauxVariation:               get("tauxVariation") ? cellToNumber(row.getCell(colIndex.tauxVariation!)) : null,
        surveillancePortefeuille:    get("surveillancePortefeuille") ? cellToString(row.getCell(colIndex.surveillancePortefeuille!)) : "",
        avantageClient:              get("avantageClient") ? cellToString(row.getCell(colIndex.avantageClient!)) : "",
        formule:                     get("formule") ? cellToString(row.getCell(colIndex.formule!)) : "",
        packs:                       get("packs") ? cellToString(row.getCell(colIndex.packs!)) : "",
        nbSinistres:                 get("nbSinistres") ? cellToNumber(row.getCell(colIndex.nbSinistres!)) : null,
        bonusMalus:                  get("bonusMalus") ? cellToString(row.getCell(colIndex.bonusMalus!)) : "",
        etp:                         get("etp") ? cellToNumber(row.getCell(colIndex.etp!)) : null,
        codeGestionCentrale:         get("codeGestionCentrale") ? cellToString(row.getCell(colIndex.codeGestionCentrale!)) : "",
        tauxModulationCommission:    get("tauxModulationCommission") ? cellToString(row.getCell(colIndex.tauxModulationCommission!)) : "",
        dateDernierAvenant:          dateAvenant,
        ligneSource:                 rowNumber,
      };

      rows.push(parsed);
    } catch (e) {
      erreurs.push({
        ligne: rowNumber,
        message: e instanceof Error ? e.message : "Erreur inconnue",
      });
    }
  });

  return {
    rows,
    agenceDetectee,
    erreurs,
    nbLignesTotal,
    nbLignesValides: rows.length,
  };
}
