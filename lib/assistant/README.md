# Système d'Amorces pour l'Assistant IA

Ce système permet de guider les utilisateurs vers les questions pertinentes sur les offres commerciales Allianz.

## Structure

Les amorces sont organisées en **3 thèmes principaux** :

### 1. Offres Retail (Particuliers)
- Offres du moment (promotions, dispositifs commerciaux en cours)
- Dispositifs annuels (mécaniques commerciales récurrentes)
- Gros producteurs (bonus/majorations liés aux volumes)
- Dispositifs spécifiques par produit (Auto, MRH, Santé, Prévoyance, GAV)

### 2. Offres Pro / Agri / Entreprise
- Offres du moment pour clients professionnels, agricoles ou entreprises
- Dispositifs annuels dédiés aux contrats Pro/Agri
- Offres segmentées (TNS, artisans/commerçants, entreprises, agricoles)
- Majorations / bonus de production selon les gammes

### 3. Offres réservées aux Agents Différenciés & Spécialistes
- Dispositifs annuels spécifiques aux profils "Différenciés Pros"
- Bonus et mécaniques commerciales pour :
  - Spécialistes Entreprise
  - Spécialistes Construction
  - Spécialistes Flottes & Garages
  - Spécialistes Agricole
- Gros producteurs PJ Pro

## Utilisation

### Dans le composant Assistant

Les amorces sont affichées automatiquement lorsque l'utilisateur sélectionne un thème. Chaque amorce est cliquable et envoie automatiquement la question à l'assistant avec le contexte approprié.

### Ajouter une nouvelle amorce

1. Ouvrir `lib/assistant/prompts.ts`
2. Ajouter une nouvelle entrée dans le tableau correspondant au thème :
   - `RETAIL_PROMPTS` pour les offres particuliers
   - `PRO_PROMPTS` pour les offres professionnelles
   - `SPECIALIZED_PROMPTS` pour les agents différenciés

Exemple :
```typescript
{
  id: "retail-11",
  text: "Quelle est la promotion actuelle pour l'assurance Auto ?",
  category: "auto",
  theme: "retail",
}
```

### Fonctions utilitaires

- `getPromptsByTheme(theme)`: Récupère toutes les amorces d'un thème
- `getAllPrompts()`: Récupère toutes les amorces
- `getPromptsByCategory(category)`: Récupère les amorces d'une catégorie
- `getPromptById(id)`: Récupère une amorce par son ID

## Intégration avec l'API

Lorsqu'une amorce est sélectionnée, le contexte (thème + catégorie) est automatiquement inclus dans le message envoyé à l'API Pinecone sous la forme :

```
[Thème: Offres Retail (Particuliers), Catégorie: Auto] Quelle est la promotion actuelle pour l'assurance Auto ?
```

Cela permet à l'assistant de mieux comprendre le contexte et de fournir des réponses plus pertinentes.

