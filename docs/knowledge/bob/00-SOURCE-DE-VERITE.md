# Base de connaissances Bob — Source de vérité

Ce document définit **où se trouve la vérité** pour chaque type d’information et comment maintenir la base de connaissances de façon cohérente. Bob et les conseillers s’y réfèrent pour éviter les doublons et les incohérences.

**Référence :** `docs/agents-ia/bob_sante/bob_sante.md` § Architecture de la Base de Connaissances Bob.

---

## 1. Source unique par type d’information

| Type d’information | Source unique | Où mettre à jour |
|--------------------|----------------|------------------|
| **Chiffres réglementaires** (PASS, année, plafonds Madelin, formules) | `lib/assistant/regulatory-figures.ts` | Modifier **uniquement** ce fichier (PASS_ANNUEL, PASS_YEAR, constantes Madelin). Mise à jour **annuelle** (revalorisation PASS). |
| **Prestations par caisse** (IJ, invalidité, décès, exemples) | `docs/knowledge/bob/ro/[caisse].md` | Une fiche par caisse (ssi, carmf, carpimko, carcdsf, cavec, cipav, cnbf, cavp, carpv). Ne **pas** dupliquer les montants PASS dans ces fiches : indiquer « PASS (voir regulatory-figures) » ou « plafond annuel (source : regulatory-figures) ». |
| **Inventaire des caisses / synthèse par profession** | `docs/knowledge/bob/regimes-obligatoires-tns.md` | § 2 (CNAVPL), § 3 (CNBF), § 4 (tableau profession → caisse). Ajouter une nouvelle caisse ici **et** créer `ro/[caisse].md` si besoin. |
| **Parcours bilan TNS (étapes, fiches à utiliser)** | `docs/knowledge/bob/parcours-bilan-tns.md` | C’est la fiche **chargée** par `loadBobKnowledge()`. La version détaillée (spec) est dans `docs/agents-ia/bob_sante/parcours_bilan_tns.md` — garder les deux alignées sur les étapes et les références de fiches. |
| **Méthodologie conseil / démonstration du risque** | `docs/knowledge/bob/methodologie-conseil-prevoyance-tns.md` | Script, matrices, BPS, leviers. |
| **Synthèse comparative RO (familles, manques)** | `docs/knowledge/bob/synthese-comparative-ro-tns.md` | Tableaux par famille (SSI, médicales, juridiques/techniques) et « ce que le RO ne fait jamais ». |
| **Audit / diagnostic (situation → garanties)** | `docs/knowledge/bob/audit-diagnostic-conseiller.md` | Questionnement stratégique, diagnostic matrimonial, transformation situation → garanties. |
| **Logique de calcul carence / moteur de calcul gap** | `docs/agents-ia/bob_sante/LOGIQUE_CALCUL_CARENCE_TNS.md` | Spec pour implémenter le calcul par segments (J1–3, J4–90, J91+), table RO 2026, RegimeConstants, Gap Report, Survival Duration. Aligner avec `regulatory-figures.ts` et `ro/*.md`. |

---

## 2. Règles pour garder la base cohérente

1. **Ne pas dupliquer les chiffres réglementaires**  
   Les montants PASS, année, plafonds Madelin ne doivent **pas** être recopiés dans les fiches .md. Utiliser des formulations du type : « plafonné au PASS (voir regulatory-figures) », « PASS 20XX — `lib/assistant/regulatory-figures.ts` ». Les fiches `ro/*.md` peuvent garder des **ordres de grandeur** ou **exemples** (ex. « 48 060 / 730 ≈ 65,84 €/jour ») à condition que la **source** soit citée (regulatory-figures) et mise à jour une fois par an si besoin.

2. **Une fiche = un thème**  
   Éviter le contenu dupliqué entre fiches. Pour faire référence à un autre document : « Voir `nom-de-fiche.md` § X » ou « Source : ro/[caisse].md ».

3. **Convention de référence aux fiches**  
   - Fiches dans `docs/knowledge/bob/` : citer par **nom de fichier** (ex. `regimes-obligatoires-tns.md`, `parcours-bilan-tns.md`).
   - Fiches par caisse : citer **`ro/[caisse].md`** (ex. `ro/ssi.md`). Bob et le parcours utilisent cette forme.

4. **Citer la source en fin de bloc**  
   Quand une réponse s’appuie sur une fiche, Bob doit indiquer : *« Sources : ro/ssi.md »* (étape 7) ou *« Sources : regimes-obligatoires-tns.md, prevoyance-tns-regles-ij.md »*.

5. **Nouvelle caisse**  
   Pour une nouvelle caisse (ex. CAVAMAC, CPRN) :  
   - Ajouter la ligne dans `regimes-obligatoires-tns.md` (§ 2 ou § 4).  
   - Créer `docs/knowledge/bob/ro/[caisse].md` sur le modèle des fiches existantes (ssi, carmf, etc.).  
   - Mettre à jour `parcours-bilan-tns.md` et `bob_sante/parcours_bilan_tns.md` si le parcours doit l’inclure.

