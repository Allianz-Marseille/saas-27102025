# Enrichir Sinistro avec la convention IRSA (PDF)

Quand tu ajoutes ou mets à jour le PDF de la convention IRSA dans `docs/pdf/conventions/irsa.pdf`, tu peux régénérer la fiche markdown utilisée par le RAG Sinistro.

## Étapes

1. **Placer le PDF**  
   Fichier : `docs/pdf/conventions/irsa.pdf` (Convention France Assureurs, édition à jour).

2. **Extraire le texte vers une fiche**  
   En racine du projet :
   ```bash
   npm run extract:irsa-pdf
   ```
   Le script peut prendre 1 à 2 minutes (PDF long). Il crée ou écrase :
   `docs/knowledge/sinistro/irsa-convention-complete.md`.

3. **Migrer vers Firestore (RAG)**  
   ```bash
   npm run migrate:sinistro-firestore
   ```
   Sinistro pourra alors retrouver les passages pertinents de la convention via la recherche vectorielle.

## Fichiers concernés

- **Script** : `scripts/extract-irsa-pdf.cjs`
- **Fiche générée** : `docs/knowledge/sinistro/irsa-convention-complete.md`
- **Inventaire** : `docs/knowledge/sinistro/00-SOURCE-DE-VERITE.md` (référence déjà ajoutée pour cette fiche)

## Si le script est trop lent

Tu peux extraire le texte du PDF à la main (copier-coller depuis un lecteur PDF ou un outil d’export), nettoyer les numéros de page, et enregistrer le tout dans `irsa-convention-complete.md` avec en en-tête :

```markdown
# Convention IRSA — Texte intégral (extrait PDF)
Source : France Assureurs — Convention IRSA (édition [année]).
...
```

Puis lancer uniquement : `npm run migrate:sinistro-firestore`.

---

# Convention IRSI (PDF)

Même principe que l’IRSA : le PDF **convention-irsi.pdf** doit être dans `docs/pdf/conventions/`.

1. **Placer le PDF**  
   Fichier : `docs/pdf/conventions/convention-irsi.pdf`.

2. **Extraire le texte**  
   ```bash
   npm run extract:irsi-pdf
   ```
   Crée ou écrase : `docs/knowledge/sinistro/irsi-convention-complete.md`.

3. **Migrer vers Firestore**  
   ```bash
   npm run migrate:sinistro-firestore
   ```

- **Script** : `scripts/extract-irsi-pdf.cjs`
- **Fiche** : `docs/knowledge/sinistro/irsi-convention-complete.md`

---

# Convention CIDE-COP (PDF)

Même principe : le PDF **convention-cide-cop.pdf** doit être dans `docs/pdf/conventions/`.

1. **Placer le PDF**  
   Fichier : `docs/pdf/conventions/convention-cide-cop.pdf`.

2. **Extraire le texte**  
   ```bash
   npm run extract:cide-cop-pdf
   ```
   Crée ou écrase : `docs/knowledge/sinistro/cide-cop-convention-complete.md`.

3. **Migrer vers Firestore**  
   ```bash
   npm run migrate:sinistro-firestore
   ```

- **Script** : `scripts/extract-cide-cop-pdf.cjs`
- **Fiche** : `docs/knowledge/sinistro/cide-cop-convention-complete.md`
