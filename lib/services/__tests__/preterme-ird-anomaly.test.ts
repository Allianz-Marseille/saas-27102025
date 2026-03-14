import { describe, it, expect } from "vitest";
import { doitEtreIrdRetenu, calculerIrdStatsConservation } from "../preterme-ird-anomaly";

/**
 * seuilEtp est stocké en décimal (ex: 1.20 = 20% d'augmentation).
 * Comparaison directe : etp >= seuilEtp (PAS de /100).
 */

describe("doitEtreIrdRetenu", () => {
  const SEUIL_ETP = 1.20;       // décimal direct
  const SEUIL_VARIATION = 20;

  it("conserve si ETP décimal >= seuil (OR logic)", () => {
    expect(doitEtreIrdRetenu({ etp: 1.20, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreIrdRetenu({ etp: 1.50, tauxVariation: 5 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil (OR logic)", () => {
    expect(doitEtreIrdRetenu({ etp: 0.5, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
    expect(doitEtreIrdRetenu({ etp: 0, tauxVariation: 35 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si les deux seuils sont atteints", () => {
    expect(doitEtreIrdRetenu({ etp: 1.20, tauxVariation: 20 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("exclut si aucun seuil n'est atteint", () => {
    expect(doitEtreIrdRetenu({ etp: 1.19, tauxVariation: 19 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
    expect(doitEtreIrdRetenu({ etp: 0, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est juste en dessous du seuil décimal (>= strict)", () => {
    expect(doitEtreIrdRetenu({ etp: 1.199, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est juste en dessous (>= strict)", () => {
    expect(doitEtreIrdRetenu({ etp: 0, tauxVariation: 19.9 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si ETP est null", () => {
    expect(doitEtreIrdRetenu({ etp: null, tauxVariation: 0 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("exclut si TauxVariation est null", () => {
    expect(doitEtreIrdRetenu({ etp: 0, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(false);
  });

  it("conserve si ETP >= seuil décimal même avec TauxVariation null", () => {
    expect(doitEtreIrdRetenu({ etp: 1.20, tauxVariation: null }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve si TauxVariation >= seuil même avec ETP null", () => {
    expect(doitEtreIrdRetenu({ etp: null, tauxVariation: 25 }, SEUIL_ETP, SEUIL_VARIATION)).toBe(true);
  });

  it("conserve tout quand les deux seuils sont à 0", () => {
    expect(doitEtreIrdRetenu({ etp: null, tauxVariation: null }, 0, 0)).toBe(true);
    expect(doitEtreIrdRetenu({ etp: null, tauxVariation: 0 }, 0, 0)).toBe(true);
    expect(doitEtreIrdRetenu({ etp: 0, tauxVariation: null }, 0, 0)).toBe(true);
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
    const stats = calculerIrdStatsConservation(clients, 1.20, 20);
    expect(stats.total).toBe(4);
    expect(stats.conserves).toBe(2);
    expect(stats.exclus).toBe(2);
    expect(stats.ratioConservation).toBe(50);
  });

  it("retourne 0 pour une liste vide", () => {
    const stats = calculerIrdStatsConservation([], 1.20, 20);
    expect(stats.total).toBe(0);
    expect(stats.conserves).toBe(0);
    expect(stats.ratioConservation).toBe(0);
  });

  it("respecte les seuils personnalisés (décimal)", () => {
    const clients = [{ etp: 1.00, tauxVariation: 15 }];
    // seuilEtp=1.00 → 1.00 >= 1.00 → conservé
    expect(calculerIrdStatsConservation(clients, 1.00, 20).conserves).toBe(1);
    // seuilEtp=1.20 → 1.00 < 1.20 exclu ; variation 15 < 20 → exclu
    expect(calculerIrdStatsConservation(clients, 1.20, 20).conserves).toBe(0);
  });

  it("seuilVariation seul suffit à conserver", () => {
    const clients = [{ etp: 0, tauxVariation: 20 }];
    expect(calculerIrdStatsConservation(clients, 1.20, 20).conserves).toBe(1);
  });
});