---

## 3. Inventaire des fiches chargées par Bob

**Chargeur :** `loadBobKnowledge()` dans `lib/assistant/knowledge-loader.ts`.  
**Dossiers lus :** `docs/knowledge/bob/` puis `docs/knowledge/bob/ro/`.  
**Limite globale :** 28 000 caractères (les derniers fichiers peuvent être tronqués).

### Fiches dans `docs/knowledge/bob/` (ordre alphabétique)

| Fichier | Rôle |
|---------|------|
| `00-SOURCE-DE-VERITE.md` | Ce document — règles et inventaire. |
| `2035-bilan-tns.md` | Grille de lecture liasses BNC (2035), calcul assiette IJ. |
| `audit-diagnostic-conseiller.md` | Questionnement stratégique, situation → garanties, renvoi vers méthodologie conseil. |
| `ccn-top10-obligations.md` | CCN, obligations employeur, 1,50 % TA cadres. |
| `commercial-objections-reponses.md` | Objections commerciales et réponses. |
| `due-contrat-groupe.md` | DUE, contrat de groupe. |
| `faq.md` | FAQ. |
| `fiscal-liasses-correspondances.md` | Correspondances fiscales (liasses, cases). |
| `fiscalite-entree-sortie-prevoyance.md` | Fiscalité prévoyance (entrée/sortie). |
| `glossaire.md` | Définitions (PASS, IJ, Madelin, etc.). |
| `liens-devis-allianz.md` | Liens devis / tarification. |
| `methodologie-conseil-prevoyance-tns.md` | Méthodologie conseil, script, BPS, matrices, leviers. |
| `parcours-bilan-tns.md` | Parcours bilan TNS (étapes, fiches à utiliser) — **version chargée**. |
| `prevoyance-tns-regles-ij.md` | Règles IJ TNS, formules, Frais Fixes, Madelin. |
| `references.md` | Références réglementaires, chiffres (regulatory-figures). |
| `regimes-obligatoires-ccn.md` | Régimes CCN, salariés. |
| `regimes-obligatoires-tns.md` | Inventaire TNS (SSI, caisses CNAVPL, CNBF), synthèse par profession. |
| `reglementaire-due-standard.md` | DUE, standard réglementaire. |
| `retraite-collective-pero.md` | PERO, retraite collective. |
| `sante-panier-soins-minimal.md` | Panier de soins, minimal. |
| `synthese-comparative-ro-tns.md` | Synthèse comparative RO (familles, manques). |

### Fiches dans `docs/knowledge/bob/ro/`

| Fichier | Caisse | Professions |
|---------|--------|-------------|
| `carcdsf.md` | CARCDSF | Chirurgiens-dentistes, sages-femmes |
| `carmf.md` | CARMF | Médecins libéraux |
| `carpimko.md` | CARPIMKO | Infirmiers, kinés, orthos, etc. |
| `carpv.md` | CARPV | Vétérinaires |
| `cavec.md` | CAVEC | Experts-comptables, commissaires aux comptes |
| `cavp.md` | CAVP | Pharmaciens |
| `cipav.md` | CIPAV | Architectes, ingénieurs, psychologues, etc. |
| `cnbf.md` | CNBF | Avocats |
| `ssi.md` | SSI | Artisans, commerçants, industriels |

---

## 4. Maintenance recommandée

| Fréquence | Action |
|-----------|--------|
| **Annuelle** (revalorisation PASS) | Modifier `lib/assistant/regulatory-figures.ts` (PASS_ANNUEL, PASS_YEAR). Vérifier les ordres de grandeur dans `ro/ssi.md` (IJ max, capital décès) et les mettre à jour si nécessaire. |
| **À chaque changement réglementaire** | Mettre à jour la fiche concernée (ex. Madelin → prevoyance-tns-regles-ij + regulatory-figures). |
| **Ajout d’une caisse** | Créer `ro/[caisse].md`, mettre à jour `regimes-obligatoires-tns.md` et parcours si besoin. |
| **Ajout d’un thème transversal** | Créer une fiche dans `docs/knowledge/bob/` et ajouter une ligne dans ce document (§ 3). |

---

## 5. Utilisation par Bob

- **Étape 4 (Activité)** : Identifier la caisse avec `regimes-obligatoires-tns.md` § 4 puis utiliser la fiche `ro/[caisse].md`.
- **Étape 7 (Droits existants)** : Prestations détaillées dans `ro/[caisse].md` ; synthèse familles/manques dans `synthese-comparative-ro-tns.md`.
- **Étape 8 (Préconisation)** : Chiffres réglementaires via le bloc injecté depuis `regulatory-figures.ts` ; méthodologie et script dans `methodologie-conseil-prevoyance-tns.md`.
- **Citer la source** : Toujours indiquer la fiche utilisée (ex. *« Sources : ro/ssi.md »*).

**Fiche de référence :** `docs/knowledge/bob/00-SOURCE-DE-VERITE.md`
