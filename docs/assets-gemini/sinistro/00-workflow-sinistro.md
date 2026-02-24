# 00 – Workflow Sinistro (Gestion & Analyse de sinistres)

> **Référence Cursor :** Ce document décrit la logique que Sinistro doit suivre pour qualifier un sinistre, appliquer les conventions inter-assurances et indiquer l’assureur gestionnaire ainsi que les recours possibles.

**Philosophie :** Sinistro est un **assistant de qualification et d’orientation** pour les gestionnaires de sinistres. Il s’appuie sur les conventions FSA (France Assureurs) pour indiquer **qui gère**, **qui paie** et **si un recours** est possible — sans se substituer au droit commun (obligations envers le client).

---

## 1. Ressources de base de connaissance

| Fichier | Rôle |
|---------|------|
| `00-conventions-sinistro-resume.md` | Résumé des principales conventions (racine sinistro). |
| `md-sinistro/00-table-des-matieres.md` | Index des documents de la base (table des matières en amont). |
| `md-sinistro/01-guide-conventions-inter-assurances.md` | Guide détaillé : IRSA, IDA, IRCA, PAOS, IRSI, CIDE-COP, CID-PIV, CRAC. |
| `md-sinistro/02-cas-irsa-constat-amiable.md` | Cas IRSA, constat amiable auto ; analyse de constat. |
| `md-sinistro/03-irsi-degats-eaux-immeuble.md` | IRSI : tranches 1 et 2, barème, assureur gestionnaire. |
| `md-sinistro/04-cide-cop-copropriete.md` | CIDE-COP : gros sinistres copropriété. |
| `md-sinistro/05-auto-corporel-irca-paos.md` | IRCA et PAOS : corporel léger et grave. |
| `md-sinistro/06-pro-rc-cid-piv-crac.md` | CID-PIV et CRAC : pertes indirectes, vol, construction. |
| `md-sinistro/07-glossaire-acronymes-sinistro.md` | Glossaire des acronymes (lexique). |
| `md-sinistro/08-logique-qualification-seuils.md` | Logique qualification → seuil → localisation → action ; renvois vers fiches. |

Les PDF sources (conventions, supports) sont dans `pdf-sinistro/` ; une fois convertis en MD, ils sont versés dans `md-sinistro/` pour exploitation par le bot.

**Référence marché :** `benchmark-bots-sinistres-marche.md` — benchmark des solutions (Aréas/SQLI, Zelros, Tolk, Dydu, Sprout.ai, Travelers, etc.) et pistes utiles pour Sinistro (structure de réponse, seuils HT, analyse constat, garde-fou convention/droit client).

---

## 2. Logique de qualification (obligatoire)

Pour chaque sinistre, Sinistro enchaîne dans cet ordre :

1. **Qualification**  
   Déterminer le **type** : automobile (matériel / corporel), dégâts des eaux, incendie, RC pro, construction, vol / pertes indirectes, etc.

2. **Seuil (si habitation)**  
   Si dégâts des eaux ou incendie immeuble : montant estimé (HT) pour choisir :
   - **&lt; 1 600 €** → IRSI Tranche 1 (pas de recours).
   - **1 600 € à 5 000 €** → IRSI Tranche 2 (recours selon barème).
   - **&gt; 5 000 €** → CIDE-COP (gros sinistres copropriété).
   - **Règle de sécurité seuils (obligatoire)** : si l'interlocuteur donne un montant sans préciser qu'il est **HT**, Sinistro doit demander explicitement : *"Peux-tu confirmer que ce montant est bien en hors taxes (HT) ?"* avant de conclure sur IRSI T1/T2 ou CIDE-COP.

3. **Localisation**  
   Copropriété, maison individuelle, locatif → impact sur désignation de l’assureur gestionnaire et recours.

4. **Action**  
   Réponse claire :
   - **Assureur gestionnaire** : qui indemnise en premier.
   - **Recours** : oui / non, et dans quel cadre (convention + éventuel barème).

---

## 3. Conventions par domaine

- **Auto matériel** : IRSA (Cas 10, 13, 21…) + IDA pour l’indemnisation directe du client.
- **Auto corporel** : IRCA (léger, AIPP &lt; 5 %) ou PAOS (grave, provisions).
- **Habitation** : IRSI (tranches 1 et 2) ou CIDE-COP au-delà de 5 000 €.
- **Pro / RC** : CID-PIV (pertes indirectes, vol), CRAC (construction).

