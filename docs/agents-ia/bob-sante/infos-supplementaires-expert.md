# Informations supplémentaires pour que Bob soit l’expert souhaité

Ce document recense les **manques actuels** par rapport au cahier des charges (bob-expert.md, bob-cursor-charges.md) et les **actions recommandées** pour que Bob agisse en expert protection sociale complet.

---

## 1. Ce que Bob reçoit aujourd’hui

- **Chargeur** : `loadBobKnowledge()` lit **uniquement** `docs/knowledge/bob/` puis `docs/knowledge/bob/ro/` (limite ~28 000 caractères).
- **Non chargé** : tout le dossier `docs/agents-ia/bob-sante/` (regime-general.md, ssi.md, ro-caisses.md, bob-expert.md, themes-fiches-mapping.md) est une **doc Cursor / humains** ; Bob ne l’a pas en contexte.

---

## 2. Manques identifiés

### 2.1 Régime général (salariés)

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Fiche régime général absente de la base chargée** | Pour un **salarié**, Bob n’a pas les règles détaillées : assiette IJ (91,25, 1,4 SMIC), formule 50 %, carence 3 j, invalidité 3 catégories (montants min/max), capital décès, réversion 54 %, maternité/paternité sans carence. Il s’appuie sur `regimes-obligatoires-ccn.md` (une ligne) et le prompt. | **Créer `docs/knowledge/bob/regime-general.md`** (ou équivalent) avec le même niveau de détail que `ro/ssi.md` : prestations, garanties, conditions, formules de calcul, checklist « calcul des droits ». **Copier/adapter** le contenu de `docs/agents-ia/bob-sante/regime-general.md` dans la base chargée. |
| **Chiffres régime général (SMIC, plafond IJ)** | Les montants IJ salarié (ex. 41,95 €/j max, plafond 1,4 SMIC) évoluent chaque année. | **Centraliser** dans `lib/assistant/regulatory-figures.ts` (ex. SMIC mensuel, plafond IJSS maladie, capital décès CPAM) et documenter la source ; ou au minimum les mettre à jour dans la fiche regime-general. |

