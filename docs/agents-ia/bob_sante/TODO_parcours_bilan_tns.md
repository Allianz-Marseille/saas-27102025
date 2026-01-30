# TODO — Parcours Bilan prévoyance TNS

Référence : [parcours_bilan_tns.md](./parcours_bilan_tns.md) — Scénarios : [scenarios-test-parcours-bilan-tns.md](./scenarios-test-parcours-bilan-tns.md)

---

## Ce qui est fait

| # | Élément | Détail |
|---|--------|--------|
| 1 | **Spécification parcours** | `parcours_bilan_tns.md` : 5 étapes (collecte, revenu, besoins, obligations, synthèse), questions bot / réponses user / suite. |
| 2 | **Nota grandes masses** | Bilan faisable sans documents financiers ; option « grandes masses » (revenu, bénéfice, cotisations, CA) documentée. |
| 3 | **Raccourci interface Bob** | Bouton « Bilan prévoyance TNS » dans les suggestions de démarrage → message d’amorce envoyé. |
| 4 | **Base de connaissances Bob** | `docs/knowledge/bob/parcours-bilan-tns.md` chargé par `loadBobKnowledge()`. |
| 5 | **Règle prompt Bob** | `bob-system-prompt.ts` : règle « Bilan prévoyance TNS (parcours guidé) » + option grandes masses sans documents. |
| 6 | **Rappel d’étape** | Si l’utilisateur demande « Où en est-on ? » / « Récap », Bob résume l’étape en cours, les infos collectées et propose la prochaine question (parcours + knowledge + prompt). |
| 7 | **Scénarios de test** | [scenarios-test-parcours-bilan-tns.md](./scenarios-test-parcours-bilan-tns.md) : 5 scénarios (BNC, BIC, auto-entrepreneur, rappel d’étape, upload) + checklist régression. |
| 8 | **Liens CE_QUI_RESTE_A_FAIRE** | Lien vers parcours et suivi dans [CE_QUI_RESTE_A_FAIRE.md](./CE_QUI_RESTE_A_FAIRE.md). |

---

## À faire (tests manuels)

| # | Tâche | Priorité | Commentaire |
|---|--------|----------|-------------|
| 1 | **Tests manuels parcours** | Haute | Lancer le parcours via le bouton « Bilan prévoyance TNS », répondre étape par étape (situation familiale → profession → grandes masses → besoins → synthèse). Vérifier que Bob pose 1–2 questions à la fois, résume, propose la suite. Voir [scénarios](./scenarios-test-parcours-bilan-tns.md). |
| 2 | **Test sans documents** | Haute | Faire un bilan en ne donnant que les grandes masses (ex. bénéfice 45 000 €, cotisations 18 000 €) ; vérifier qu’aucune liasse n’est exigée. |
| 3 | **Test avec upload** | Moyenne | En cours de parcours, envoyer une 2035 ou 2033 ; vérifier que Bob extrait les montants (formules IJ, alerte Frais Fixes si pertinent). |
| 4 | **Vérifier synthèse finale** | Moyenne | À la fin du parcours, Bob doit proposer résumé pour expert, export PDF, lien devis (fiche `liens-devis-allianz.md`). |
| 5 | **Test rappel d’étape** | Moyenne | En cours de parcours, demander « Où en est-on ? » ; Bob doit résumer l’étape et les infos collectées, puis proposer la suite. |

---

## Références croisées

- Parcours détaillé : [parcours_bilan_tns.md](./parcours_bilan_tns.md)
- Scénarios de test : [scenarios-test-parcours-bilan-tns.md](./scenarios-test-parcours-bilan-tns.md)
- Knowledge Bob (version chargée) : `docs/knowledge/bob/parcours-bilan-tns.md`
- Prompt Bob : `lib/assistant/bob-system-prompt.ts` (règle « Bilan prévoyance TNS »)
- Suggestions démarrage : `app/commun/agents-ia/bob-sante/page.tsx` (`SUGGESTIONS_DEMARRAGE`)
- Fiches Bob utilisées : `prevoyance-tns-regles-ij.md`, `2035-bilan-tns.md`, `audit-diagnostic-conseiller.md`, `regimes-obligatoires-ccn.md`, `liens-devis-allianz.md`
