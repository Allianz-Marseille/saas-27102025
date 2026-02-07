# Base de connaissances Sinistro — Source de vérité

Ce document définit les fiches chargées par Sinistro et les règles de cohérence. Sinistro cite toujours la fiche utilisée (ex. « Sources : sinistro/irsa-auto.md »).

**Chargeur :** `loadSinistroKnowledge()` dans `lib/assistant/knowledge-loader.ts`.  
**Dossier lu :** `docs/knowledge/sinistro/`.  
**Limite globale :** ~28 000 caractères.

## Inventaire des fiches

| Fichier | Rôle |
|---------|------|
| `00-SOURCE-DE-VERITE.md` | Ce document — inventaire. |
| `irsa-auto.md` | Convention IRSA (auto matériel), seuils 6 500 € HT, gestion simplifiée. |
| `irsi-immeuble.md` | Convention IRSI (dégâts des eaux, incendie, immeuble), seuil 5 000 € HT. |
| `badinter-irca.md` | Loi Badinter, IRCA (corporel auto), indemnisation victimes. |
| `droit-commun-sinistres.md` | Quand sortir des conventions, Code des assurances, délais, expertise. |
| `constat-amiable-lecture.md` | Structure du constat (A/B, cases, croquis), repérer contradictions. |

## Règles

- **Une fiche = une source** : ne pas dupliquer le contenu entre fiches ; renvoyer par nom de fichier.
- **Sourçage obligatoire** : en fin de réponse technique, Sinistro cite au moins une source (fiche ou texte officiel).
- **Seuils** : les montants (6 500 € IRSA, 5 000 € IRSI) sont dans les fiches ; mise à jour manuelle si les conventions évoluent.
