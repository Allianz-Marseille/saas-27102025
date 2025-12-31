/**
 * Types pour le module Sinistres
 */

export interface CSVImportResult {
  totalLines: number;
  newSinistres: number;
  existingSinistres: number;
  updatedSinistres: number;
  errors: Array<{ line: number; error: string }>;
  csvVersion: string;
  importDate: Date;
}

