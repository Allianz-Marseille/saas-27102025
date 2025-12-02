# Outil de Gestion des Commissions Agence

## Vue d'ensemble

L'outil de gestion des commissions agence permet aux administrateurs de saisir, visualiser et analyser les données financières mensuelles de l'agence Allianz Marseille.

## Accès

- **Rôle requis**: Administrateur uniquement
- **URL**: `/admin/commissions-agence`
- **Navigation**: Sidebar Admin → "Commissions Agence"

## Fonctionnalités principales

### 1. Tableau mensuel interactif

Le tableau affiche les données mensuelles pour une année sélectionnée avec:

- **13 colonnes**: 12 mois + Total (ou Total Extrapolé si année incomplète)
- **9 lignes de données**:
  - 🛡️ Commissions IARD
  - 💎 Commissions Vie
  - 🤝 Commissions Courtage
  - ⭐ Profits exceptionnels
  - 💰 Total Commissions (calculé automatiquement)
  - 📦 Charges Agence
  - ✅ Résultat (calculé automatiquement)
  - 👤 Prélèvements Julien (info uniquement)
  - 👤 Prélèvements Jean-Michel (info uniquement)

**💡 Interaction**: Cliquez sur n'importe quelle cellule de mois pour ouvrir le formulaire de saisie/modification.

### 2. Saisie et modification des données

Lorsque vous cliquez sur un mois, un formulaire s'ouvre avec:

#### Mode Création (mois vide)
- Tous les champs initialisés à 0
- Titre: "Saisir les données"

#### Mode Édition (mois existant)
- Tous les champs pré-remplis avec les données actuelles
- Titre: "Modifier les données"
- Bouton "Supprimer" disponible

#### Champs du formulaire

**Commissions** (montants entiers avec séparateurs de milliers):
- Commissions IARD
- Commissions Vie
- Commissions Courtage
- Profits exceptionnels

**Totaux calculés automatiquement**:
- Total Commissions = IARD + Vie + Courtage + Profits exceptionnels

**Charges**:
- Charges agence

**Résultat calculé automatiquement**:
- Résultat = Total Commissions - Charges agence

**Prélèvements** (info uniquement, non inclus dans les charges):
- Prélèvements Julien
- Prélèvements Jean-Michel

#### Validation

- **Format**: Nombres entiers uniquement (pas de décimales)
- **Affichage**: Séparateurs de milliers automatiques (ex: "83 717 €")
- **Plage**: Valeurs ≥ 0
- **Messages d'erreur**: Clairs et explicites en cas d'erreur

### 3. Gestion des années

#### Sélecteur d'année
- Dropdown avec toutes les années disponibles
- Année actuelle marquée avec un badge "Actuelle"
- Tri décroissant (années récentes en premier)

#### Créer une nouvelle année
- Bouton "➕ Créer une année"
- Suggère automatiquement l'année suivante
- Crée 12 mois avec toutes les valeurs à 0
- Vérification de l'unicité (erreur si l'année existe déjà)

### 4. KPI Cards (Indicateurs clés)

Affichage en haut de page:

1. **Total Année** (ou Total Extrapolé)
   - Résultat total de l'année
   - Si année incomplète: extrapolation automatique sur 12 mois

2. **Meilleur Mois** 🏆
   - Mois avec le meilleur résultat
   - Montant et période affichés

3. **Pire Mois** ⚠️
   - Mois avec le résultat le plus faible
   - Montant et période affichés

4. **Moyenne Mensuelle** ✨
   - Résultat moyen par mois
   - Calculé sur les mois avec données

## Calculs automatiques

### Total Commissions
```
Total Commissions = Commissions IARD + Commissions Vie + Commissions Courtage + Profits exceptionnels
```

### Résultat
```
Résultat = Total Commissions - Charges agence
```

### Extrapolation (années incomplètes)
Pour les années avec moins de 12 mois de données:
```
Total Extrapolé = (Somme réelle / Nombre de mois) × 12
```

**Exemple**: Si 10 mois saisis avec un total de 960 854 €:
- Moyenne mensuelle = 960 854 ÷ 10 = 96 085,4 €
- Total Extrapolé = 96 085,4 × 12 = 1 153 025 €

## Format des données

