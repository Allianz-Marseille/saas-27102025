# Spécifications de la fonctionnalité : Gestion Automatisée des Prétermes (Auto / Habitation)

## 1. Contexte et Objectif
Ajouter une nouvelle fonctionnalité au SaaS de l'agence (Allianz - Agent Jean-Michel Nogaro).
L'objectif est d'automatiser le traitement mensuel des exports de prétermes (facturation à venir des clients), de détecter les anomalies tarifaires, et de répartir les dossiers entre les collaborateurs via la création automatique de cartes Trello.

### 1.1. Périmètre d'accès
- Cette fonctionnalité est **implémentée et accessible uniquement côté admin**.
- Elle ne doit **pas** être exposée dans les espaces commerciaux, dashboard standard, ni autres rôles non administrateurs.
- L'accès UI et API doit être protégé par un contrôle de rôle `ADMINISTRATEUR`.

**Agences concernées :**
- H91358 (La Corniche)
- H92083 (La Rouvière)

## 2. Parcours Utilisateur (Interface)
1. **Sélection de la période :** L'interface doit demander à l'utilisateur quel mois est concerné par ce préterme.
2. **Validation de la clé de répartition :** L'interface affiche la clé de répartition actuelle (par agence et par collaborateur, basée sur l'ordre alphabétique du nom des clients, ex: A à C = Corentin). L'utilisateur doit la valider ou la modifier pour ce mois spécifique.
3. **Upload des exports :** Import des fichiers Excel/CSV d'Allianz.
4. **Validation des sociétés :** Écran intermédiaire affichant les entités détectées comme "Sociétés". L'utilisateur doit y saisir le nom de famille du gérant pour chaque société afin de pouvoir appliquer la bonne lettre de répartition.

### 2.1. Préalables obligatoires avant import
- Le système connaît les 2 agences cibles : `H91358` et `H92083`.
- Pour chaque agence, l'admin valide la liste des **prénoms des chargés de clientèle** actifs pour la période.
- Pour chaque chargé de clientèle, l'admin valide les **tranches de lettres** attribuées (ex: `A-C`, `D-E`, etc.).
- Tant que ces préalables ne sont pas validés, l'import ne doit pas démarrer.
- Après validation des préalables, l'admin lance l'import Excel/CSV.

#### Répartition fournie (référence initiale)
**Agence Kennedy** (rattachée au périmètre Corniche/H91358) :
- Corentin : `A-C` (816)
- Emma : `D-F` (417)
- Matthieu : `G-M` (876)
- Donia : `N-Z` (825)

**Agence Rouvière** (`H92083`) :
- Joelle : `A-H` (750)
- Christelle : `I-Z` (721)

> Note : cette répartition sert de base et doit rester éditable par mois avant chaque import.
> Mapping agence à confirmer métier : `Kennedy = Corniche = H91358`.

#### Règle de reconfiguration Trello en cas de changement d'équipe
- Si l'admin **modifie le prénom** d'un chargé de clientèle existant, le système doit redemander explicitement :
  - le **tableau Trello cible** du chargé ;
  - la **colonne Trello cible** du chargé.
- Si l'admin **ajoute un nouveau chargé de clientèle** (recrutement), le système doit également imposer cette configuration Trello avant validation finale.
- Tant que le mapping Trello (tableau + colonne) n'est pas renseigné pour le profil modifié/ajouté, la répartition ne peut pas être validée.

#### Gestion des absences (réaffectation temporaire)
- Si un chargé de clientèle est absent, l'admin doit pouvoir définir une **affectation de remplacement** vers un autre CDC.
- Cette réaffectation doit être paramétrable :
  - par période (mois en cours) ;
  - par agence ;
  - avec date de début/fin optionnelle.
- Pendant l'absence, les clients du CDC absent sont routés vers le CDC remplaçant (et vers son mapping Trello).
- La règle doit être réversible facilement à la fin de l'absence et historisée pour audit.

## 3. Traitement des Données et Règles Métier

