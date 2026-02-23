# 02 – Référentiel IRSA : Cas de Responsabilité & Désaccords

Ce document définit les **règles de détermination des responsabilités** selon le barème IRSA (Convention d’Indemnisation Directe et de Recours) et intègre la **gestion des litiges** sur le constat (observations, schéma contradictoire, parole contre parole).

**Contexte :** **IRSA** = convention cadre (accidents matériels entre véhicules). **IDA** = volet opérationnel : chaque assureur indemnise **directement** son client, sans attendre le recours. Le constat a la même valeur juridique (papier ou **e-constat auto**, DARVA).

**Sommaire**
- 1. Barème de responsabilité (identifiants de règle)
- 2. Logique d’analyse des croix (priorité, croix bloquantes, cas indéterminés)
- 3. Gestion des désaccords et observations (recto / verso)
- 4. Algorithme d’analyse pour l’agent IA (Sinistro)
- 5. Rappel gestionnaire (IDA)
- Références

---

## 1. Barème de responsabilité (identification par cas)

Chaque règle possède un **identifiant unique** (`IRSA_10`, `IRSA_13`, etc.) pour citation univoque par l’IA et pour usage dans le code (switch/case, filtrage).

| ID règle | Cas | Situation déterminante | Resp. A | Resp. B | Preuve (croix cruciales) |
|----------|-----|------------------------|---------|---------|---------------------------|
| `IRSA_10` | **10** | Choc à l’arrière (même file, même sens) | 100 % | 0 % | A : case 9 ou 11 / B : case 1 ou 10 (B heurté par l’arrière) |
| `IRSA_13` | **13** | Sens inverse / empiètement axe médian | 50 % | 50 % | A : case 12 / B : case 12 |
| `IRSA_15` | **15** | Changement de file ou de direction | 100 %* | 0 %* | *Responsable = celui qui a coché case 5, 6 ou 7 |
| `IRSA_17` | **17** | Sortie de stationnement ou voie privée | 100 %* | 0 %* | *Responsable = celui qui a coché case 3 ou 4 |
| `IRSA_20` | **20** | Refus de priorité (intersection) | 100 %* | 0 %* | *Responsable = celui qui a refusé la priorité (case 6, 7 ou 8) |
| `IRSA_40` | **40** | Choc sur véhicule en stationnement régulier | 100 % | 0 % | A : case 9 (circulait) / B : case 1 (à l’arrêt / stationnement) |

*Pour les cas 15, 17 et 20 : le 100 % s’applique au conducteur **responsable** ; adapter A/B selon les croix (celui qui a coché la case « bloquante » est responsable).

---

## 2. Logique d’analyse des croix (algorithme Sinistro)

Pour déterminer le cas applicable, Sinistro doit suivre cet **ordre de priorité**. Les croix sont **prioritaires** sur le schéma pour l’application de la convention IRSA.

### A. Croix « bloquantes » (100 % responsabilité)

Si un conducteur a coché **l’une de ces cases**, il est présumé responsable à **100 %** (sauf preuve contraire cohérente sur le schéma) :

| Case | Libellé type | Règle |
|------|--------------|--------|
| **2** | Je circulais en marche arrière | Responsable à 100 % |
| **3** | Je quittais un stationnement | Responsable à 100 % |
| **4** | Je m’insérais (parking, voie privée) | Responsable à 100 % |
| **14** | Je circulais en sens interdit | Responsable à 100 % |

*À adapter selon le formulaire officiel (numérotation des cases peut varier).*

### B. Règle du « changement de couloir »

Dès qu’un véhicule **quitte sa file** (case 5) ou **tourne** (cases 6 ou 7), il perd sa priorité conventionnelle face à un véhicule circulant **normalement dans sa file**. Le conducteur qui a coché 5, 6 ou 7 est en général responsable à 100 % (cas `IRSA_15` ou `IRSA_20` selon contexte).

### C. Règle de l’arrêt : Case 1 vs Case 10

**Distinction importante pour l’IA :**

- **Case 1** (« Mon véhicule était à l’arrêt ») : véhicule **immobile** (stationnement ou arrêt). Souvent 0 % de responsabilité si l’autre heurte (cas `IRSA_40` si B en stationnement, ou choc arrière).
- **Case 10** (« Mon véhicule avait été heurté par l’arrière ») : indique que **ce conducteur** a été heurté à l’arrière → 0 % pour lui, 100 % pour l’autre (cas `IRSA_10`).

*Case 1 + Case 10 côté B = véhicule B totalement immobile et heurté à l’arrière → B 0 %, A 100 %.*

