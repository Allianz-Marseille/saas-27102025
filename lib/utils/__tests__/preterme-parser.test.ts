import { describe, it, expect } from "vitest";
import { detectAgenceFromFilename } from "@/lib/utils/preterme-agence";

describe("detectAgenceFromFilename", () => {
  it("détecte H91358 en majuscules", () => {
    expect(detectAgenceFromFilename("export_H91358_2026-04.xlsx")).toBe("H91358");
    expect(detectAgenceFromFilename("H91358.xlsx")).toBe("H91358");
  });

  it("détecte H91358 en minuscules", () => {
    expect(detectAgenceFromFilename("export_h91358_2026-04.xlsx")).toBe("H91358");
  });

  it("détecte H92083 en majuscules", () => {
    expect(detectAgenceFromFilename("Preterme_H92083_Avril2026.xlsx")).toBe("H92083");
  });

  it("détecte H92083 en minuscules", () => {
    expect(detectAgenceFromFilename("preterme_h92083.xlsx")).toBe("H92083");
  });

  it("retourne null si aucune agence reconnue", () => {
    expect(detectAgenceFromFilename("preterme_inconnu.xlsx")).toBeNull();
    expect(detectAgenceFromFilename("")).toBeNull();
    expect(detectAgenceFromFilename("export_H99999.xlsx")).toBeNull();
  });

  it("retourne H91358 si les deux codes sont présents (premier trouvé)", () => {
    // Le code H91358 est vérifié en premier dans la fonction
    expect(detectAgenceFromFilename("H91358_H92083.xlsx")).toBe("H91358");
  });
});
