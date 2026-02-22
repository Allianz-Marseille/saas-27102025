# TODO — Bots IA Allianz Marseille

Référence : [README.md](README.md) (stack technique) et `docs/assets-gemini/` (ressources).

---

## ✅ Déjà en place

| Élément | Statut |
|--------|--------|
| Architecture multi-agents (registre + bot-loader + route chat) | ✅ |
| Bob prévoyance : workflow, 15 fiches métier, référentiel 2026 | ✅ |
| Référentiel global `01-referentiel-social-plafonds-2026.md` | ✅ |
| Vision Gemini (images Lagon / Liasses via attachments) | ✅ |
| Streaming des réponses | ✅ |

---

## 🔲 Bots à créer (d’après le registre)

Le registre (`docs/assets-gemini/registry-bots.md`) prévoit 5 bots. **Bob**, **Léa** et **John Coll** sont opérationnels. **Sinistro** et **Pauline** restent à créer.

### Léa (Santé Individuelle uniquement)

- [x] Créer `docs/assets-gemini/lea-sante/`
- [x] Créer `00-workflow-lea-methode.md` (workflow méthodologique)
- [ ] Créer les fiches métier (garanties, solutions santé individuelle)
- [x] Ajouter Léa dans `lib/config/agents.ts`
- [x] Créer la page `app/commun/agents-ia/lea/page.tsx` (+ layout)

### John Coll (john-coll — Santé, Prévoyance et Retraite Collectives)

- [x] Créer `docs/assets-gemini/john-coll/`
- [x] Créer `00-workflow-john-methode.md` (workflow méthodologique)
- [ ] Créer les fiches métier (CCN, santé coll., prévoyance coll., retraite coll.)
- [x] Ajouter john-coll dans `lib/config/agents.ts`
- [x] Créer la page `app/commun/agents-ia/john/page.tsx` (+ layout)

### Sinistro (Gestion & Analyse de sinistres)

- [ ] Créer `docs/assets-gemini/sinistro/`
- [ ] Créer `00-workflow-sinistro.md`
- [ ] Créer les fiches métier (types de sinistres, process, acteurs)
- [ ] Ajouter Sinistro dans `lib/config/agents.ts`
- [ ] Créer la page `app/commun/agents-ia/sinistro/page.tsx`

### Pauline (Audit de protection familiale)

- [ ] Créer `docs/assets-gemini/pauline/`
- [ ] Créer `00-workflow-pauline.md`
- [ ] Créer les fiches métier (audit, protection familiale)
- [ ] Ajouter Pauline dans `lib/config/agents.ts`
- [ ] Créer la page `app/commun/agents-ia/pauline/page.tsx`

---

## 🔲 Fonctionnalités à compléter

### Liens vers les devis

- [ ] Référencer [docs/devis/](../devis/README.md) dans les workflows des bots
- [ ] Intégrer les URLs Corniche (H91358) et Rouvière (H92083) dans les fiches ou prompts
- [ ] Comportement attendu : proposer des liens cliquables selon le besoin (Auto, Habitation, Santé, etc.)

### UI / Expérience utilisateur

- [ ] Vérifier que le composant chat envoie bien les `attachments` (images) vers l’API
- [ ] Tester le flux complet : upload image Lagon → Vision → réponse Bob
- [ ] Rendu Markdown : tableaux, montants en gras, sources citées (déjà prévus dans le workflow Bob)

### Configuration production

- [ ] `GEMINI_API_KEY` configurée sur Vercel (variables d’environnement)

---

## 🔲 Bob — Affinements possibles

- [ ] Table des matières : confirmer que le bot consulte bien `00-table-des-matieres.md` pour cibler le régime adapté
- [ ] Mise à jour annuelle : prévoir la rotation des fichiers 2026 → 2027 (plafonds, régimes)

---

## Récapitulatif des ressources assets-gemini

| Ressource | Rôle |
|-----------|------|
| `registry-bots.md` | Index des bots (botId, dossier, workflow) |
| `01-referentiel-social-plafonds-2026.md` | Plafonds PASS, PMSS, IJ CPAM (global) |
| `bob-prevoyance/` | Workflow + 15 fiches (régimes, solutions) |
| `lea-sante/` | Santé individuelle |
| `john-coll/` | Santé, prévoyance et retraite collectives |
| `sinistro/` | À créer |
| `pauline/` | À créer |