### 2.2 Synthèse « Régimes » côté Bob

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Vue comparative RG / SSI / RO dans la base** | Bob a les fiches par caisse (ro/*.md) et ro/ssi.md, mais pas de **tableau récap** « par régime : qui verse quoi, carence, plafond » dans le contexte chargé. | **Soit** ajouter une fiche **`regimes-socle-comparatif.md`** dans `docs/knowledge/bob/` (tableau RG / SSI / principales caisses : IJ, invalidité, décès, carence) ; **soit** s’assurer que `ro-caisses.md` (ou une version courte) est inclus dans la base (actuellement ro-caisses est dans bob-sante, non chargé). |

### 2.3 Santé collective (détail)

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Loi Évin, sortie de groupe, 100 % Santé (RAC 0)** | Déjà présents dans `sante-panier-soins-minimal.md` et `references.md`. | Vérifier que la fiche est bien lue par le chargeur et que les **seniors** (Loi Évin, tarifs 3 ans) sont rappelés dans le template « Aide retraite / seniors ». |
| **Dispense d’ordre public, cas de dispense DUE** | Mentionnés dans le prompt et la fiche DUE. | Optionnel : une fiche **`dispenses-mutuelle-obligatoire.md`** (liste des dispenses de plein droit, preuve à conserver) pour répondre aux questions récurrentes. |

### 2.4 Prévoyance collective (CCN, cadres)

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Grilles CCN par IDCC** | Bob a les « 5 points vigilance » et le top CCN (BTP, Syntec, HCR, etc.) mais pas de **grilles détaillées** par convention (montants minimaux, ancienneté). | Pour un expert « 100 % autonome » : ajouter une fiche **`ccn-grilles-prevoyance.md`** (ex. BTP, Syntec, HCR, Immobilier) avec références aux barèmes officiels ou lien « vérifier sur Légifrance / IDCC ». Sinon, garder la règle : **demander le code IDCC / CCN** et rappeler les 5 points + 1,50 % TA. |
| **1,50 % TA (tranche A)** | Déjà fortement présent dans le prompt et `ccn-top10-obligations.md`. | Rien à ajouter si la fiche est bien chargée. |

### 2.5 Retraite et épargne

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **PER, PERO, PERECO (règles de sortie, fiscalité)** | `retraite-collective-pero.md` et template « Aide retraite / seniors » existent. | Optionnel : fiche **`per-pero-regles-sortie.md`** (capital vs rente, âge, cas de déblocage anticipé) pour les questions « épargne retraite » hors strict senior. |
| **Âge légal, taux plein, décote** | Mentionnés dans le plan (bob-expert § IV) mais pas détaillés dans une fiche dédiée. | Optionnel : paragraphe dans une fiche **« Retraite de base »** ou dans le template seniors (âge légal 64 ans, taux plein à 67 ans, etc.) pour éviter les imprécisions. |

### 2.6 Audit et méthodologie

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Grille de lecture bulletin de paie (lignes exactes)** | `fiche-paie-sante.md` existe. | S’assurer qu’elle couvre les **lignes type** (prévoyance, mutuelle, tranche A/B/C, 1,50 % TA) pour que Bob puisse « décoder » un bulletin à la demande. Déjà le cas si la fiche est à jour. |
| **Logique du gap (formule réutilisable)** | Fortement intégrée au prompt (étape 7, calcul du gap). Les fiches ro/*.md donnent les montants RO. | Optionnel : une fiche **`calcul-gap-prevoyance.md`** (formule : Besoin − RO = Gap ; exemples par garantie IJ / invalidité / décès) pour homogénéiser le discours. |

### 2.7 Références et mise à jour

| Manque | Impact | Action recommandée |
|--------|--------|--------------------|
| **Une seule source des chiffres (PASS, SMIC, plafonds)** | Déjà prévu : `regulatory-figures.ts` pour PASS, 8 PASS, Madelin. Les fiches ro/*.md disent « voir regulatory-figures » ou donnent des ordres de grandeur. | Étendre **regulatory-figures.ts** aux **chiffres régime général** (SMIC, plafond IJSS, capital décès CPAM) et documenter l’année de référence ; rappeler dans le prompt que Bob doit utiliser ce fichier pour tous les montants réglementaires. |
| **Mise à jour annuelle** | PASS, SMIC et plafonds changent chaque année. | Rappel dans `00-SOURCE-DE-VERITE.md` : mise à jour annuelle de `regulatory-figures.ts` + relecture des ordres de grandeur dans les fiches ro/*.md et regime-general. |

---

## 3. Priorisation des actions

| Priorité | Action | Effet |
|----------|--------|--------|
| **P0** | **Ajouter une fiche régime général dans la base chargée** (`docs/knowledge/bob/regime-general.md`, contenu = version « calcul des droits » comme dans bob-sante/regime-general.md). | Bob peut **calculer et expliquer les droits d’un salarié** (IJ, invalidité, décès, maternité) comme pour un TNS avec ro/ssi.md. |
| **P0** | **Vérifier / étendre `regulatory-figures.ts`** (SMIC, plafond IJSS, capital décès) et indiquer dans le prompt que Bob utilise ce fichier pour le régime général aussi. | Chiffres salariés à jour et cohérents. |
| **P1** | **Fiche comparative « Régimes socle »** dans `docs/knowledge/bob/` (RG / SSI / RO : carences, qui verse quoi). Ou inclure une version courte de ro-caisses dans la base. | Bob a une vue d’ensemble pour répondre « différence régime général / SSI » ou « quel régime pour quel statut ». |
| **P2** | Fiche **dispenses mutuelle obligatoire** (liste officielle + preuve). | Réponses précises sur les dispenses (DUE, salarié). |
| **P2** | Fiche **PER/PERO règles de sortie** (ou enrichir retraite-collective-pero). | Aide retraite / épargne plus complète. |
| **P3** | Grilles CCN par IDCC (ou lien « vérifier CCN »). | Expert CCN renforcé ; sinon « demander IDCC + 5 points » suffit. |

---

## 4. Récapitulatif « Expert souhaité »

Pour que Bob soit l’expert décrit dans bob-expert.md et bob-cursor-charges.md, il faut en priorité :

1. **Régime général** : une fiche **complète** (prestations, garanties, conditions, formules, checklist) **dans la base chargée** (`docs/knowledge/bob/`).
2. **Chiffres réglementaires** : une **source unique** (regulatory-figures.ts) pour PASS, SMIC, plafonds IJ (SSI + salarié), capital décès, revalorisée chaque année.
3. **Vue comparative des régimes** : une fiche ou un tableau **RG / SSI / RO** dans la base pour identifier le bon « costume juridique » et les carences.
4. Le reste (santé collective, CCN, retraite/PER, dispenses) est soit déjà couvert par les fiches existantes et le prompt, soit amélioration P2/P3.

Après ces ajouts, Bob disposera des **informations supplémentaires** nécessaires pour agir en expert protection sociale sur **salariés** comme sur **TNS**, avec des chiffres à jour et une logique de calcul des droits homogène.

Retour au [sommaire](bob-expert.md).
