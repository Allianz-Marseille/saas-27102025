# Mapping thèmes Sinistro → Fiches de connaissance

Chaque suggestion de démarrage (bouton sur la page Sinistro) est reliée à une ou plusieurs fiches. Sinistro s'appuie sur ces fiches pour structurer sa réponse et sourcer.

**Base de fiches :** `docs/knowledge/sinistro/`.  
**Source de vérité :** `docs/knowledge/sinistro/00-SOURCE-DE-VERITE.md`.

## Tableau de correspondance

| Thème (suggestion) | Fiche(s) principale(s) | Fiches complémentaires |
|--------------------|------------------------|------------------------|
| Analyser un constat amiable | `constat-amiable-lecture.md`, `irsa-auto.md` | `badinter-irca.md` (si corporel), `droit-commun-sinistres.md` |
| Qualifier un sinistre (IRSA / IRSI) | `irsa-auto.md`, `irsi-immeuble.md` | `droit-commun-sinistres.md` (seuils de sortie) |
| Analyse en droit commun | `droit-commun-sinistres.md` | `irsa-auto.md`, `irsi-immeuble.md` (contexte seuils) |
| Rédiger un mail de refus de garantie | `droit-commun-sinistres.md`, `irsa-auto.md` ou `irsi-immeuble.md` | — |
| Vérifier un recours possible | `irsa-auto.md`, `irsi-immeuble.md`, `droit-commun-sinistres.md` | — |
| Seuils IRSA et IRSI | `irsa-auto.md`, `irsi-immeuble.md` | `00-SOURCE-DE-VERITE.md` |
| Délais déclaration et indemnisation | `droit-commun-sinistres.md` | `irsa-auto.md` |

## Maintenance

- **Nouvelle suggestion** : ajouter une ligne au tableau et s'assurer que la fiche existe dans `docs/knowledge/sinistro/`.
- **Fiche renommée / supprimée** : mettre à jour ce mapping et `00-SOURCE-DE-VERITE.md`.
