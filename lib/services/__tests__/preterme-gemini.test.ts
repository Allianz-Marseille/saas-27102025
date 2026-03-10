import { describe, it, expect } from "vitest";
import { classifierNomAvecHeuristiques, classifierNoms } from "../preterme-gemini";

describe("classifierNomAvecHeuristiques", () => {
  it("classe les noms personne physique évidents en particulier", () => {
    expect(classifierNomAvecHeuristiques("SANTONI MICHEL")?.type).toBe("particulier");
    expect(classifierNomAvecHeuristiques("SABATIER LAURENCE")?.type).toBe("particulier");
    expect(classifierNomAvecHeuristiques("MARTIN RAGET COLIN")?.type).toBe("particulier");
  });

  it("classe les raisons sociales évidentes en société", () => {
    expect(classifierNomAvecHeuristiques("COMPAGNIE PHOCEENNE DE NEGOCIATI")?.type).toBe("societe");
    expect(classifierNomAvecHeuristiques("SCI LES PINS")?.type).toBe("societe");
    expect(classifierNomAvecHeuristiques("ETS DUPONT")?.type).toBe("societe");
  });
});

describe("classifierNoms", () => {
  it("applique les heuristiques même sans clé Gemini", async () => {
    const resultats = await classifierNoms(
      [
        "SANTONI MICHEL",
        "COMPAGNIE PHOCEENNE DE NEGOCIATI",
      ],
      ""
    );

    expect(resultats[0]?.type).toBe("particulier");
    expect(resultats[1]?.type).toBe("societe");
  });
});
