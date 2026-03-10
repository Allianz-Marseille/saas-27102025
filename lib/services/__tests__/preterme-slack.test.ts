import { describe, it, expect } from "vitest";
import { buildSlackBlocks } from "../preterme-slack";
import type { SlackSynthesisData } from "../preterme-slack";

const BASE_DATA: SlackSynthesisData = {
  moisKey: "2026-04",
  agences: [
    { code: "H91358", nom: "La Corniche", globaux: 100, conserves: 60 },
    { code: "H92083", nom: "La Rouvière", globaux: 80, conserves: 40 },
  ],
  parCharge: {
    Corentin: 15,
    Emma: 12,
    Matthieu: 20,
    Donia: 13,
  },
  nbSocietesEnAttente: 0,
  seuilEtp: 120,
  seuilVariation: 20,
};

describe("buildSlackBlocks", () => {
  it("génère des blocs Slack non vides", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    expect(blocks.length).toBeGreaterThan(0);
  });

  it("inclut le header avec le mois", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const header = blocks.find((b) => b.type === "header");
    expect(header).toBeDefined();
    expect(header?.text?.text).toContain("avril 2026");
  });

  it("calcule le total global correctement", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const synthese = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("180 prétermes importés")
    );
    expect(synthese).toBeDefined();
    expect(synthese?.text?.text).toContain("100 conservés");
    expect(synthese?.text?.text).toContain("56%"); // Math.round(100/180*100) = 56
  });

  it("inclut les infos par agence", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const agenceBlock = blocks.find(
      (b) => b.type === "section" && b.fields?.some((f) => f.text.includes("H91358"))
    );
    expect(agenceBlock).toBeDefined();
  });

  it("inclut la répartition par CDC", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const cdcBlock = blocks.find(
      (b) => b.type === "section" && b.text?.text?.includes("Matthieu")
    );
    expect(cdcBlock).toBeDefined();
    expect(cdcBlock?.text?.text).toContain("20");
  });

  it("n'ajoute pas le bloc sociétés en attente si 0", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const attenteBlock = blocks.find(
      (b) => b.text?.text?.includes("société(s) en attente")
    );
    expect(attenteBlock).toBeUndefined();
  });

  it("ajoute le bloc sociétés en attente si > 0", () => {
    const data = { ...BASE_DATA, nbSocietesEnAttente: 3 };
    const blocks = buildSlackBlocks(data);
    const attenteBlock = blocks.find(
      (b) => b.text?.text?.includes("société(s) en attente")
    );
    expect(attenteBlock).toBeDefined();
    expect(attenteBlock?.text?.text).toContain("3");
  });

  it("inclut les seuils appliqués dans le contexte", () => {
    const blocks = buildSlackBlocks(BASE_DATA);
    const contexteBlock = blocks.find((b) => b.type === "context");
    expect(contexteBlock).toBeDefined();
    expect(
      (contexteBlock?.elements as Array<{ text: string }>)?.[0]?.text
    ).toContain("ETP ≥ 120");
    expect(
      (contexteBlock?.elements as Array<{ text: string }>)?.[0]?.text
    ).toContain("20%");
  });
});
