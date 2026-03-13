# Analyse UI Santé Indépendante

## Contexte

Le module `sante-individuelle` couvre un flux métier complet:
- pilotage de la production (`/sante-individuelle`)
- gestion opérationnelle des actes (`/sante-individuelle/actes`)
- lecture de tendance (`/sante-individuelle/comparaison`)
- profil et paramètres (`/sante-individuelle/profile`)

L’expérience actuelle assume une direction visuelle "gaming" (animations, effets néon, cartes 3D, badges), cohérente sur les pages mais très intense pour un usage métier quotidien.

## Objectif UX du module

Permettre à un commercial Santé de:
1. voir sa performance du mois en moins de 10 secondes,
2. saisir/modifier des actes sans ambiguïté,
3. comprendre immédiatement ses leviers de commission,
4. comparer ses résultats sans effort cognitif élevé.

## Audit UI (Design visuel)

### Points forts

- Cohérence de thème visuel entre pages (couleurs, composants, iconographie, gradients).
- Bonne hiérarchie macro: header -> KPI -> détail.
- Feedbacks visuels présents (états actifs, hover, loaders, badges de progression).
- Utilisation régulière de composants UI partagés (`Card`, `Button`, `Badge`, dialogs).

### Points de friction

#### Critique

- **Surcharge visuelle globale**: accumulation d’animations (`neon`, `holographic`, `card-3d`, `pulse`) sur presque tous les blocs.
- **Compétition de l’attention**: plusieurs éléments "forts" au même niveau (KPI, succès, effets de fond, tooltips, emojis), ce qui dilue l’information prioritaire.
- **Contraste variable sur certains gradients**: texte petit sur fonds colorés/translucides moins lisible en conditions réelles.

#### Moyen

- **Densité élevée dans les tableaux** (`actes`): nombreuses colonnes + effets + badges, lecture longue sur laptop.
- **Styles dynamiques Tailwind difficiles à maintenir** (ex: classes construites via variables couleur), risque de non-génération CSS selon config.
- **Incohérence de ton** entre outil professionnel et registre ludique (emojis/effets omniprésents).

#### Mineur

- Multiplication des micro-effets hover sur éléments secondaires.
- Répétition de patterns visuels similaires sur plusieurs cartes (faible différenciation fonctionnelle).

## Audit UX (Ergonomie et parcours)

### Points forts

- Navigation claire desktop/mobile avec menu dédié.
- Filtrage/tri dans `actes` bien pensé pour l’exploration.
- Blocage d’édition/suppression explicite (icônes lock/unlock) utile métier.
- Comparaison 6 mois utile pour le pilotage.

### Frictions UX

#### Critique

- **Charge cognitive élevée dès l’entrée dashboard**: l’utilisateur doit trier trop de signaux avant d’identifier le "quoi faire maintenant".
- **Priorité actionnelle pas assez explicite**: bon reporting, mais peu d’aide à la décision immédiate ("prochaine action recommandée").

#### Moyen

- **Table `actes` peu optimisée pour mobile/tablette** (horizontal scroll + grand nombre de colonnes).
- **Comparaison multi-métriques**: possibilité d’afficher trop de séries en même temps, lisibilité du graphe en baisse.
- **Month selector** centré navigation temporelle mais sans raccourcis d’usage (retour instantané mois courant, presets).

#### Mineur

- Module météo intéressant mais secondaire dans un écran KPI commercial.
- Informations "profil" décoratives (niveau/status statiques) peu orientées utilité.

## Accessibilité et performance perçue

### Risques identifiés

- Sensibilité au mouvement: beaucoup d’animations simultanées (même avec `prefers-reduced-motion`, l’identité visuelle reste chargée).
- Lisibilité: textes de petite taille sur arrière-plans complexes.
- Perception de lenteur possible (effets + ombres + transformations 3D sur nombreuses cartes).

### Ce qui est déjà bien

- Présence d’une règle `prefers-reduced-motion` globale.
- Composants de base accessibles (dialogs, boutons, labels) globalement en place.

## Recommandations priorisées

## 1) Quick wins (1-2 jours)

- **Réduire l’intensité visuelle par défaut**:
  - désactiver `card-3d` sur la majorité des cartes,
  - conserver `neon/holographic` uniquement sur 1-2 éléments clés.
- **Clarifier la hiérarchie dashboard**:
  - 3 KPI principaux en premier plan (Actes, CA pondéré, Commissions),
  - déplacer les succès/achievements en section secondaire repliable.
- **Améliorer la lisibilité tableau**:
  - réduire styles décoratifs de cellules,
  - augmenter contraste des labels et sous-textes.
- **Ajouter un mode d’affichage "sobre"** (toggle local page ou préférence profil).

## 2) Améliorations intermédiaires (3-7 jours)

- **Refonte légère du tableau `actes`**:
  - colonnes essentielles visibles,
  - colonnes secondaires via "détails" (drawer/expand row),
  - actions figées à droite.
- **Comparaison 6 mois plus robuste**:
  - limite douce de métriques affichées simultanément (ex: max 3),
  - presets ("Performance", "Volume", "Mix actes").
- **Système de priorisation métier**:
  - bloc "Prochaine meilleure action" basé sur KPI du mois.

## 3) Chantiers structurants (1-3 semaines)

- **Design system Santé "pro"**:
  - définir 3 niveaux visuels (primaire, secondaire, décoratif),
  - codifier les usages des effets animés (rare et intentionnel).
- **Standardisation des tokens**:
  - palette, ombres, rayon, spacing, motion duration,
  - réduire les classes ad-hoc par page.
- **Architecture de composants de données**:
  - composants KPI réutilisables avec variantes (`default`, `highlight`, `compact`),
  - tables métier modulaires.

## Standard visuel cible (proposition)

### Principe

Passer d’un style "gaming permanent" à un style "performance cockpit":
- base sobre et lisible,
- accent visuel réservé aux signaux critiques,
- motion utile (feedback), pas décorative.

### Règles simples

- 70% surfaces neutres, 25% accents faibles, 5% accents forts.
- 1 animation "forte" maximum visible par viewport.
- 1 seul élément "hero" par écran.
- Priorité texte métier avant effet graphique.

## Backlog de tickets prêt à exécuter

1. `UI-001` - Réduire animations globales dashboard (scope: `page.tsx`, `globals.css`).
2. `UI-002` - Reprioriser la structure KPI et rendre "Succès" repliable.
3. `UI-003` - Simplifier styles tableau `actes` et améliorer contraste.
4. `UI-004` - Limiter l’affichage simultané des métriques de comparaison.
5. `UI-005` - Ajouter un mode "sobre" (préférence utilisateur).
6. `UI-006` - Définir un mini guide visuel Santé (tokens + règles motion).

## Conclusion

Le module est riche, vivant et déjà cohérent dans son identité. Le principal enjeu n’est pas un manque de design, mais une **sur-intensité visuelle** qui réduit la vitesse de compréhension métier. En réduisant le bruit visuel et en renforçant la hiérarchie informationnelle, l’outil gagnera immédiatement en clarté, efficacité commerciale et confort quotidien.
