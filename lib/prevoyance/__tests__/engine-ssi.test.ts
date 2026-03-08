import { describe, it, expect } from "vitest";
import { calculateSSI } from "../engine-ssi";
import { PASS_2026 } from "../constants";

// Helpers
const SEUIL_EXCLUSION = PASS_2026 * 0.10; // 4 806 €

describe("calculateSSI — éligibilité", () => {
  it("RAM = 0 → non éligible, IJ = 0", () => {
    const r = calculateSSI({ regime: "SSI", ram: 0, besoinMaintienRevenu: 2000 });
    expect(r.eligible).toBe(false);
    expect(r.ij_brute_jour).toBe(0);
    expect(r.ij_nette_jour).toBe(0);
    expect(r.ij_nette_mois).toBe(0);
  });

  it("RAM = seuil exact (4806 €) → éligible", () => {
    const r = calculateSSI({ regime: "SSI", ram: SEUIL_EXCLUSION, besoinMaintienRevenu: 0 });
    expect(r.eligible).toBe(true);
    expect(r.ij_brute_jour).toBeGreaterThan(0);
  });

  it("RAM < seuil → alerte non-éligibilité présente", () => {
    const r = calculateSSI({ regime: "SSI", ram: 4000, besoinMaintienRevenu: 2000 });
    expect(r.alertes.some((a) => a.includes("AUCUNE IJ"))).toBe(true);
  });
});

describe("calculateSSI — IJ (formule RAM/730)", () => {
  it("RAM = PASS (48 060 €) → IJ brute max ~65.84 €/j", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    // RAM_plafonne = PASS, IJ = 48060/730
    expect(r.ij_brute_jour).toBeCloseTo(65.84, 1);
  });

  it("IJ nette = IJ brute × (1 - 0.067)", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    const expectedNette = Math.round(r.ij_brute_jour * 0.933 * 100) / 100;
    expect(r.ij_nette_jour).toBeCloseTo(expectedNette, 2);
  });

  it("IJ mensuelle = IJ nette × 30", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    const expectedMois = Math.round(r.ij_nette_jour * 30 * 100) / 100;
    expect(r.ij_nette_mois).toBeCloseTo(expectedMois, 2);
  });

  it("RAM > PASS → plafond à 1 PASS (IJ ne dépasse pas max)", () => {
    const r1 = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    const r2 = calculateSSI({ regime: "SSI", ram: PASS_2026 * 2, besoinMaintienRevenu: 0 });
    expect(r2.ij_brute_jour).toBe(r1.ij_brute_jour);
    expect(r2.ij_nette_mois).toBe(r1.ij_nette_mois);
    expect(r2.alertes.some((a) => a.includes("plafond"))).toBe(true);
  });
});

describe("calculateSSI — gaps maintien de revenu", () => {
  it("gap = 0 si besoin <= IJ nette mensuelle", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 100 });
    expect(r.gap_maintien_revenu_mois).toBe(0);
  });

  it("gap = besoin - IJ nette mois si besoin > IJ", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 5000 });
    const expected = Math.max(0, Math.round((5000 - r.ij_nette_mois) * 100) / 100);
    expect(r.gap_maintien_revenu_mois).toBeCloseTo(expected, 2);
  });

  it("gap frais pro = besoinFraisPro (SSI ne couvre jamais les frais pro)", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0, besoinFraisPro: 800 });
    expect(r.gap_frais_pro_mois).toBe(800);
    expect(r.alertes.some((a) => a.includes("frais professionnels"))).toBe(true);
  });
});

describe("calculateSSI — invalidité", () => {
  it("Cat1 = 30 % RAM plafonné, max 14 418 €/an", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.rente_invalidite_cat1_an).toBeCloseTo(PASS_2026 * 0.30, 0);
    expect(r.rente_invalidite_cat1_an).toBeLessThanOrEqual(14418);
  });

  it("Cat2 = 50 % RAM plafonné, max 24 030 €/an", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.rente_invalidite_cat2_an).toBeCloseTo(PASS_2026 * 0.50, 0);
    expect(r.rente_invalidite_cat2_an).toBeLessThanOrEqual(24030);
  });

  it("RAM faible → rente Cat2 < besoin → gap > 0", () => {
    const besoin = 2000; // 24 000 €/an
    const r = calculateSSI({ regime: "SSI", ram: 10000, besoinMaintienRevenu: besoin });
    expect(r.gap_invalidite_cat2_an).toBeGreaterThan(0);
  });
});

describe("calculateSSI — décès", () => {
  it("capital décès sans enfant = 20 % PASS = 9 612 €", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0, nbEnfants: 0 });
    expect(r.capital_deces).toBeCloseTo(PASS_2026 * 0.20, 0);
  });

  it("capital décès avec 2 enfants = 20 % PASS + 2 × 5 % PASS", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0, nbEnfants: 2 });
    const expected = Math.round((PASS_2026 * 0.20 + 2 * PASS_2026 * 0.05) * 100) / 100;
    expect(r.capital_deces).toBeCloseTo(expected, 0);
  });
});

describe("calculateSSI — couverture", () => {
  it("durée max = 1095 jours (3 ans)", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.couverture_duree_max_jours).toBe(1095);
  });

  it("régime retourné = SSI", () => {
    const r = calculateSSI({ regime: "SSI", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.regime).toBe("SSI");
  });
});