### 3.1. Import et Nettoyage
- Parser les fichiers téléchargés.
- Corriger automatiquement les éventuelles erreurs de forme (nettoyage des espaces, uniformisation).

#### Schéma colonnes constaté (exports Avril 2026)
Les deux fichiers d'exemple (`H91358` et `H92083`) partagent le même schéma de 20 colonnes :
1. `Nom du client`
2. `N° de Contrat`
3. `Branche`
4. `Echéance principale`
5. `Code produit`
6. `Mode de règlement`
7. `Code fractionnement`
8. `Prime TTC annuelle précédente`
9. `Prime TTC annuelle actualisée`
10. `Taux de variation`
11. `Surveillance portefeuille`
12. `Avantage client`
13. `Formule`
14. `Packs`
15. `Nb sinistres`
16. `Bonus/Malus`
17. `ETP`
18. `Code gestion centrale`
19. `Taux de modulation commission`
20. `Date d'effet du dernier avenant`

#### Règles de normalisation à appliquer au parsing
- Trim systématique des en-têtes de colonnes (certains exports contiennent des espaces en début/fin de libellé).
- Uniformiser les types (`date`, `number`, `string`) avant les règles métier.
- Tolérer les variantes de format source (ex: nombres en texte type `0.00`, colonnes parfois mixtes).
- Identifier l'agence à partir du **titre/nom de fichier** contenant le code agence (`H91358` ou `H92083`).

### 3.2. Détection des Anomalies
Chaque ligne (client) doit être analysée pour flagger si la situation est "normale" ou "anormale".
**Critères d'anomalie :**
- Colonne `Taux de variation` : Supérieur à 20% (majoration anormale).
- Colonne `ETP` (Écart Tarif Portefeuille) : Supérieur à 1.30 (ce qui équivaut à un indice de 130).

