import { describe, it, expect } from "vitest";
import { doitEtreIrdConserve, calculerIrdStatsConservation } from "../preterme-ird-anomaly";

/**
 * Différence clé vs Auto :
 * L'ETP IRD est stocké en décimal (ex: 1.20 = 20% d'augmentation).
 * La config UI stocke seuilEtp en entier (ex: 120 = 1.20).
 * Comparaison : etp >= seuilEtp / 100.
 */

describe("doitEtreIrdConserve", () => {
  const SEUIL_ETP = 120;       // → compare etp >= 1.20
  const SEUIL_VARIATION = 20;  // → compare tauxVariation >= 20

  it("conserve si ETP décimal >= seuil/100 (OR logic)", () => {
    expect(doitEtreIrdConserve({ etp: 1.20, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreIrdConserve({ etp: 1.50, tauxVariation: 5 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil (OR logic)", () => {
    expect(doitEtreIrdConserve({ etp: 0.5, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreIrdConserve({ etp: 0, tauxVariation: 35 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si les deux seuils sont atteints", () => {
    expect(doitEtreIrdConserve({ etp: 1.20, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("exclut si aucun seuil n'est atteint", () => {
    expect(doitEtreIrdConserve({ etp: 1.19, tauxVariation: 19 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
    expect(doitEtreIrdConserve({ etp: 0, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est juste en dessous du seuil décimal (>= strict)", () => {
    expect(doitEtreIrdConserve({ etp: 1.199, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est juste en dessous (>= strict)", () => {
    expect(doitEtreIrdConserve({ etp: 0, tauxVariation: 19.9 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est null", () => {
    expect(doitEtreIrdConserve({ etp: null, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est null", () => {
    expect(doitEtreIrdConserve({ etp: 0, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("conserve si ETP >= seuil décimal même avec TauxVariation null", () => {
    expect(doitEtreIrdConserve({ etp: 1.20, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil même avec ETP null", () => {
    expect(doitEtreIrdConserve({ etp: null, tauxVariation: 25 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve tout quand les deux seuils sont à 0", () => {
    expect(doitEtreIrdConserve({ etp: null, tauxVariation: null }, 0, 0)).toBe(true);
    expect(doitEtreIrdConserve({ etp: null, tauxVariation: 0 }, 0, 0)).toBe(true);
    expect(doitEtreIrdConserve({ etp: 0, tauxVariation: null }, 0, 0)).toBe(true);
  });
});

describe("calculerIrdStatsConservation", () => {
  it("calcule le ratio correctement avec ETP décimal", () => {
    const clients = [
      { etp: 1.50, tauxVariation: 0 },   // conservé (ETP)
      { etp: 0.5,  tauxVariation: 25 },  // conservé (variation)
      { etp: 0.5,  tauxVariation: 10 },  // exclu
      { etp: 0.5,  tauxVariation: 10 },  // exclu
    ];
    const stats = calculerIrdStatsConservation(clients, 120, 20);
    expect(stats.total).toBe(4);
    expect(stats.conserves).toBe(2);
    expect(stats.exclus).toBe(2);
    expect(stats.ratioConservation).toBe(50);
  });

  it("retourne 0 pour une liste vide", () => {
    const stats = calculerIrdStatsConservation([], 120, 20);
    expect(stats.total).toBe(0);
    expect(stats.conserves).toBe(0);
    expect(stats.ratioConservation).toBe(0);
  });

  it("respecte les seuils personnalisés (décimal)", () => {
    const clients = [{ etp: 1.00, tauxVariation: 15 }];
    // seuilEtp=100 → compare >= 1.00 → conservé
    expect(calculerIrdStatsConservation(clients, 100, 20).conserves).toBe(1);
    // seuilEtp=120 → compare >= 1.20 → exclu ; variation 15 < 20 → exclu
    expect(calculerIrdStatsConservation(clients, 120, 20).conserves).toBe(0);
  });

  it("seuilVariation seul suffit à conserver", () => {
    const clients = [{ etp: 0, tauxVariation: 20 }];
    expect(calculerIrdStatsConservation(clients, 120, 20).conserves).toBe(1);
  });
});
