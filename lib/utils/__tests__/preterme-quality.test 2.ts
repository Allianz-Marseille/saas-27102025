import { describe, it, expect } from "vitest";
import { normalizeClientName } from "../preterme-quality";

describe("normalizeClientName", () => {
  it("normalise accents, ponctuation et casse", () => {
    expect(normalizeClientName("  Job-Link  ")).toBe("JOB LINK");
    expect(normalizeClientName("Société Générale")).toBe("SOCIETE GENERALE");
  });

  it("compacte les espaces multiples", () => {
    expect(normalizeClientName("COMPAGNIE    PHOCEENNE   DE NEGOCIATI")).toBe(
      "COMPAGNIE PHOCEENNE DE NEGOCIATI"
    );
  });
});
