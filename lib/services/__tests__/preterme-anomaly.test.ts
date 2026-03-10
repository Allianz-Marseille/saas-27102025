import { describe, it, expect } from "vitest";
import { doitEtreConserve, calculerStatsConservation } from "../preterme-anomaly";

describe("doitEtreConserve", () => {
  const SEUIL_ETP = 120;
  const SEUIL_VARIATION = 20;

  it("conserve si ETP >= seuil (OR logic)", () => {
    expect(doitEtreConserve({ etp: 120, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreConserve({ etp: 150, tauxVariation: 5 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil (OR logic)", () => {
    expect(doitEtreConserve({ etp: 50, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreConserve({ etp: 0, tauxVariation: 35 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si les deux seuils sont atteints", () => {
    expect(doitEtreConserve({ etp: 120, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("exclut si aucun seuil n'est atteint", () => {
    expect(doitEtreConserve({ etp: 119, tauxVariation: 19 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
    expect(doitEtreConserve({ etp: 0, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est juste en dessous (>= strict)", () => {
    expect(doitEtreConserve({ etp: 119.9, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est juste en dessous (>= strict)", () => {
    expect(doitEtreConserve({ etp: 0, tauxVariation: 19.9 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est null", () => {
    expect(doitEtreConserve({ etp: null, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est null", () => {
    expect(doitEtreConserve({ etp: 0, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("conserve si ETP >= seuil même avec TauxVariation null", () => {
    expect(doitEtreConserve({ etp: 120, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil même avec ETP null", () => {
    expect(doitEtreConserve({ etp: null, tauxVariation: 25 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve tout quand les deux seuils sont à 0", () => {
    expect(doitEtreConserve({ etp: null, tauxVariation: null }, 0, 0)).toBe(true);
    expect(doitEtreConserve({ etp: null, tauxVariation: 0 }, 0, 0)).toBe(true);
    expect(doitEtreConserve({ etp: 0, tauxVariation: null }, 0, 0)).toBe(true);
  });
});

describe("calculerStatsConservation", () => {
  it("calcule le ratio correctement", () => {
    const clients = [
      { etp: 150, tauxVariation: 0 },   // conservé (ETP)
      { etp: 50,  tauxVariation: 25 },  // conservé (variation)
      { etp: 50,  tauxVariation: 10 },  // exclu
      { etp: 50,  tauxVariation: 10 },  // exclu
    ];
    const stats = calculerStatsConservation(clients, 120, 20);
    expect(stats.total).toBe(4);
    expect(stats.conserves).toBe(2);
    expect(stats.exclus).toBe(2);
    expect(stats.ratioConservation).toBe(50);
  });

  it("retourne 0 pour une liste vide", () => {
    const stats = calculerStatsConservation([], 120, 20);
    expect(stats.total).toBe(0);
    expect(stats.conserves).toBe(0);
    expect(stats.ratioConservation).toBe(0);
  });

  it("respecte les seuils personnalisés", () => {
    const clients = [{ etp: 100, tauxVariation: 15 }];
    // Seuils abaissés : doit être conservé
    expect(calculerStatsConservation(clients, 100, 15).conserves).toBe(1);
    // Seuils standards : doit être exclu
    expect(calculerStatsConservation(clients, 120, 20).conserves).toBe(0);
  });
});
