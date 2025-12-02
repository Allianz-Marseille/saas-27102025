# Visualisation de l'activité des commerciaux - Page Admin

## ✅ Décision prise

**Affichage identique au dashboard commercial, avec filtrage par commercial.**

## Structure

### 1. Page d'accueil (`/admin`)
- Message de bienvenue (Bonjour ! + Date + Météo)
- Même affichage que le dashboard commercial mais en mode "cumulé" par défaut

### 2. Affichage
- **KPIs** : Calculés sur tous les commerciaux ou un commercial sélectionné
- **Timeline** : Vue mensuelle calendrier (même système que commercial)
- **Tableau** : Liste des actes (même format que commercial)
- **Navigation mensuelle** : Flèches gauche/droite pour naviguer entre les mois

### 3. Filtres
**Sous la navigation mensuelle :**
- **Par défaut** : "Tous" → Affichage cumulé de tous les commerciaux
- **Select déroulant** : Choix d'un commercial spécifique
- Les KPIs, timeline et tableau s'adaptent au filtre sélectionné

## Contexte actuel
- Page d'accueil admin : Bonjour + Date + Météo Marseille
- Dashboard commercial : Gestion des actes AN par commercial
- Données disponibles : Collection `acts` dans Firestore

## Données disponibles dans Firestore

### Collection `acts`
Chaque acte contient :
```typescript
{
  id: string;
  userId: string;              // Commercial qui a créé l'acte
  kind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD";
  clientNom: string;
  numeroContrat: string;
  contratType: string;
  compagnie: string;
  dateEffet: Date;
  dateSaisie: Date;
  primeAnnuelle?: number;
  montantVersement?: number;
  commissionPotentielle: number;
  commissionReelle?: number;
  moisKey: string;             // "2024-11" pour novembre 2024
  note?: string;
}
```

### Collection `users`
```typescript
{
  id: string;
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL";
  active: boolean;
  createdAt: Date;
}
```

## Décisions validées

### 1. Informations à afficher
✅ **Identique au dashboard commercial** :
- KPI Cards (CA Mensuel, CA Auto, CA Autres, Nb contrats, etc.)
- Timeline calendrier avec actes
- Tableau récapitulatif des actes avec actions (modifier, supprimer, voir note)

### 2. Filtrage
✅ **Deux modes** :
- **"Tous"** (par défaut) → Cumule les données de tous les commerciaux
- **Select commercial** → Filtre les données pour un commercial spécifique

### 3. Période
✅ **Même navigation mensuelle** :
- Flèches gauche/droite pour naviguer entre les mois
- Mois sélectionné affiché au centre
- Calcul des KPIs pour le mois sélectionné

### 4. Format de visualisation
✅ **Structure identique au dashboard commercial** :
- KPI Cards (8 KPIs identiques)
- Timeline calendrier (7 jours avec actes)
- Tableau récapitulatif (liste avec actions)

## Structure de la page

