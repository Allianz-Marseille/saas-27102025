# Mapping thèmes Bob Santé → Fiches de connaissance

Chaque bouton d’accueil « Que souhaitez-vous faire ? » est relié à une ou plusieurs fiches de la base Bob. Bob s’appuie sur ces fiches pour structurer sa réponse.

**Base de fiches :** `docs/knowledge/bob/` et `docs/knowledge/bob/ro/`.  
**Source de vérité :** `docs/knowledge/bob/00-SOURCE-DE-VERITE.md`.

---

## Tableau de correspondance

| Thème (bouton UI) | Fiche(s) principale(s) | Fiches complémentaires |
|-------------------|-------------------------|-------------------------|
| Bilan prévoyance TNS | `parcours-bilan-tns.md`, `logique-parcours-bilan-tns.md` | `regimes-obligatoires-tns.md`, `ro/[caisse].md`, `synthese-comparative-ro-tns.md`, `methodologie-conseil-prevoyance-tns.md` |
| Rédiger une DUE (contrat groupe) | `due-contrat-groupe.md`, `reglementaire-due-standard.md` | `references.md` |
| Vérifier la carence d'un RO (ex: CARPIMKO) | `ro/carpimko.md`, `ro/ssi.md`, autres `ro/*.md` | `parcours-bilan-tns.md` (étape 7), `synthese-comparative-ro-tns.md` |
| Calculer le plafond Madelin | `plafond-madelin.md` | `regulatory-figures.ts` (chiffres injectés), `prevoyance-tns-regles-ij.md`, `fiscalite-entree-sortie-prevoyance.md` |
| Audit 1,50% TA (Obligation Cadre) | `ccn-top10-obligations.md` | `regimes-obligatoires-ccn.md` |
| Risques invalidité Pro vs Fonctionnelle | `invalidite-pro-vs-fonctionnelle.md` | `methodologie-conseil-prevoyance-tns.md`, `synthese-comparative-ro-tns.md` |
| Analyser une 2035 (IJ et frais généraux) | `2035-bilan-tns.md`, `templates-reponse-modules-bob.md` (§ 1) | `parcours-bilan-tns.md`, `prevoyance-tns-regles-ij.md` |
| Arguments pour rassurer un client TNS | `commercial-objections-reponses.md` | `methodologie-conseil-prevoyance-tns.md` |
| Différence régime général / SSI | `ro/ssi.md`, `docs/agents-ia/bob-sante/regime-general.md`, `docs/agents-ia/bob-sante/ssi.md` | `regimes-obligatoires-tns.md`, `regimes-obligatoires-ccn.md` |
| Garanties minimales entreprise | `garanties-minimales-entreprise.md` | `ccn-top10-obligations.md`, `regimes-obligatoires-ccn.md`, `sante-panier-soins-minimal.md` |
| Comprendre une fiche de paie (santé) | `fiche-paie-sante.md` | — |
| Comparer des contrats prévoyance | `templates-reponse-modules-bob.md` (§ 2) | `synthese-comparative-ro-tns.md`, `methodologie-conseil-prevoyance-tns.md` |
| Régime TNS vs salarié | `regimes-obligatoires-tns.md`, `regimes-obligatoires-ccn.md` | `ro/ssi.md`, `synthese-comparative-ro-tns.md` |
| Aide retraite / seniors | `templates-reponse-modules-bob.md` (§ 3), `retraite-collective-pero.md` | `fiscalite-entree-sortie-prevoyance.md` |
| Expliquer une attestation mutuelle | `attestation-mutuelle.md` | `sante-panier-soins-minimal.md` |
| Extraire infos bulletin ou contrat | `extraire-infos-bulletin-contrat.md` | — |

---

## Maintenance

- **Nouveau bouton** : ajouter une ligne au tableau et créer la fiche dédiée dans `docs/knowledge/bob/` si besoin, puis l’enregistrer dans `00-SOURCE-DE-VERITE.md`.
- **Fiche renommée / supprimée** : mettre à jour ce mapping et le chargeur `loadBobKnowledge()` si le nom de fichier change.
