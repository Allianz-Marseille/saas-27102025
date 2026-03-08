import { describe, it, expect } from "vitest";
import {
  formatCurrencyInteger,
  formatThousands,
  parseCurrency,
  calculateTotal,
  calculateResultat,
  calculateGrowthRate,
  getMonthName,
  getMonthShortName,
  extrapolateYear,
} from "../commission-calculator";
import type { AgencyCommission } from "@/types";

// ─── formatCurrencyInteger ───────────────────────────────────────────────────
describe("formatCurrencyInteger", () => {
  it("formate 83717 → contient '83' et '717' et '€'", () => {
    const result = formatCurrencyInteger(83717);
    expect(result).toContain("€");
    expect(result).toContain("83");
    expect(result).toContain("717");
  });

  it("formate 0 → '0 €'", () => {
    const result = formatCurrencyInteger(0);
    expect(result).toMatch(/0/);
    expect(result).toContain("€");
  });

  it("pas de décimales", () => {
    const result = formatCurrencyInteger(1000);
    expect(result).not.toMatch(/[.,]\d{2}/);
  });
});

// ─── formatThousands ─────────────────────────────────────────────────────────
describe("formatThousands", () => {
  it("formate sans symbole €", () => {
    const result = formatThousands(12345);
    expect(result).not.toContain("€");
    expect(result).toMatch(/12/);
    expect(result).toMatch(/345/);
  });
});

// ─── parseCurrency ───────────────────────────────────────────────────────────
describe("parseCurrency", () => {
  it("parse '83 717 €' → 83717", () => {
    expect(parseCurrency("83 717 €")).toBe(83717);
  });

  it("parse '83717' → 83717", () => {
    expect(parseCurrency("83717")).toBe(83717);
  });

  it("parse chaîne vide → 0", () => {
    expect(parseCurrency("")).toBe(0);
  });

  it("parse 'abc' → 0", () => {
    expect(parseCurrency("abc")).toBe(0);
  });

  it("parse nombre négatif '-5000'", () => {
    expect(parseCurrency("-5000")).toBe(-5000);
  });
});

// ─── calculateTotal ──────────────────────────────────────────────────────────
describe("calculateTotal", () => {
  it("somme 4 valeurs", () => {
    expect(calculateTotal(100, 200, 300, 400)).toBe(1000);
  });

  it("avec zéros", () => {
    expect(calculateTotal(0, 0, 0, 500)).toBe(500);
  });
});

// ─── calculateResultat ───────────────────────────────────────────────────────
describe("calculateResultat", () => {
  it("résultat positif", () => {
    expect(calculateResultat(10000, 6000)).toBe(4000);
  });

  it("résultat négatif si charges > total", () => {
    expect(calculateResultat(5000, 8000)).toBe(-3000);
  });
});

// ─── calculateGrowthRate ─────────────────────────────────────────────────────
describe("calculateGrowthRate", () => {
  it("+50 % si current = 1.5 × previous", () => {
    expect(calculateGrowthRate(15000, 10000)).toBeCloseTo(50, 5);
  });

  it("-20 % si current = 0.8 × previous", () => {
    expect(calculateGrowthRate(8000, 10000)).toBeCloseTo(-20, 5);
  });

  it("previous = 0 → retourne 0 (pas de division par zéro)", () => {
    expect(calculateGrowthRate(5000, 0)).toBe(0);
  });
});

// ─── getMonthName / getMonthShortName ────────────────────────────────────────
describe("getMonthName", () => {
  it("mois 1 = Janvier", () => expect(getMonthName(1)).toBe("Janvier"));
  it("mois 12 = Décembre", () => expect(getMonthName(12)).toBe("Décembre"));
  it("hors borne (0) → chaîne vide", () => expect(getMonthName(0)).toBe(""));
  it("hors borne (13) → chaîne vide", () => expect(getMonthName(13)).toBe(""));
});

describe("getMonthShortName", () => {
  it("mois 1 = Jan", () => expect(getMonthShortName(1)).toBe("Jan"));
  it("mois 8 = Août", () => expect(getMonthShortName(8)).toBe("Août"));
});

// ─── extrapolateYear ─────────────────────────────────────────────────────────

function makeMonth(overrides: Partial<AgencyCommission> = {}): AgencyCommission {
  return {
    id: "test",
    year: 2025,
    month: 1,
    totalCommissions: 0,
    chargesAgence: 0,
    resultat: 0,
    commissionsIARD: 0,
    commissionsVie: 0,
    commissionsCourtage: 0,
    profitsExceptionnels: 0,
    prelevementsJulien: 0,
    prelevementsJeanMichel: 0,
    ...overrides,
  };
}

describe("extrapolateYear", () => {
  it("données vides → tous zéros", () => {
    const r = extrapolateYear([]);
    expect(r.totalCommissions).toBe(0);
    expect(r.monthsCount).toBe(0);
  });

  it("1 mois à 12 000 € → extrapolé 144 000 €/an", () => {
    const data = [makeMonth({ totalCommissions: 12000 })];
    const r = extrapolateYear(data);
    expect(r.totalCommissions).toBe(144000);
    expect(r.monthsCount).toBe(1);
  });

  it("3 mois identiques → même résultat qu'un mois extrapolé", () => {
    const data = [
      makeMonth({ totalCommissions: 10000 }),
      makeMonth({ totalCommissions: 10000 }),
      makeMonth({ totalCommissions: 10000 }),
    ];
    const r = extrapolateYear(data);
    expect(r.totalCommissions).toBe(120000);
    expect(r.monthsCount).toBe(3);
  });

  it("mois sans total ni charges → ignoré (monthsCount ne compte que les mois 'complets')", () => {
    const data = [
      makeMonth({ totalCommissions: 6000 }),
      makeMonth({ totalCommissions: 0, chargesAgence: 0 }), // vide
    ];
    const r = extrapolateYear(data);
    expect(r.monthsCount).toBe(1); // le mois vide est ignoré
    expect(r.totalCommissions).toBe(72000);
  });

  it("charges extrapolées sur 12 mois", () => {
    const data = [makeMonth({ totalCommissions: 10000, chargesAgence: 4000, resultat: 6000 })];
    const r = extrapolateYear(data);
    expect(r.chargesAgence).toBe(48000);
    expect(r.resultat).toBe(72000);
  });
});
