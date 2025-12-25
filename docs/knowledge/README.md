# Base de Connaissances Métier - Assistant IA

Cette base de connaissances contient toute la logique métier et les spécificités de l'agence Allianz Marseille (Nogaro & Boetti) pour enrichir les réponses de l'assistant IA.

## 📁 Structure

```
docs/knowledge/
├── core/                    # Connaissances fondamentales (toujours chargées)
│   ├── agences.md           # Coordonnées et informations des agences
│   ├── effectif-agence.md   # Équipe et contacts
│   ├── identite-agence.md   # Identité, valeurs, posture
│   ├── liens-devis.md       # Liens vers formulaires de devis
│   ├── numeros-assistance.md # Numéros d'assistance et urgences
│   ├── reglementation.md    # Réglementation, conformité, ORIAS
│   └── specification-comportement-ia.md # Comportement attendu de l'IA
│
├── produits/                # Fiches produits par domaine
│   ├── assurance-iard.md    # IARD (Auto, Habitation, Pro, Décennale)
│   ├── assurance-sante.md  # Santé individuelle et collective
│   ├── assurance-vtm-allianz.md # VTM Allianz (permis, bonus-malus, etc.)
│   ├── prevoyance.md        # Prévoyance (TNS, collective)
│   ├── epargne.md           # Épargne et retraite (PER, PERP, AV)
│   ├── particuliers-contracts.md # Contrats particuliers (arguments de vente)
│   ├── professionnels-contracts.md # Contrats professionnels (arguments de vente)
│   └── entreprises-contracts.md # Contrats entreprises (arguments de vente)
│
├── contrats/                # Contrats détaillés avec arguments de souscription
│   ├── particulier.md       # 35 contrats particuliers (IARD, Santé, Épargne)
│   ├── professionnel.md     # 15 contrats professionnels (IARD Pro, TNS, Épargne)
│   └── entreprise.md        # 14 contrats entreprises (IARD, Santé collective, Dirigeant)
│
├── process/                 # Processus internes de l'agence
│   ├── leads.md             # Processus de gestion des leads
│   ├── m-plus-3.md          # Processus M+3 (clients à 3 mois)
│   ├── preterme-auto.md     # Préterme Auto (relance 45 jours avant échéance)
│   ├── preterme-ird.md      # Préterme IARD (relance avant échéance)
│   └── sinistres.md         # Gestion des sinistres (conventions, procédures)
│
├── segmentation/            # Connaissances par segment client
│   ├── particuliers/
│   │   ├── _index.md        # Index des segments particuliers
│   │   ├── age-bands.md     # Tranches d'âge et besoins
│   │   ├── etudiant.md      # Segment étudiant
│   │   ├── salarie-cadre.md # Segment salarié cadre
│   │   ├── salarie-non-cadre.md # Segment salarié non-cadre
│   │   ├── fonctionnaire.md # Segment fonctionnaire
│   │   ├── auto-entrepreneur.md # Segment auto-entrepreneur
│   │   ├── tns-artisan.md   # Segment TNS artisan
│   │   ├── tns-commercant.md # Segment TNS commerçant
│   │   └── tns-prof-liberale.md # Segment TNS profession libérale
│   └── entreprises/
│       ├── _index.md        # Index des segments entreprises
│       ├── size-bands.md    # Taille d'entreprise (CA, effectif)
│       ├── entreprise-socle.md # Entreprise de base
│       ├── entreprise-salaries.md # Entreprise avec salariés
│       ├── entreprise-dirigeant-tns.md # Dirigeant TNS
│       └── entreprise-dirigeant-assimile-salarie.md # Dirigeant assimilé salarié
│
└── sources/                 # Sources officielles et références
    ├── references-officielles.md # Références réglementaires et sources
    ├── sante-regles-remboursement.md # Règles de remboursement santé
    ├── complementaire-sante-collective.md # Complémentaire santé collective
    └── assurance-decennale.md # Assurance décennale (références)
```

## 🔄 Utilisation

### Chargement automatique

La base de connaissances est chargée automatiquement selon le contexte :

1. **Connaissances de base (core/)** : Toujours chargées dans le system prompt
2. **Connaissances contextuelles** : Chargées automatiquement selon :
   - Les mots-clés détectés dans la conversation
   - Le contexte de segmentation client (si fourni)
   - L'historique récent de la conversation

### Système de détection

Le système utilise `lib/assistant/knowledge-loader 2.ts` pour :
- Détecter automatiquement les sujets abordés dans la conversation
- Charger jusqu'à 3 fichiers pertinents par requête
- Combiner les connaissances de base avec les connaissances contextuelles

### Instructions à l'IA

