import { describe, it, expect } from "vitest";
import { detectAgenceFromFilename } from "@/lib/utils/preterme-ird-parser";

// ─── detectAgenceFromFilename (re-exportée depuis preterme-agence) ─────────────

describe("detectAgenceFromFilename (IRD)", () => {
  it("détecte H91358 depuis le nom de fichier IRD Allianz", () => {
    expect(detectAgenceFromFilename(
      "H91358 - LISTE PRETERMES DU Avr2026 BRANCHE I.R.D.Avr2026.xlsx"
    )).toBe("H91358");
  });

  it("détecte H92083 depuis le nom de fichier IRD Allianz", () => {
    expect(detectAgenceFromFilename(
      "H92083 - LISTE PRETERMES DU Avr2026 BRANCHE I.R.D.Avr2026.xlsx"
    )).toBe("H92083");
  });

  it("détecte H91358 en minuscules", () => {
    expect(detectAgenceFromFilename("preterme_h91358_ird.xlsx")).toBe("H91358");
  });

  it("détecte H92083 en minuscules", () => {
    expect(detectAgenceFromFilename("preterme_h92083_ird.xlsx")).toBe("H92083");
  });

  it("retourne null si aucune agence reconnue", () => {
    expect(detectAgenceFromFilename("LISTE PRETERMES BRANCHE I.R.D.xlsx")).toBeNull();
    expect(detectAgenceFromFilename("")).toBeNull();
    expect(detectAgenceFromFilename("H99999.xlsx")).toBeNull();
  });

  it("retourne H91358 si les deux codes sont présents (premier trouvé)", () => {
    expect(detectAgenceFromFilename("H91358_H92083_IRD.xlsx")).toBe("H91358");
  });
});