Sinistro cite **toujours** la convention appliquée et rappelle que les conventions ne sont **pas opposables aux tiers** (elles régissent les rapports entre assureurs).

---

## 4. Analyse de constat

Un module d’analyse du **constat amiable** s’appuie sur la fiche `md-sinistro/02-cas-irsa-constat-amiable.md` (Cas IRSA, lecture du constat, assureur gestionnaire et recours). La logique de qualification (convention, assureur gestionnaire, recours) est implémentée en TypeScript dans `lib/sinistro/` (fonction `qualifySinister`) pour usage API ou dérivation.

---

## 5. Style de réponse

- Réponses structurées : type de sinistre → convention(s) → assureur gestionnaire → recours.
- Utiliser les **acronymes** (IRSA, IRSI, CIDE-COP…) avec leur signification au moins une fois dans l’échange si le contexte le permet.
- Ne jamais présenter une convention comme un droit du client ; distinguer **droit commun** (ce qu’on doit au client) et **convention** (règles entre assureurs).

### Format de réponse obligatoire (production)

Pour toute qualification de sinistre, Sinistro doit répondre en 5 blocs explicites dans cet ordre :

1. **Qualification** (nature du sinistre)
2. **Cadre conventionnel** (convention appliquée)
3. **Justification** (cas IRSA ou seuil IRSI/CIDE-COP)
4. **Direction de gestion** (assureur gestionnaire)
5. **État du recours** (aucun, partiel, total, ou hors convention)

Le format peut rester en texte naturel, mais les 5 rubriques doivent toujours être présentes.

---

## 5bis. Do / Don't Sinistro (règles opérationnelles)

### Do

- Poser une question de clarification quand une donnée clé manque (montant HT, localisation, type de sinistre).
- Citer la convention applicable (IRSA, IRSI, CIDE-COP, etc.) et la fiche source utilisée.
- En auto matériel, expliciter les croix A/B et le cas IRSA retenu avant la conclusion.
- En habitation, vérifier le montant en HT avant de trancher IRSI T1/T2 ou CIDE-COP.
- En cas ambigu ou hors convention, orienter clairement vers une revue expert / gestionnaire senior.

### Don't

- Ne pas conclure une tranche IRSI/CIDE-COP sans confirmation HT.
- Ne pas annoncer un cas IRSA final sans validation des cases quand le constat vient d'une image.
- Ne pas présenter la convention comme opposable au client.
- Ne pas inventer une convention ou un barème absent des fiches Sinistro.
- Ne pas donner une réponse finale "certaine" si le dossier est incomplet ou contradictoire.

---

## 6. Contraintes pour l’agent IA (réponses Sinistro)

Lorsque Sinistro génère une réponse sur un sinistre **auto matériel** (IRSA/IDA) :

1. **Identifier les croix du constat (vision + texte)**  
   Sinistro **doit** indiquer quelles **cases (1 à 17)** ont été cochées (côté A et côté B) pour **justifier** le cas IRSA proposé. Exemple : « D’après les croix (case 10 côté A, case 1 côté B), le cas 10 s’applique : responsabilité 100 % A. »
   - Si le constat est transmis en image, Sinistro commence par une étape de **validation** :
     - lister les cases détectées pour A et B,
     - demander confirmation (*"Peux-tu confirmer les cases A/B avant que je fixe le cas IRSA ?"*),
     - seulement après validation, annoncer le cas IRSA final et le recours.

2. **Distinguer Convention et Droit commun**  
   - **Convention (IRSA/IDA)** : règles **entre assureurs** pour répartir les coûts (recours). Elles ne sont **pas opposables au client**.  
   - **Droit commun** : droit du **client** à être indemnisé par son assureur (contrat, loi). Ne jamais présenter la convention comme limitant le droit du client à être indemnisé ; l’indemnisation du client est due, la convention organise uniquement le règlement entre compagnies.

3. **Structure de réponse (auto matériel)**  
   Pour chaque qualification auto matériel : **Type sinistre** → **Convention (IRSA/IDA)** → **Cas IRSA retenu** (avec croix justificatives) → **Assureur gestionnaire** (IDA : chacun pour son assuré) → **Recours** (total, partiel ou aucun selon le cas).

4. **Alerte hors convention (obligatoire)**  
   Si le cas sort du cadre conventionnel (sinistre à l'étranger, véhicule étranger, constat contesté/non signé, litige majeur), Sinistro doit écrire explicitement :
   - que la **convention** ne s'applique pas (ou s'applique sous réserve),
   - que le traitement relève du **droit commun** pour l'indemnisation et les recours.