### 3.3. Détection Personne Physique vs Société (Intégration API Gemini)
- Faire appel à l'API Google Gemini pour analyser la colonne `Nom du client` de chaque ligne.
- **Objectif du prompt Gemini :** Déterminer si le nom correspond à une personne physique (ex: "AHAROUNIAN SERGE") ou à une personne morale / société (ex: "SERVICES MARITIMES ET AVITAILLEM").
- **Logique de routage :**
  - Si *Personne Physique* : Appliquer directement la clé de répartition sur la première lettre du nom de famille.
  - Si *Société* (ou en cas de doute de l'IA) : Isoler la ligne et demander à l'utilisateur (via l'étape 4 du parcours) de renseigner le nom du gérant pour pouvoir l'assigner correctement au bon collaborateur.

### 3.4. Réglages métier (paramétrables par l'admin)
- Prévoir des **seuils configurables** avant traitement :
  - `seuilEtpConservation` (exemple métier : conserver seulement les lignes avec `ETP > 1.22`) ;
  - `seuilVariationConservation` (exemple métier : conserver seulement les lignes avec `Taux de variation > X%`).
- Ces réglages définissent la population de clients réellement prise en charge.
- Les valeurs par défaut sont modifiables chaque mois par l'admin avant validation finale.
- Sauvegarder les seuils utilisés dans l'historique d'import pour audit.
- Règle de comparaison validée : appliquer systématiquement **`>=`** sur les seuils de conservation :
  - conserver si `ETP >= seuilEtpConservation` ;
  - conserver si `TauxVariation >= seuilVariationConservation`.

### 3.5. Mémorisation des volumes et KPI de pilotage
- Le système doit mémoriser, pour chaque import/mois/agence/branche :
  - le **nombre global de prétermes** détectés dans l'import ;
  - le **nombre de prétermes conservés** après application des règles métier (filtrage/nettoyage/déduplication).
- Ces deux valeurs doivent être historisées pour permettre le suivi dans le temps et l'audit du traitement.
- Afficher ces métriques dans l'interface admin (ex: "X prétermes importés / Y conservés").
- Calculer et afficher le ratio de conservation :
  - **global** : `clientsConservesGlobal / clientsGlobauxGlobal` (cumul des 2 agences) ;
  - **par agence** : `clientsConservesAgence / clientsGlobauxAgence`.
- Exposer des KPI de charge :
  - **nombre de clients conservés par chargé de clientèle** ;
  - répartition par agence et par collaborateur pour visualiser le poids de traitement.
- Afficher un tableau de synthèse de type :
  - `Total global`, `Conservés globaux`, `% conservation global`,
  - `H91358 global/conservés/%`,
  - `H92083 global/conservés/%`,
  - `clients par chargé`.

#### KPI de suivi dans le temps (page dédiée outil)
- La page dédiée à l'outil doit afficher des KPI **historiques** (par mois) pour suivre l'évolution des volumes.
- Périodes minimales : `M-1`, `M`, cumul annuel, et vue 12 derniers mois.
- KPI attendus :
  - clients globaux / conservés par mois ;
  - ratio de conservation par mois ;
  - volumes par agence dans le temps ;
  - volumes par chargé de clientèle dans le temps.
- Ajouter des indicateurs d'évolution (`delta` vs mois précédent, tendance hausse/baisse).
- Permettre le filtrage par agence, branche (Auto/Habitation) et période.

### 3.6. Identifiant de référence (unicité)
- L'identifiant métier unique d'une ligne client est le `N° de Contrat`.
- Référence validée : le `N° de Contrat` est considéré comme **ID parfait**, sans doublon attendu.
- Toute logique de routage, KPI et génération Trello se base prioritairement sur cet identifiant.

## 4. Intégration Trello (Output CRM)
Une fois les données traitées et réparties :
- Utiliser l'API Trello pour générer des cartes.
- **Emplacement :** Placer la carte dans le tableau du chargé de clientèle attribué, dans la colonne appropriée.
- **Format de la carte :** Présentation typée "CRM", claire et lisible.
- **Contenu de la description Trello :**
  - Nom du client (et nom du gérant si société).
  - Code Agence (H91358 ou H92083).
  - Branche (Auto ou Habitation) et Mois concerné.
  - Prime précédente et Prime actualisée.
  - Mise en évidence visuelle des anomalies : **Taux de variation (> 20%)** et/ou **ETP (> 1.30)**.
  - N° de Contrat.

### 4.1. Paramétrage technique Trello (obligatoire)
- Chaque chargé de clientèle dispose de **son propre Trello**.
- Pour chaque chargé de clientèle, stocker :
  - `trelloBoardId` (tableau cible),
  - `trelloListId` (colonne cible),
  - `trelloBoardUrl` (lien du tableau),
  - `trelloListUrl` (lien de la colonne),
  - `trelloMemberId` (optionnel, si assignation directe souhaitée).
- Ce mapping est requis pour :
  - la création initiale des cartes,
  - les changements de prénom,
  - les ajouts de nouveaux chargés,
  - les réaffectations temporaires (absence).
- Si le mapping Trello est incomplet pour un CDC, bloquer la validation de la configuration mensuelle.
- Si l'admin modifie un prénom ou ajoute un CDC, afficher une **alerte bloquante** demandant de renseigner les liens Trello (`trelloBoardUrl`, `trelloListUrl`) avant de continuer.

### 4.2. Format standard de titre de carte
- Format recommandé :
  - `[PRETERME][{AGENCE}][{BRANCHE}][{MOIS}] {NOM_CLIENT} - {NUM_CONTRAT}`
- Exemple :
  - `[PRETERME][H91358][AUTO][2026-04] AHAROUNIAN SERGE - AF413451586`
- Objectif : faciliter le tri visuel, la recherche et l'évitement des doublons fonctionnels.

### 4.3. Règles d'exécution Trello
- Créer les cartes **uniquement** pour les clients conservés après application des seuils.
- Si un client est classé "société" et non validé (nom gérant manquant), ne pas créer la carte tant que la validation n'est pas faite.
- Journaliser chaque création de carte avec :
  - `numeroContrat`,
  - `agence`,
  - `chargeAttribue`,
  - `trelloBoardId`,
  - `trelloListId`,
  - `trelloCardId`,
  - horodatage.

## 5. Intégration Slack (Synthèse de pilotage)
- À la fin du traitement, générer et envoyer automatiquement un **message Slack** de synthèse dans une **chaîne Slack précise** (canal configurable par l'admin).
- Le message Slack doit inclure :
  - volume global : `clients globaux`, `clients conservés`, `% de conservation` ;
  - détail par agence (`H91358`, `H92083`) : globaux, conservés, ratio ;
  - détail par chargé de clientèle : nombre de clients attribués ;
  - nombre de sociétés en attente de validation (si applicable) ;
  - rappel des seuils appliqués (`ETP`, `Taux de variation`).
- Le ton attendu est une **synthèse commerciale lisible**, orientée action (qui traite quoi, poids par CDC, niveau d'anomalies).
- Le canal Slack cible doit être paramétrable et validé avant envoi.

## 6. Notes Techniques pour Claude Code
- **Modularité :** Séparer la logique en plusieurs services (`ImportService`, `AnomalyEngine`, `GeminiClassifier`, `TrelloDispatcher`).
- **Gestion d'état :** Prévoir une persistance temporaire de l'import pour gérer la pause requise par l'étape de "Validation des sociétés" par l'utilisateur (asynchronisme du processus).
- **Prompting :** Concevoir un prompt JSON structuré pour Gemini afin qu'il renvoie un format strict (ex: `{"type": "entreprise" | "particulier", "confidence": 0-1}`).
- **Agents Gemini :** Prévoir un fonctionnement avec agents et sous-agents Gemini lorsque c'est utile/nécessaire (ex: classification des entités, auto-contrôles qualité, enrichissement des données avant dispatch Trello).
- **Collecte guidée des accès :** L'application doit demander à l'admin, au fur et à mesure du parcours, les informations manquantes nécessaires à l'exécution (clés API Gemini, tokens/IDs/liens Trello, paramètres requis), avec validation immédiate de chaque saisie.
- **Gestion sécurisée des secrets :** Ne jamais afficher les clés en clair après enregistrement ; masquer les valeurs sensibles et permettre une mise à jour contrôlée.
- **Traçabilité :** Stocker les compteurs `pretermesGlobaux` et `pretermesConserves` dans l'entité d'import afin de pouvoir justifier chaque traitement.
- **Paramétrage mensuel :** Versionner la clé de répartition (agence/collaborateur/lettres) et les seuils (`ETP`, `Taux de variation`) par mois de traitement.

## 7. Points à confirmer avant développement
1. **Fallback Gemini :**
   - En cas d'erreur API, timeout ou confiance faible, confirmer la règle cible.
   - Recommandation : classer automatiquement en "société à valider manuellement".

2. **Logique de conservation finale :**
   - Confirmer la logique métier entre seuils :
     - option A : `ETP >= seuilEtp OR TauxVariation >= seuilVariation` ;
     - option B : `ETP >= seuilEtp AND TauxVariation >= seuilVariation`.
   - Les comparaisons `>=` sont déjà validées.

3. **Validation des sociétés incomplète :**
   - Définir le comportement si des sociétés n'ont pas de nom gérant renseigné :
     - blocage complet,
     - sauvegarde brouillon,
     - reprise ultérieure.

4. **Idempotence des imports :**
   - Définir le comportement si le même fichier (ou même mois/agence/branche) est importé plusieurs fois :
     - refus,
     - remplacement,
     - fusion contrôlée.

5. **Critères d'acceptation / tests :**
   - Lister les cas de recette minimaux (ex: parsing, seuils, routing lettres, validation société, création Trello, KPI).

6. **Mapping agence à figer :**
   - Confirmer formellement : `Kennedy = Corniche = H91358`.

preterme-auto
