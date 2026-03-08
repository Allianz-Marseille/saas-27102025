import { describe, it, expect } from "vitest";
import { calculateLiberal } from "../engine-liberaux";
import { PASS_2026, LIBERAL_RAM_PLAFOND, LIBERAL_IJ_MAX_JOUR } from "../constants";

const PASS3 = PASS_2026 * 3; // 144 180 €

describe("calculateLiberal — IJ CPAM J4-J90", () => {
  it("RAM = PASS → IJ CPAM = RAM/730 × 30 €/mois", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0 });
    const ij_jour = Math.round((PASS_2026 / 730) * 100) / 100;
    expect(r.ij_cpam_jour).toBeCloseTo(ij_jour, 2);
    expect(r.ij_cpam_mois_j4_j90).toBeCloseTo(ij_jour * 30, 1);
  });

  it("RAM = 3 PASS → IJ CPAM plafonnée à 197.50 €/j", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS3, besoinMaintienRevenu: 0 });
    expect(r.ij_cpam_jour).toBe(LIBERAL_IJ_MAX_JOUR);
    expect(r.ij_cpam_mois_j4_j90).toBeCloseTo(197.50 * 30, 1);
  });

  it("RAM > 3 PASS → IJ CPAM bloquée + alerte plafond", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS3 + 10000, besoinMaintienRevenu: 0 });
    expect(r.ij_cpam_jour).toBe(LIBERAL_IJ_MAX_JOUR);
    expect(r.ram_plafonne).toBe(LIBERAL_RAM_PLAFOND);
    expect(r.alertes.some((a) => a.includes("3 PASS"))).toBe(true);
  });

  it("gap J4-J90 = 0 si besoin <= IJ CPAM mensuelle", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS3, besoinMaintienRevenu: 100 });
    expect(r.gap_j4_j90_mois).toBe(0);
  });

  it("gap J4-J90 positif si besoin > IJ CPAM", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 5000 });
    expect(r.gap_j4_j90_mois).toBeGreaterThan(0);
    const expected = Math.round((5000 - r.ij_cpam_mois_j4_j90) * 100) / 100;
    expect(r.gap_j4_j90_mois).toBeCloseTo(expected, 2);
  });
});

describe("calculateLiberal — rupture J91 (toujours présente)", () => {
  it("rupture_j91 = true pour tout libéral", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.rupture_j91).toBe(true);
  });

  it("alerte_rupture_j91 toujours dans alertes", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.alertes).toContain(r.alerte_rupture_j91);
  });

  it("alerte mentionne 91ème jour", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.alerte_rupture_j91).toMatch(/91/);
  });
});

describe("calculateLiberal — relais CIPAV (0 €/j)", () => {
  it("CIPAV → IJ J91 = 0, gap total = besoin", () => {
    const besoin = 3000;
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: besoin, caissePro: "CIPAV" });
    expect(r.caisse_ij_jour_j91).toBe(0);
    expect(r.ij_totale_mois_j91).toBe(0);
    expect(r.gap_j91_plus_mois).toBe(besoin);
    expect(r.alerte_rupture_j91).toMatch(/AUCUNE IJ/);
  });
});

describe("calculateLiberal — relais CARPIMKO (57.10 €/j)", () => {
  it("CARPIMKO → IJ J91 = 57.10 €/j, durée max 365j", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0, caissePro: "CARPIMKO" });
    expect(r.caisse_ij_jour_j91).toBe(57.10);
    expect(r.caisse_duree_max_j).toBe(365);
    expect(r.ij_totale_mois_j91).toBeCloseTo(57.10 * 30, 1);
  });

  it("CARPIMKO avec besoin élevé → gap résiduel > 0", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 5000, caissePro: "CARPIMKO" });
    const expected = Math.max(0, Math.round((5000 - 57.10 * 30) * 100) / 100);
    expect(r.gap_j91_plus_mois).toBeCloseTo(expected, 1);
  });
});

describe("calculateLiberal — relais CARMF (3 classes)", () => {
  it("RAM < 1 PASS → CARMF classe A : 72 €/j", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: 30000, besoinMaintienRevenu: 0, caissePro: "CARMF" });
    expect(r.caisse_ij_jour_j91).toBe(72);
    expect(r.caisse_duree_max_j).toBe(1095);
  });

  it("RAM entre 1 et 3 PASS → CARMF classe B : 110 €/j", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: 80000, besoinMaintienRevenu: 0, caissePro: "CARMF" });
    expect(r.caisse_ij_jour_j91).toBe(110);
  });

  it("RAM >= 3 PASS → CARMF classe C : 145 €/j", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS3 + 1, besoinMaintienRevenu: 0, caissePro: "CARMF" });
    expect(r.caisse_ij_jour_j91).toBe(145);
  });
});

describe("calculateLiberal — alertes métier", () => {
  it("frais pro > 0 → alerte frais professionnels", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0, besoinFraisPro: 500 });
    expect(r.alertes.some((a) => a.includes("Frais professionnels"))).toBe(true);
  });

  it("nbEnfants > 0 → alerte volet familial", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0, nbEnfants: 2 });
    expect(r.alertes.some((a) => a.includes("Rente Éducation"))).toBe(true);
  });

  it("régime retourné = LIBERAL", () => {
    const r = calculateLiberal({ regime: "LIBERAL", ram: PASS_2026, besoinMaintienRevenu: 0 });
    expect(r.regime).toBe("LIBERAL");
  });
});