L'IA reçoit des instructions strictes pour :
- ✅ **PRIORISER** les informations de la base de connaissances
- ✅ **CITER** les sources utilisées
- ✅ **NE PAS INVENTER** d'informations si elles existent dans la base
- ✅ **RÉFÉRENCER** systématiquement la base de connaissances

## 📝 Format des fichiers

Chaque fichier doit contenir :
- Des sections clairement structurées avec des titres Markdown (`##`, `###`)
- Des listes à puces pour les points clés
- Des exemples concrets quand c'est pertinent
- Un vocabulaire métier précis et cohérent
- Des liens vers les sources officielles quand applicable

### Format pour les contrats (`contrats/`)

Chaque contrat doit suivre ce format :

```markdown
### Nom du contrat

**contrat_id:** `identifiant_unique`  
**à_qui_ca_s'adresse:** Description de la cible clientèle

**5_arguments:**
1. Argument 1
2. Argument 2
...

**questions_de_qualification:**
1. Question 1
2. Question 2
...

**red_flags:**
- Point de vigilance 1
- Point de vigilance 2
...

**upsell_cross_sell:**
1. Produit complémentaire 1
2. Produit complémentaire 2
...
```

## 🎯 Principes

- ✅ **Simplicité** : Pas de vectorisation, pas d'embeddings
- ✅ **Maintenabilité** : Fichiers Markdown versionnés dans Git
- ✅ **Transparence** : Toute la connaissance est visible et auditable
- ✅ **Contrôle** : Maîtrise totale du contenu
- ✅ **Référencement** : L'IA doit systématiquement citer la base de connaissances

## 📚 Contribution

Pour ajouter ou modifier des connaissances :

1. Éditer les fichiers Markdown dans les dossiers appropriés
2. Respecter la structure et le format existants
3. Ajouter des mots-clés pertinents dans `knowledge-loader 2.ts` si nécessaire
4. Valider les modifications avec l'équipe métier
5. Commiter les changements avec un message clair

### Ajouter un nouveau contrat

1. Ajouter le contrat dans le fichier approprié (`contrats/particulier.md`, `contrats/professionnel.md`, ou `contrats/entreprise.md`)
2. Suivre le format standardisé (contrat_id, à_qui_ca_s'adresse, 5_arguments, etc.)
3. Ajouter les mots-clés de détection dans `lib/assistant/knowledge-loader 2.ts`

### Ajouter un nouveau processus

1. Créer un fichier dans `process/` (ex: `process/nouveau-processus.md`)
2. Structurer avec des sections claires
3. Ajouter les mots-clés de détection dans `lib/assistant/knowledge-loader 2.ts`

## 🔍 Mots-clés de détection

Le système de détection automatique utilise un mapping de mots-clés vers fichiers dans `lib/assistant/knowledge-loader 2.ts`.

Exemples :
- `"m+3"` → `process/m-plus-3.md`
- `"auto"` → `produits/assurance-iard.md`, `produits/particuliers-contracts.md`
- `"mutuelle"` → `produits/assurance-sante.md`, `produits/particuliers-contracts.md`
- `"décennale"` → `produits/assurance-iard.md`, `produits/professionnels-contracts.md`

Pour ajouter une détection, modifier `KEYWORD_TO_FILE_MAP` dans `knowledge-loader 2.ts`.

## ⚠️ Instructions critiques pour l'IA

L'IA reçoit ces instructions dans chaque requête :

```
⚠️⚠️⚠️ INSTRUCTION CRITIQUE - UTILISATION DE LA BASE DE CONNAISSANCES ⚠️⚠️⚠️

TU DOIS ABSOLUMENT utiliser les informations de la base de connaissances ci-dessus pour répondre aux questions de l'utilisateur.

RÈGLES STRICTES :
1. **PRIORITÉ ABSOLUE** : Si une information existe dans la base de connaissances ci-dessus, tu DOIS l'utiliser en priorité
2. **NE PAS INVENTER** : Ne donne jamais une réponse générique si l'information précise existe dans la base de connaissances
3. **CITER LA SOURCE** : Quand tu utilises une information de la base de connaissances, mentionne-le clairement (ex: "Selon notre processus M+3...", "D'après notre documentation...")
4. **RÉFÉRENCER SYSTÉMATIQUEMENT** : Fais référence à la base de connaissances dans chaque réponse pertinente
```

## 📊 Statistiques

- **Core** : 7 fichiers (toujours chargés)
- **Produits** : 8 fichiers
- **Contrats** : 3 fichiers (64 contrats au total)
- **Processus** : 5 fichiers
- **Segmentation** : 15 fichiers
- **Sources** : 4 fichiers

**Total** : ~42 fichiers de connaissances

---

*Dernière mise à jour : 2025-01-21*
