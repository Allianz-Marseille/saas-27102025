# Nettoyage Bob Santé — À garder / À supprimer

Référence : **`docs/knowledge/bob/00-SOURCE-DE-VERITE.md`** (source de vérité).

---

## À GARDER (indispensable)

### Base de connaissances chargée par Bob

| Emplacement | Rôle |
|------------|------|
| **`docs/knowledge/bob/`** | Toutes les fiches listées dans `00-SOURCE-DE-VERITE.md` § 3. **Ne rien supprimer** : ce dossier est lu par `loadBobKnowledge()`. |
| **`docs/knowledge/bob/ro/`** | Fiches par caisse (ssi, carmf, carpimko, carcdsf, cavec, cipav, cnbf, cavp, carpv). **Ne rien supprimer** : chargées par le loader. |

### Spec et documentation agent

| Fichier | Rôle |
|---------|------|
| **`bob_sante.md`** | Architecture Bob, prompt, règles. Référencé par le code et la doc. |
| **`ATTENTES_BASE_CONNAISSANCES_BOB.md`** | Spec détaillée de ce que chaque fiche doit contenir. Utile pour rédaction / mise à jour. |
| **`CE_QUI_RESTE_A_FAIRE.md`** | Suivi à jour (phase 1 faite, bloc 2 fait, bloc 3 à lancer). **Document de référence pour l’avancement.** |
| **`parcours_bilan_tns.md`** | Spec détaillée du parcours (étapes, fiches à utiliser, sourçage). À garder alignée avec `docs/knowledge/bob/parcours-bilan-tns.md`. |
| **`scenarios-test-parcours-bilan-tns.md`** | Scénarios de test du parcours. Utile pour QA. |
| **`TODO_parcours_bilan_tns.md`** | Suivi parcours (fait / tests manuels restants). |

### Documents de test

| Dossier / Fichier | Rôle |
|-------------------|------|
| **`documents-de-test/`** | Exemples anonymisés (2035 BNC, 2033 BIC/IS, attestation CA). Utilisés pour tester l’upload et l’analyse Bob. **À garder.** |

---

## À SUPPRIMER ou CONSOLIDER

| Fichier | Motif | Action recommandée |
|---------|--------|---------------------|
| **`TODO.md`** | Redondant avec `CE_QUI_RESTE_A_FAIRE.md`. Contenu en retard (phase 1 marquée non faite alors qu’elle est faite). | **Supprimer** et, si besoin, pointer depuis un autre doc vers `CE_QUI_RESTE_A_FAIRE.md` pour l’état des lieux. |

---

## Récap

- **À garder** : tout le dossier `knowledge/ro/`, `bob_sante.md`, `ATTENTES_*`, `CE_QUI_RESTE_A_FAIRE.md`, `parcours_bilan_tns.md`, `scenarios-test-*`, `TODO_parcours_*`, `documents-de-test/`.
- **À supprimer** : `TODO.md` (remplacé par `CE_QUI_RESTE_A_FAIRE.md`).

Aucun fichier dans `docs/knowledge/bob/` ni dans `ro/` ne doit être supprimé : ils font partie de la base chargée par Bob.
