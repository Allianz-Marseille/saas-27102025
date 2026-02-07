# Sinistro — Agent IA Sinistres

Assistant IA expert en gestion de sinistres pour agence d'assurance.

## Documents

| Document | Description |
|----------|-------------|
| **[PD_SINISTRO.md](./PD_SINISTRO.md)** | Plan de développement (vision, architecture, backlog, roadmap, prompt, sécurité). |
| **[UI-ET-DASHBOARD.md](./UI-ET-DASHBOARD.md)** | UI de la page chat Sinistro et présence sur le dashboard Agents IA (à côté de Nina et Bob). |
| **[themes-fiches-mapping.md](./themes-fiches-mapping.md)** | Correspondance suggestions de démarrage → fiches sinistro. |

## Ressources

- **Visuel / avatar :** `public/agents-ia/bot-sinistre/sinistro.png` — utilisé pour la carte sur le dashboard et l’avatar dans la page chat.
- **Base connaissance (chargée) :** `docs/knowledge/sinistro/` — fiches IRSA, IRSI, Badinter/IRCA, droit commun, lecture constat (voir `00-SOURCE-DE-VERITE.md`). Chargeur : `loadSinistroKnowledge()` dans `lib/assistant/knowledge-loader.ts`.
- **Prompt système :** `lib/assistant/sinistro-system-prompt.ts` — identité, conventions, analyse constat, droit commun, sourçage obligatoire.
- **Route :** `/commun/agents-ia/bot-sinistre` — page chat plein écran (contexte `agent: "sinistro"`).
- **Dashboard :** carte Sinistro sur `/commun/agents-ia`, affichée à côté de Nina et Bob (feature flag `NEXT_PUBLIC_ENABLE_SINISTRO_BOT=true`).
- **Références détaillées (non chargées) :** `docs/knowledge/process/sinistres.md`, `docs/knowledge/20-sinistres.md`.