- **Type**: Nombres entiers uniquement (pas de décimales)
- **Affichage**: Séparateurs de milliers avec espace (ex: "83 717 €")
- **Stockage**: Nombre brut dans Firestore (ex: 83717)
- **Saisie**: Formatage automatique pendant la frappe

## Prélèvements vs Charges

⚠️ **Important**: Les prélèvements ne sont **PAS** des charges.

- **Charges agence**: Dépenses opérationnelles (salaires, loyer, frais, etc.)
- **Prélèvements**: Rémunération des dirigeants **prélevée sur le résultat déjà calculé**

Le résultat est calculé comme `Total - Charges`, **sans** soustraire les prélèvements.

Les prélèvements sont des informations de suivi uniquement.

## Migration des données existantes

### Import depuis commissions.md

Pour importer les données historiques depuis `docs/commissions.md`:

```bash
npm run import:commissions
```

Ce script:
1. Lit les données des années 2022, 2024 et 2025
2. Calcule automatiquement les totaux
3. Importe dans Firestore
4. Ignore les mois déjà existants

## Sécurité et permissions

### Firestore Rules
- **Lecture**: Administrateurs uniquement
- **Écriture**: Administrateurs uniquement
- **Suppression**: Administrateurs uniquement

### Logs
Toutes les opérations sont tracées avec:
- `createdAt` et `createdBy` à la création
- `updatedAt` et `lastUpdatedBy` à chaque modification

## Design et UX

### Effets wow
- Animation pulse sur l'icône principale
- Gradients colorés selon les métriques
- Hover effects sur les cellules du tableau
- CountUp animations sur les totaux calculés
- Glass-morphism sur les cartes

### Couleurs par métrique
- 🟦 **Bleu**: IARD
- 🟪 **Violet**: Vie
- 🔵 **Cyan**: Courtage
- 🟧 **Orange**: Profits exceptionnels
- 🟨 **Or/Jaune**: Total commissions
- 🟥 **Rouge**: Charges
- 🟩 **Vert**: Résultat positif
- 🔴 **Rouge foncé**: Résultat négatif

### Accessibilité
- Click sur n'importe quelle cellule pour éditer
- Navigation au clavier (Tab, Enter, Escape)
- Messages d'aide contextuels
- Tooltips explicatifs

## Cas d'usage courants

### Saisir les données d'un nouveau mois
1. Sélectionner l'année souhaitée
2. Cliquer sur la cellule du mois à renseigner
3. Remplir les champs (IARD, Vie, Courtage, Profits, Charges, Prélèvements)
4. Vérifier les totaux calculés automatiquement
5. Cliquer sur "Enregistrer"

### Modifier les données d'un mois existant
1. Cliquer sur la cellule du mois à modifier
2. Modifier les valeurs souhaitées
3. Vérifier les nouveaux totaux
4. Cliquer sur "Enregistrer"

### Supprimer les données d'un mois
1. Cliquer sur la cellule du mois à supprimer
2. Cliquer sur "Supprimer"
3. Confirmer la suppression dans la boîte de dialogue

### Créer une nouvelle année
1. Cliquer sur "➕ Créer une année"
2. Saisir l'année (ou utiliser la suggestion)
3. Cliquer sur "Créer l'année"
4. 12 mois à 0 sont créés automatiquement

### Consulter les performances annuelles
1. Sélectionner l'année dans le dropdown
2. Observer les KPI Cards en haut de page
3. Analyser le tableau mensuel
4. Comparer avec les années précédentes

## Support et maintenance

### Vérifier l'état de l'import
Après avoir exécuté `npm run import:commissions`, vous devriez voir:
- Nombre de mois importés
- Nombre de mois ignorés (déjà existants)
- Total traité

### En cas d'erreur
- Vérifier que vous êtes bien administrateur
- Vérifier que les règles Firestore sont déployées
- Consulter la console navigateur pour les messages d'erreur
- Vérifier les logs dans l'onglet Admin → Logs

## Roadmap futures améliorations

- [ ] Page de comparaison multi-années avec graphiques
- [ ] Export Excel/PDF des données
- [ ] Import CSV pour saisie en masse
- [ ] Graphiques d'évolution (Line chart, Bar chart, Pie chart)
- [ ] Calcul de projections fin d'année
- [ ] Alertes si baisse importante
- [ ] Historique des modifications
- [ ] Commentaires sur les mois

---

*Dernière mise à jour: Novembre 2025*

