# Spécifications — Gestion Automatisée des Prétermes IRD

> **Basé sur le template Auto** (`docs/preterme-auto.md`).
> Le workflow 7 étapes est identique. Ce document liste uniquement les **différences et adaptations** propres à la branche IRD, puis le plan d'implémentation phase par phase.

---

## Table des Matières
1. [Contexte et différences vs Auto](#1-contexte-et-différences-vs-auto)
2. [Schéma colonnes fichiers IRD](#2-schéma-colonnes-fichiers-ird)
3. [Règles métier spécifiques IRD](#3-règles-métier-spécifiques-ird)
4. [Intégration Trello IRD](#4-intégration-trello-ird)
5. [Collections Firestore](#5-collections-firestore)
6. [Variables d'environnement](#6-variables-denvironnement)
7. [Plan d'implémentation — 6 phases](#7-plan-dimplé,mentation--6-phases)
8. [Décisions validées](#8-décisions-validées)

---

## 1. Contexte et différences vs Auto

### 1.1. Périmètre
- Même agences : **H91358** (La Corniche) et **H92083** (La Rouvière).
- Même rôle d'accès : `ADMINISTRATEUR` uniquement.
- Branche : **IRD** (Incendie, Risques Divers — habitation, pro, RC, autres risques IARD).
- Délai métier : **60 jours** avant échéance (vs 45j pour Auto).

### 1.2. Tableau des différences techniques

| Élément | Auto | IRD |
|---|---|---|
| `branche` (type TS) | `"AUTO"` | `"IRD"` |
| Route admin | `/admin/preterme-auto` | `/admin/preterme-ird` |
| Collections Firestore | `preterme_configs`, `preterme_imports`… | `preterme_iard_configs`, `preterme_iard_imports`… |
| Format titre carte Trello | `[PRETERME][H91358][AUTO][2026-04]` | `[PRETERME][H91358][IRD][2026-04]` |
| Colonne Trello cible | configurable par CDC | colonne **"Préterme IARD"** (ou "Préterme IRD") — présente dans tous les boards CDC |
| Colonnes Excel | 20 colonnes Auto (Bonus/Malus, Formule, Packs…) | Colonnes IARD — voir §2 |
| Détection agence depuis fichier | Nom de fichier (`H91358` dans le filename) | Nom de fichier **ET** lecture du titre dans la feuille Excel (cellule titre avant les en-têtes) |
| Sidebar admin | Icône `Car` | Icône `Home` (ou `Shield`) — à confirmer |
| Message Slack | Canal `CE58HNVF0` (hardcodé) | **même canal** `CE58HNVF0` |

### 1.3. Infrastructure réutilisée sans modification
- `types/preterme.ts` → **à étendre** avec `"IRD"` dans l'union de branche
- `lib/utils/preterme-agence.ts` → réutilisé tel quel (même codes agence)
- `lib/services/preterme-gemini.ts` → réutilisé tel quel (classification particulier/société)
- `lib/services/preterme-trello.ts` → réutilisé tel quel (format titre adapté)
- `lib/services/preterme-slack.ts` → réutilisé tel quel (même canal)
- `lib/services/preterme-router.ts` → réutilisé tel quel (routage lettres/CDC)
- Composants UI (`UploadStep`, `ThresholdsStep`, `SocietesValidationStep`, `DispatchPreview`, `SynthesisReport`) → **dupliqués et adaptés** dans `/components/preterme-ird/`

---

## 2. Schéma colonnes fichiers IRD

> **⚠ À vérifier lors de la Phase 2** : lire les fichiers de référence `docs/fichiers-exports/preterme-ird/` avec ExcelJS pour confirmer les en-têtes exacts.

### Fichiers de référence
- `docs/fichiers-exports/preterme-ird/H91358 - LISTE PRETERMES DU Avr2026 BRANCHE I.R.D.Avr2026.xlsx`
- `docs/fichiers-exports/preterme-ird/H92083 - LISTE PRETERMES DU Avr2026 BRANCHE I.R.D.Avr2026.xlsx`

### Colonnes attendues (à confirmer)
Les colonnes IRD partagent le tronc commun avec Auto et **retirent les colonnes spécifiques véhicule** :

| # | Libellé attendu (header) | Clé TS | Type |
|---|---|---|---|
| 1 | `Nom du client` | `nomClient` | string |
| 2 | `N° de Contrat` | `numeroContrat` | string |
| 3 | `Branche` | `brancheContrat` | string |
| 4 | `Echéance principale` | `echeancePrincipale` | date |
| 5 | `Code produit` | `codeProduit` | string |
| 6 | `Mode de règlement` | `modeReglement` | string |
| 7 | `Code fractionnement` | `codeFractionnement` | string |
| 8 | `Prime TTC annuelle précédente` | `primeTTCAnnuellePrecedente` | number |
| 9 | `Prime TTC annuelle actualisée` | `primeTTCAnnuelleActualisee` | number |
| 10 | `Taux de variation` | `tauxVariation` | number (%) |
| 11 | `Surveillance portefeuille` | `surveillancePortefeuille` | string |
| 12 | `Avantage client` | `avantageClient` | string |
| 13 | `Nb sinistres` | `nbSinistres` | number |
| 14 | `ETP` | `etp` | number |
| 15 | `Code gestion centrale` | `codeGestionCentrale` | string |
| 16 | `Taux de modulation commission` | `tauxModulationCommission` | string |
| 17 | `Date d'effet du dernier avenant` | `dateDernierAvenant` | date |
| … | *autres colonnes éventuelles* | — | — |

> **Colonnes Auto absentes en IRD** (hypothèse) : `Formule`, `Packs`, `Bonus/Malus`.
> **Colonnes IRD supplémentaires possibles** : adresse risque, type de bien, valeur assurée — à confirmer.

### Détection agence — double source
1. **Priorité 1** : nom de fichier (`H91358` ou `H92083` présent dans le filename).
2. **Priorité 2** : lecture de la cellule titre dans la feuille Excel (ex : ligne 1 ou 2 avant les en-têtes) — présente dans les exports IRD Allianz, contenant le code agence.

Implémentation dans `lib/utils/preterme-ird-parser.ts` : si `detectAgenceFromFilename` retourne `null`, scanner les 5 premières lignes pour trouver `H91358` ou `H92083`.

---

## 3. Règles métier spécifiques IRD

### 3.1. Critères de conservation (identiques à Auto)
- `ETP >= seuilEtp` (défaut : **120**) **OU**
- `TauxVariation >= seuilVariation` (défaut : **20 %**)

### 3.2. Classification Gemini (identique à Auto)
- `particulier` / `société` / `à valider`
- Fallback : `à valider` en cas d'erreur/timeout/faible confiance.

### 3.3. Routage lettres CDC (identique à Auto)
Même répartition initiale par agence (Corentin A-C, Emma D-F, etc. pour H91358 ; Joelle A-H, Christelle I-Z pour H92083).

### 3.4. Description carte Trello IRD
```
[PRETERME][{AGENCE}][IRD][{MOIS}] {NOM_CLIENT} - {NUM_CONTRAT}

📋 Branche : IRD
🏢 Agence  : {AGENCE}
📅 Échéance : {ECHEANCE_PRINCIPALE}
💰 Prime préc. : {PRIME_PRECEDENTE} €  →  Prime act. : {PRIME_ACTUALISEE} €
📈 Variation   : {TAUX_VARIATION} %  {⚠️ si >= seuil}
📊 ETP         : {ETP}  {⚠️ si >= seuil}
🏷️ Code produit : {CODE_PRODUIT}
📝 N° Contrat  : {NUMERO_CONTRAT}
{si société} 👤 Gérant : {NOM_GERANT}
```

---

## 4. Intégration Trello IRD

### 4.1. Colonne cible par défaut
Chaque board CDC dispose d'une colonne **"Préterme IARD"** (vérifier nom exact : "Préterme IARD", "Préterme IRD" ou "IARD").
La sélection de la colonne reste configurable via le helper "Chercher une colonne" (réutilisé depuis Auto).

### 4.2. Idempotence
Même logique qu'Auto : clé d'unicité `numeroContrat + moisKey + branche("IRD")` dans `preterme_iard_trello_logs`.

---

## 5. Collections Firestore

| Collection | Clé d'unicité | Description |
|---|---|---|
| `preterme_iard_configs` | `moisKey` | Config mensuelle IRD (CDC, lettres, seuils) |
| `preterme_iard_imports` | `moisKey + agence` | Historique imports IRD (statut, KPI) |
| `preterme_iard_clients` | `importId + numeroContrat` | Ligne client par import IRD |
| `preterme_iard_trello_logs` | — | Journal création cartes Trello IRD |

> Pattern CRUD : identique à Auto — copier `lib/firebase/preterme.ts` → `lib/firebase/preterme-ird.ts` et remplacer les noms de collections + le type `branche`.

---

## 6. Variables d'environnement

Aucune nouvelle variable requise. Réutilisation complète :

| Variable | Usage |
|---|---|
| `GEMINI_API_KEY` | Classification Gemini |
| `TRELLO_API_KEY` | Dispatch cartes Trello |
| `TRELLO_TOKEN` | Dispatch cartes Trello |
| `SLACK_BOT_TOKEN` | Synthèse Slack canal `CE58HNVF0` |

---

## 7. Plan d'implémentation — 6 phases

### Phase 1 — Socle types + config + navigation
**Périmètre :**
- Étendre `types/preterme.ts` : union `branche: "AUTO" | "IRD"`, nouveau type `PretermeIrdConfig` (ou généraliser `PretermeConfig<B extends "AUTO"|"IRD">`).
- Créer `lib/firebase/preterme-ird.ts` : CRUD collections `preterme_iard_*`.
- Créer `app/admin/preterme-ird/page.tsx` : stepper 7 étapes (clone de `preterme-auto/page.tsx` adapté IRD).
- Ajouter entrée "Prétermes IARD" dans `app/admin/layout.tsx` (icône `Home` ou `Shield`).
- Composant `ConfigurationStep` IRD dans `components/preterme-ird/ConfigurationStep.tsx`.

**Fichiers à créer/modifier :**
- `types/preterme.ts` (modifier — union branche)
- `lib/firebase/preterme-ird.ts` (créer)
- `app/admin/preterme-ird/page.tsx` (créer)
- `app/admin/layout.tsx` (modifier — ajout entrée nav)
- `components/preterme-ird/ConfigurationStep.tsx` (créer)

**Critères d'acceptation :**
- [ ] La page `/admin/preterme-ird` s'affiche sans erreur TypeScript.
- [ ] Le stepper affiche bien 7 étapes.
- [ ] L'entrée "Prétermes IARD" apparaît dans la sidebar admin.
- [ ] La config mensuelle IRD se sauvegarde en Firestore (`preterme_iard_configs`).

---

### Phase 2 — Parser Excel IRD + upload
**Périmètre :**
- Lire les fichiers de référence (`docs/fichiers-exports/preterme-ird/`) avec ExcelJS pour établir le schéma définitif des colonnes IRD.
- Créer `lib/utils/preterme-ird-parser.ts` : parser adapté aux colonnes IRD + détection agence depuis filename ET titre de feuille.
- Créer `app/api/admin/preterme-ird/upload/route.ts` : POST upload IRD (idempotence, batches 400).
- Créer `components/preterme-ird/UploadStep.tsx` : drag & drop, auto-détection agence.

**Fichiers à créer :**
- `lib/utils/preterme-ird-parser.ts`
- `app/api/admin/preterme-ird/upload/route.ts`
- `components/preterme-ird/UploadStep.tsx`

**Points d'attention :**
- Vérifier si les colonnes IRD incluent `Bonus/Malus`, `Formule`, `Packs` (probablement absentes).
- Vérifier s'il y a une ligne titre avant les en-têtes (code agence dans le titre du fichier Excel).
- Adapter `HEADER_MAP` en conséquence.

**Critères d'acceptation :**
- [ ] Les deux fichiers IRD de référence se parsent sans erreur.
- [ ] L'agence est correctement détectée (H91358 / H92083) depuis le nom de fichier ou le titre de feuille.
- [ ] Les données sont persistées dans `preterme_iard_clients`.
- [ ] L'idempotence est garantie (re-upload = purge + réimport propre).

---

### Phase 3 — Filtrage IA + validation sociétés
**Périmètre :**
- Créer `app/api/admin/preterme-ird/classify/route.ts` : filtrage métier (`>=` ETP/variation) + classification Gemini (réutiliser `preterme-gemini.ts` sans modification).
- Créer `components/preterme-ird/ThresholdsStep.tsx` : sliders dynamiques IRD.
- Créer `components/preterme-ird/SocietesValidationStep.tsx` : arbitrage à valider + saisie gérant.

**Fichiers à créer :**
- `app/api/admin/preterme-ird/classify/route.ts`
- `components/preterme-ird/ThresholdsStep.tsx`
- `components/preterme-ird/SocietesValidationStep.tsx`

**Critères d'acceptation :**
- [ ] Gemini classe correctement les noms IARD (habitation, pro, RC) — particulier vs société.
- [ ] Les sliders recalculent en temps réel les volumes retenus.
- [ ] L'étape 4 bloque tant qu'il reste des `à valider` ou des gérants manquants.

---

### Phase 4 — Modulation + dispatch Trello IRD
**Périmètre :**
- Créer `components/preterme-ird/DispatchPreview.tsx` : aperçu répartition CDC + lancement dispatch.
- Créer `app/api/admin/preterme-ird/dispatch/route.ts` : routage CDC + création cartes Trello (réutiliser `preterme-trello.ts` avec titre `[IRD]`).
- Endpoint `GET /api/admin/preterme-ird/trello-lists` : liste colonnes d'un board (réutiliser la logique de `preterme-auto/trello-lists`).
- Modulation (étape 5) : réutiliser `ConfigurationStep` ou adapter si nécessaire.

**Fichiers à créer :**
- `components/preterme-ird/DispatchPreview.tsx`
- `app/api/admin/preterme-ird/dispatch/route.ts`
- `app/api/admin/preterme-ird/trello-lists/route.ts`

**Critères d'acceptation :**
- [ ] Les cartes Trello IRD sont créées dans la colonne "Préterme IARD" de chaque CDC.
- [ ] Le titre de la carte est au format `[PRETERME][H9xxxx][IRD][2026-04] NOM - CONTRAT`.
- [ ] L'opération est idempotente (pas de doublon en cas de relance).
- [ ] La gestion des absences CDC fonctionne (réaffectation vers remplaçant).

---

### Phase 5 — Synthèse Slack + KPI historiques
**Périmètre :**
- Créer `components/preterme-ird/SynthesisReport.tsx` : synthèse finale IRD.
- Réutiliser `preterme-slack.ts` (même canal `CE58HNVF0`) avec mention "IRD" dans le message.
- Page historique : `app/admin/preterme-ird/historique/[moisKey]/page.tsx` (clone de la page Auto).
- Graphique Recharts 12 mois (importés vs conservés IRD).

**Fichiers à créer :**
- `components/preterme-ird/SynthesisReport.tsx`
- `app/admin/preterme-ird/historique/[moisKey]/page.tsx`
- `app/api/admin/preterme-ird/slack/route.ts`

**Critères d'acceptation :**
- [ ] Le message Slack indique clairement la branche "IRD".
- [ ] La page historique affiche les KPI IRD sur 12 mois.
- [ ] Le graphique Recharts se charge sans erreur.

---

### Phase 6 — Hardening + tests
**Périmètre :**
- Tests unitaires : parser IRD, filtrage métier, routage lettres.
- Tests d'intégration : upload → classify → dispatch (mock Gemini + Trello).
- Vérification idempotence complète (multi-agences, relance partielle).
- Lint / typecheck complet.
- `.env.example` à jour si nouvelles variables ajoutées.

**Fichiers à créer :**
- `lib/utils/__tests__/preterme-ird-parser.test.ts`
- `lib/services/__tests__/preterme-ird-anomaly.test.ts`

**Critères d'acceptation :**
- [ ] `npm run lint` → 0 erreur.
- [ ] `npm run typecheck` → 0 erreur.
- [ ] Tests unitaires : parsing, seuils, routage lettres, dispatch Trello.
- [ ] Checklist de recette manuelle complète (voir §8).

---

## 8. Décisions validées

| # | Décision |
|---|---|
| 1 | **Workflow identique à Auto** : 7 étapes, même stepper, même logique de blocage. |
| 2 | **Collections Firestore séparées** : préfixe `preterme_iard_` — pas de mélange avec Auto. |
| 3 | **Types TypeScript étendus** : union `branche: "AUTO" \| "IRD"` dans `types/preterme.ts`. |
| 4 | **Gemini réutilisé sans modification** : le classificateur particulier/société est générique. |
| 5 | **Même canal Slack** : `CE58HNVF0` — mention "IRD" dans le corps du message. |
| 6 | **Colonne Trello "Préterme IARD"** : présente dans tous les boards CDC — sélection via helper TrelloListPicker. |
| 7 | **Détection agence** : nom de fichier en priorité, puis lecture du titre de feuille Excel. |
| 8 | **Isolation des composants** : dossier `/components/preterme-ird/` distinct de `/components/preterme/`. |
| 9 | **Seuils par défaut identiques à Auto** : ETP 120 / Variation 20 %. |
| 10 | **Fallback Gemini** : `à_valider` en cas d'erreur (même règle qu'Auto). |

---

## 9. Checklist de recette manuelle

- [ ] Upload fichier H91358 IRD → agence détectée correctement
- [ ] Upload fichier H92083 IRD → agence détectée correctement
- [ ] Re-upload même agence → remplacement propre (idempotence)
- [ ] Classification Gemini : "MARTIN JEAN" → particulier
- [ ] Classification Gemini : "SARL DU PORT" → société (gérant requis)
- [ ] Slider ETP modifié → volumes recalculés en temps réel
- [ ] Dispatch Trello : carte créée dans colonne "Préterme IARD" du CDC concerné
- [ ] Dispatch Trello relancé → pas de doublon
- [ ] CDC absent → clients routés vers remplaçant
- [ ] Synthèse Slack envoyée sur `CE58HNVF0` avec mention "IRD"
- [ ] Page historique : graphique 12 mois IRD
- [ ] TypeScript : 0 erreur
- [ ] Lint : 0 erreur

---

*Template : `docs/preterme-auto.md` — Branche : IRD — Date : 2026-03-11*