### Layout
```
┌─────────────────────────────────────────────────────────────┐
│ Header avec sidebar                                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Message Bienvenue + Date + Météo - 3 colonnes]           │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Navigation mensuelle : [<] Novembre 2024 [>]               │
│  Filtre : [Tous ▼] ou [Commercial ▼]                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐   │
│  │ KPI 1  │ │ KPI 2  │ │ KPI 3  │ │ KPI 4  │ │ KPI 5  │   │
│  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘   │
│  ┌────────┐ ┌────────┐ ┌────────┐                          │
│  │ KPI 6  │ │ KPI 7  │ │ KPI 8  │                          │
│  └────────┘ └────────┘ └────────┘                          │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  Timeline calendrier (7 jours avec actes)                  │
├─────────────────────────────────────────────────────────────┤
│  Tableau récapitulatif                                      │
│  [Liste des actes avec actions]                            │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Réutilisation du code
- **Composant `KPICard`** : Déjà existant, réutilisable
- **Timeline** : Fonction `generateTimeline()` à adapter
- **Tableau** : Même structure que dashboard commercial
- **Navigation mensuelle** : Même système (flèches + mois)

## Détails techniques

### Filtres
**Sous la navigation mensuelle :**
```jsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-4">
    {/* Navigation mensuelle existante */}
    <ChevronLeft onClick={previousMonth} />
    <span>{currentMonth}</span>
    <ChevronRight onClick={nextMonth} />
  </div>
  
  {/* Nouveau filtre commercial */}
  <div className="flex items-center gap-2">
    <Label>Voir :</Label>
    <Select value={selectedCommercial} onValueChange={setSelectedCommercial}>
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">Tous les commerciaux</SelectItem>
        {commerciaux.map(com => (
          <SelectItem key={com.id} value={com.id}>{com.email}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>
```

### Logique de calcul
**Pour "Tous"** :
```typescript
// Récupérer tous les actes du mois sélectionné
const allActs = await getActsByMonth(null, selectedMonth); // null = tous
const kpi = calculateKPI(allActs); // Calcul global
```

**Pour un commercial** :
```typescript
// Récupérer les actes du commercial sélectionné
const acts = await getActsByMonth(selectedCommercial, selectedMonth);
const kpi = calculateKPI(acts); // Calcul pour ce commercial
```

## Structure finale

```
┌──────────────────────────────────────────────────────────────┐
│ Bonjour ! | Date | Météo (3 colonnes égales)                │
└──────────────────────────────────────────────────────────────┘

[Navigation mensuelle : < Novembre 2024 >]  [Voir : Tous ▼]

┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐
│ CA      │ │ CA Auto │ │ CA     │ │ Nb      │ │ Contrats│
│ Mensuel │ │         │ │ Autres │ │ Contrats│ │ Auto    │
│ 45 200€ │ │ 12 000€ │ │ 33 200€│ │   25    │ │   15    │
└─────────┘ └─────────┘ └─────────┘ └─────────┘ └─────────┘
┌─────────┐ ┌─────────┐ ┌─────────┐
│ Contrats│ │ Ratio   │ │ Nb      │
│ Autres  │ │  150%   │ │ Process │
│   10    │ │         │ │    5    │
└─────────┘ └─────────┘ └─────────┘

[Timeline calendrier 7 jours avec actes]

[Tableau récapitulatif des actes]
```

## Classement des commerciaux - Nouvel outil 📊

### Objectif
Permettre à l'admin de visualiser et comparer les performances des commerciaux via un diagramme coloré classé par critère.

### Localisation
- Page : `/admin` (accueil, section dédiée)
- Position : Après le tableau récapitulatif

### Fonctionnalités

#### 1. Selecteur de critère
**Options disponibles :**
- [x] ✅ Commissions réelles (par défaut)
- [ ] CA total
- [ ] CA non auto
- [ ] Nombre total d'actes
- [ ] Commissions potentielles
- [ ] Nombre de contrats auto
- [ ] Nombre de contrats autres
- [ ] Ratio CA auto / CA autres
- [ ] Nombre de process
- [ ] Taux de validation des commissions

#### 2. Diagramme coloré
**Type de visualisation :**
- **Graphique en barres horizontales** (recommandé)
- Chaque barre représente un commercial
- Couleurs dégradées (vert = meilleur, rouge = moins bon)
- Ordre décroissant (meilleur en haut)
- Valeurs affichées sur chaque barre

#### 3. Informations affichées par commercial
- Nom (email)
- Position (#1, #2, #3...)
- Valeur du critère sélectionné
- Pourcentage de différence avec le premier

### Structure proposée

```
┌─────────────────────────────────────────────────────────────┐
│ Classement des commerciaux                                  │
├─────────────────────────────────────────────────────────────┤
│ Critère : [Commissions réelles ▼]                          │
│                                                             │
│ ┌─────────────────────────────────────┐                    │
│ │ Jean Dupont            ████████ 5 200€                 │
│ │ Marie Martin           ██████ 3 800€                   │
│ │ Pierre Durand          █████ 2 500€                    │
│ │ Sophie Bernard         ████ 1 900€                    │
│ │ ...                    ...                            │
│ └─────────────────────────────────────┘                    │
│                                                             │
│ Légende :                                                   │
│ ░░░░ Très faible  ▓▓▓▓ Moyen  ████ Élevé              │
└─────────────────────────────────────────────────────────────┘
```

### Calcul des critères

#### Commissions réelles (défaut)
```typescript
commercial.commissionReelle = sum(acts.commissionReelle)
```

#### CA total
```typescript
commercial.caTotal = sum(acts.primeAnnuelle + acts.montantVersement)
```

#### CA non auto
```typescript
commercial.caNonAuto = sum(acts where contratType !== "AUTO_MOTO")
```

#### Nombre total d'actes
```typescript
commercial.nbActes = count(acts)
```

#### Commissions potentielles
```typescript
commercial.commissionPotentielle = sum(acts.commissionPotentielle)
```

#### Nombre de contrats auto
```typescript
commercial.nbContratsAuto = count(acts where contratType === "AUTO_MOTO")
```

#### Nombre de contrats autres
```typescript
commercial.nbContratsAutres = count(acts where contratType !== "AUTO_MOTO")
```

#### Ratio
```typescript
commercial.ratio = (caAuto / caAutres) * 100
```

#### Nombre de process
```typescript
commercial.nbProcess = count(acts where kind in ["M+3", "PRETERME_AUTO", "PRETERME_IRD"])
```

#### Taux de validation
```typescript
commercial.tauxValidation = (commissionReelle / commissionPotentielle) * 100
```

### Couleurs du diagramme

**Palette recommandée :**
```css
/* Pour le classement */
1ère place : bg-green-600 (vert foncé)
2ème place : bg-green-500
3ème place : bg-green-400
Autres : bg-gradient (vert → jaune → orange → rouge)
```

**Alternative par pourcentage :**
```css
Top 20% : vert foncé
20-40% : vert clair
40-60% : jaune
60-80% : orange
80-100% : rouge
```

### Données à charger

**Pour chaque commercial :**
1. Récupérer tous ses actes du mois sélectionné
2. Calculer le critère sélectionné
3. Trier par valeur décroissante
4. Afficher dans le diagramme

### Permissions
- Admin peut voir les performances de tous les commerciaux
- Les commerciaux ne voient pas cet outil (page admin uniquement)

---

## Tâches à implémenter

### Phase 1 - Structure de base ✅
- [x] Message de bienvenue + météo
- [x] Layout admin avec sidebar
- [ ] **Adapter la page admin pour afficher KPIs + Timeline + Tableau**

### Phase 2 - Fonctionnalités Core 🔄
- [ ] Créer composant `admin/activity-overview.tsx`
- [ ] Ajouter navigation mensuelle (réutiliser système commercial)
- [ ] Ajouter filtre "Tous" / Select commercial
- [ ] Adapter fonction `getActsByMonth` pour gérer userId ou "all"
- [ ] Calculer KPIs en mode "Tous" (tous les commerciaux)
- [ ] Calculer KPIs en mode "Commercial" (filtre par userId)

### Phase 3 - Timeline et tableau ✅
- [ ] Adapter `generateTimeline` pour filtrer par commercial
- [ ] Tableau avec actions (même comportement que commercial)
- [ ] Gérer permissions : admin peut voir/modifier/supprimer tous les actes

### Phase 4 - Classement des commerciaux 📊 NEW
- [ ] Créer composant `admin/commercials-ranking.tsx`
- [ ] Ajouter select de critère de classement
- [ ] Créer fonction de calcul par critère
- [ ] Implémenter graphique en barres horizontales
- [ ] Ajouter système de couleurs dégradées
- [ ] Afficher statistiques (rang, valeur, % différence)
- [ ] Gérer le mois sélectionné (navigation mensuelle)

### Phase 5 - Optimisations
- [ ] Performance : Chargement optimisé des actes
- [ ] Cache des données si nécessaire
- [ ] Gestion des erreurs

## Prochaines étapes

1. ✅ Décision validée : Même affichage que commercial + filtre
2. **Créer la page `/admin` avec KPIs + Timeline + Tableau**
3. **Ajouter navigation mensuelle + filtre commercial**
4. **Implémenter logique de cumul "Tous" vs filtre commercial**
5. **Tester et valider**

---

## Notes
- Date de création : 26 novembre 2024
- Projet : SaaS Allianz
- Page : `/admin` (accueil)