### D. Cas indéterminés (règle par défaut)

Si les croix sont **contradictoires**, **insuffisantes** ou **identiques** des deux côtés (ex. A et B cochent tous les deux la case 5), Sinistro doit :

1. **Appliquer par défaut le partage 50 / 50** (équivalent cas `IRSA_13`).
2. **Indiquer explicitement** : « Croix insuffisantes ou contradictoires ; application du partage 50/50 par défaut. Recommandation : vérifier le schéma ou les observations au verso. »
3. **Ne jamais** affirmer un cas à 100 % / 0 % sans croix ou schéma cohérent ; en cas de doute, privilégier le 50/50 et mentionner que le **droit commun** peut conduire à une autre répartition (expertise, tribunal).

---

## 3. Gestion des désaccords et observations (recto / verso)

Si les conducteurs ne sont pas d’accord sur les circonstances, Sinistro doit appliquer les règles de priorité suivantes.

### A. Observations au recto (zone réservée / case 14)

- **Priorité absolue :** Les **observations écrites et signées par les deux parties** au recto priment sur les croix en cas de contradiction flagrante. Si les deux ont signé une mention précisant les circonstances (ex. « B a brûlé le feu »), cette mention peut orienter le cas IRSA.
- **Désaccord unilatéral :** Si **seul un conducteur** a rédigé une observation (ex. « B a brûlé le feu ») sans que l’autre ne signe ou ne confirme, l’observation n’a **pas de valeur conventionnelle automatique**. Sinistro doit le **signaler** et recommander une gestion en **droit commun** (expertise, recours contentieux si besoin).

### B. Désaccord sur le schéma

- Si le **schéma dessiné contredit les cases cochées** (ex. le schéma montre un choc latéral mais les deux ont coché « même sens »), Sinistro doit **privilégier les croix** pour l’application de la convention IRSA.
- En cas de **schéma illisible** ou **contradictoire** entre les deux versions (recto/verso ou deux constats), le cas est souvent requalifié en **50/50 (indéterminé)** avec mention que des preuves externes (témoins, vidéo) peuvent permettre un recours en droit commun.

---

## 4. Algorithme d’analyse pour l’agent IA (Sinistro)

Pour garantir une réponse fiable aux collaborateurs, Sinistro suit cet enchaînement :

1. **Extraction des preuves**  
   Lister explicitement **Croix A : [numéros]** et **Croix B : [numéros]**, puis toute **observation** écrite au recto (et indiquer si signée par les deux ou un seul).

2. **Vérification de la cohérence**  
   Le nombre et le sens des croix sont-ils logiques ? Un conducteur ne peut pas cocher simultanément « à l’arrêt » (case 1) et « changeait de file » (case 5). En cas d’incohérence interne, signaler et appliquer le **cas de repli** (50/50).

3. **Application du cas de repli**  
   Si les versions sont **irréconciliables** (parole contre parole sans témoin, croix identiques ou contradictoires), proposer le **partage 50/50** (`IRSA_13`) en précisant que l’assureur peut tenter un **recours en droit commun** si des preuves externes existent (témoins, vidéo, expertise).

4. **Citation des règles**  
   Utiliser l’**ID règle** dans la réponse (ex. « Selon la règle `IRSA_10`… ») pour faciliter la traçabilité.

---

## 5. Rappel gestionnaire (IDA)

- **Règle d’or :** L’**assureur du véhicule A** gère toujours le sinistre **de A** ; l’**assureur du véhicule B** gère toujours le sinistre **de B**. Même si A est 0 % responsable, son assureur indemnise A puis exerce le recours contre l’assureur de B.
- **Indépendance du recours :** L’indemnisation du client **ne doit jamais être suspendue** à l’acceptation du recours par l’assureur adverse. Ne **jamais** dire au client : « Vous n’êtes pas payé car l’autre assureur refuse le recours ». Le recours est une transaction **back-office entre assureurs**.
- **Témoins :** Sinistro doit **systématiquement** demander si des **témoins** sont inscrits sur le constat. La présence de témoins peut permettre de **sortir de la convention** en cas de litige majeur (contestation, recours en droit commun).

---

## Références

- **e-constat auto** (application officielle) : [www.e-constat-auto.fr](https://www.e-constat-auto.fr)
- **France Assureurs** : [www.franceassureurs.fr](https://www.franceassureurs.fr)
- Conventions et barèmes officiels : documents dans `../pdf-sinistro/` (ex. Barème IRSA).
