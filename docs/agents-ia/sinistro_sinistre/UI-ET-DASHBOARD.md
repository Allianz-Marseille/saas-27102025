# Sinistro — UI et présence sur le dashboard

Ce document précise le développement de l’interface Sinistro et sa présence sur le dashboard Agents IA, à côté de Nina et Bob.

---

## 1. Visuel Sinistro

| Élément | Chemin | Usage |
|--------|--------|--------|
| **Avatar / photo** | `public/agents-ia/bot-sinistre/sinistro.png` | Carte sur le dashboard, avatar dans la page chat Sinistro, favicon/header si besoin. |
| **Image au survol (optionnel)** | À créer si souhaité (ex. `sinistro_hover.png`) | Même comportement que Bob (image de remplacement au survol de la carte). |

Pour la V1, **sinistro.png** suffit pour la carte et l’avatar de la page chat.

---

## 2. Dashboard — Présence à côté de Nina et Bob

**Page concernée :** [app/commun/agents-ia/page.tsx](../../app/commun/agents-ia/page.tsx)

- **Dashboard = Espace Agents IA** : la page liste les cartes des agents (Nina, Bob, puis Sinistro).
- **Intégration** :
  - Définir une config **SINISTRO_SINISTRE** (type `BotCardConfig`) :
    - `name` : ex. "Assistant Sinistres"
    - `firstName` : "Sinistro"
    - `href` : `/commun/agents-ia/bot-sinistre`
    - `image` : `/agents-ia/bot-sinistre/sinistro.png`
    - `imageHover` : optionnel (ex. même image ou variante)
    - `hoverDescription` : ex. "Conventions IRSA, IRSI, Badinter. Analyse de constat, droit commun. Réponses sourcées."
    - `services` : ex. ["Analyser un constat", "Qualifier sinistre IRSA/IRSI", "Analyse droit commun"]
  - Afficher la carte Sinistro **à côté de Nina et Bob** : par exemple
    `[BOT_SECRETAIRE, ...(ENABLE_BOB_BOT ? [BOB_SANTE] : []), ...(ENABLE_SINISTRO_BOT ? [SINISTRO_SINISTRE] : [])]`
  - **Feature flag** : `ENABLE_SINISTRO_BOT` dans `lib/assistant/config.ts` (`NEXT_PUBLIC_ENABLE_SINISTRO_BOT`), pour activer/désactiver la carte sans déployer de nouveau code.

- **Rendu** : même mise en page que les autres cartes (image, nom "Sinistro", description au survol, liste de services). Clic → ouverture de `/commun/agents-ia/bot-sinistre`.

---

## 3. UI de la page Sinistro (chat plein écran)

**Page à créer :** [app/commun/agents-ia/bot-sinistre/page.tsx](../../app/commun/agents-ia/bot-sinistre/page.tsx)

- **Modèle** : reprendre la structure de la page Bob [app/commun/agents-ia/bob-sante/page.tsx](../../app/commun/agents-ia/bob-sante/page.tsx) pour garder la même UX.
- **Éléments à prévoir** :
  - **Header** : bouton retour (vers `/commun/agents-ia`), titre "Sinistro — Assistant Sinistres", éventuellement bouton "Exporter en PDF" (conversation) comme Bob.
  - **Avatar** : utiliser `sinistro.png` pour les bulles du bot (`/agents-ia/bot-sinistre/sinistro.png`).
  - **Zone d’accueil** (avant première interaction) : court texte de présentation + bouton "Bonjour" (ou équivalent).
  - **Suggestions de démarrage** (boutons cliquables) : "Analyser un constat amiable", "Qualifier un sinistre (IRSA / IRSI)", "Analyse en droit commun", "Rédiger un mail de refus de garantie", "Vérifier un recours possible".
  - **Chat** : zone messages (user à droite, Sinistro à gauche avec avatar), zone de saisie (textarea), **upload d’images et de fichiers** (constat manuscrit, photo, PDF) comme sur la page Bob.
  - **Actions sur les réponses** : Copier, Export PDF par réponse, optionnellement "Mettre dans le brouillon" si on réutilise le même pattern que Bob.
- **Contexte API** : chaque envoi au chat doit inclure `context: { agent: "sinistro" }` pour que la route utilise le prompt et la base Sinistro.

---

## 4. Récapitulatif

| Élément | Détail |
|--------|--------|
| **Photo Sinistro** | `public/agents-ia/bot-sinistre/sinistro.png` — utilisée pour la carte dashboard et l’avatar de la page chat. |
| **Dashboard** | Carte Sinistro sur la page Agents IA, à côté de Nina et Bob, avec image, description et services ; feature flag `ENABLE_SINISTRO_BOT`. |
| **UI page Sinistro** | Page chat plein écran type Bob : header, avatar, suggestions, upload images/fichiers, réponses sourcées. |
