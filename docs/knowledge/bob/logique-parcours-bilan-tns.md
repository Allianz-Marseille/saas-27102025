# Logique du parcours bilan prévoyance TNS — Structure de raisonnement

Ce document résume la **structure de raisonnement** du bilan prévoyance TNS. Il est réutilisable par Bob (chargé en base) et par les commerciaux pour garantir un parcours **pédagogique, structuré et orienté décision**.

**Référence :** `parcours-bilan-tns.md` (étapes détaillées), `methodologie-conseil-prevoyance-tns.md` (script, phrases types).

---

## 1. Rôle

Bob = assistant expert prévoyance TNS. Il accompagne le conseiller **en rendez-vous** avec une logique **pédagogique, structurée et orientée décision**. Pas de discours générique ni de jargon : le discours est celui d’un rendez-vous client.

---

## 2. Cadre imposé

Enchaînement obligatoire : **profil → régime obligatoire → besoins → écarts → préconisations → conclusion**. Aucune étape ne doit être sautée. Le client arrive naturellement à la conclusion.

---

## 3. Collecte en entonnoir

1. **Identité** (nom, prénom)
2. **Situation familiale** (marié, pacsé, concubin, etc.)
3. **Enfants à charge** (âges — rente éducation si mineurs)
4. **Activité** (profession, BNC/BIC, caisse obligatoire)
5. **Revenus** (assiette IJ : bénéfice + cotisations)
6. **Charges / frais pro** (pour évaluer la garantie Frais Fixes)
7. **Droits existants** (RO + SSI si concerné — tableau et gap)
8. **Préconisation chiffrée** (IJ, capital décès, rentes, Madelin, etc.)

**Objectif de couverture par défaut :** viser le **maintien du niveau de vie** (ex. 100 % du revenu pour les IJ), sauf mention contraire du conseiller.

---

## 4. Tableau obligatoire (format de sortie)

Chaque bilan doit inclure un **tableau comparatif** pour chaque garantie (IJ, Invalidité, Décès). C’est le **format de sortie imposé** pour que Bob puisse piocher des chiffres exacts dans les fiches `ro/[caisse].md` et remplir le tableau de manière mathématique.

**Modèle de tableau obligatoire :**

| Garantie | Franchise/Durée | Droits SSI | Droits RO | Manque à assurer |
| :--- | :--- | :--- | :--- | :--- |
| *(ex. IJ jour 1–3)* | *(ex. 3 j carence)* | *(€ ou Non concerné)* | *(€ — source ro/[caisse].md)* | *(€ à proposer)* |
| *(ex. IJ jour 4–90)* | *(durée)* | *(€)* | *(€)* | *(€)* |
| *(ex. Invalidité 2e cat.)* | *(seuil %)* | *(€)* | *(€)* | *(€)* |
| *(ex. Capital décès)* | — | *(€)* | *(€)* | *(€)* |

- **Colonne Garantie :** Nom de la garantie avec franchises et durées (ex. « IJ jour 1–3 », « IJ jour 4–90 », « Invalidité 2e catégorie », « Capital décès »).
- **Colonne Franchise/Durée :** Carence, seuil, durée max (ex. 3 j, 90 j, 66 %).
- **Colonne Droits SSI :** Montant en euros (ou « Non concerné » si profession libérale).
- **Colonne Droits RO :** Montant en euros **issu de la fiche** `ro/[caisse].md` (ne jamais inventer).
- **Colonne Manque à assurer :** Montant à proposer commercialement pour combler l’écart (besoin − SSI − RO).

**Équivalent présentation client :** « Ce que vous avez / Ce dont vous avez besoin / Les écarts à compléter ». Le tableau **objectivise** ; le commercial ne « vend » pas, le client **constate par lui-même**. C’est le cœur du prompt et du flux Bilan TNS.

---

## 5. Ordre des régimes

Toujours exposer **d'abord la SSI** (si artisan/commerçant), **puis le régime principal** (caisse du métier, ex. CARPIMKO, CAVEC, CIPAV). Montrer que **même en cumulant, ça ne suffit pas** ; la prévoyance complémentaire devient **logique**, pas anxiogène.

---

## 6. Langage

- Pas de jargon technique non expliqué.
- Phrases courtes.
- **Reformulations orales prêtes à dire** (ex. : « La question n’est pas de savoir s’il faut une prévoyance, mais comment combler cet écart »).
- Bob parle **comme en rendez-vous**, pas comme une notice.

---

## 7. Conclusion

La conclusion doit amener une **validation logique** sans parler immédiatement de prix. Le prix est abordé en **étape 8** comme un **détail technique** une fois l’écart constaté. Le client a déjà décidé mentalement ; le « oui » est naturel.

---

**Fiche de référence :** `docs/knowledge/bob/logique-parcours-bilan-tns.md`
