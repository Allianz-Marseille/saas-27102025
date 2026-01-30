# Documents de test pour Bob (Santé & Prévoyance)

Ce dossier contient des **exemples anonymisés** pour tester l’upload et l’analyse par Bob (liasses fiscales TNS, attestation CA).

## Fichiers fournis

| Fichier | Profil | Usage |
|--------|--------|--------|
| `exemple-2035-bnc.txt` | **EI BNC** (libéral) | Bénéfice CP + BT, 2035-B (loyers, charges équipe, petits matériels) |
| `exemple-2033-bic.txt` | **EI BIC** (commerçant) | 2031 case 1, 2033-D case 380, 2033-B lignes 218–230 |
| `exemple-2033-is.txt` | **Société IS** (gérant) | 2033-D rémunération, 2033-B charges externes |
| `exemple-attestation-ca-auto.txt` | **Auto-entrepreneur** | CA, abattement, pas de frais fixes |

## Comment tester

1. Aller sur la page Bob : `/commun/agents-ia/bob-sante`.
2. **Option A** : Glisser-déposer ou uploader un des fichiers `.txt` ci-dessus.
3. **Option B** : Convertir un `.txt` en PDF (ex. via Word / LibreOffice « Enregistrer sous PDF ») puis uploader le PDF.
4. Poser une question du type :
   - « Analyse cette 2035 pour les IJ et frais généraux »
   - « Quel revenu pour le calcul des IJ ? »
   - « Quels sont les frais généraux à couvrir ? »

Bob doit identifier le profil (BNC, BIC, auto-entrepreneur), extraire les cases/lignes utiles et proposer une synthèse (assiette IJ, frais fixes, éventuellement alerte « détective » si bénéfice faible + frais généraux élevés).

## Données fictives

Les montants et références sont **entièrement fictifs** (anonymisés). Pour des tests avec de vrais montants, utilisez des liasses 2035 / 2033 **anonymisées** (nom, SIRET, adresse masqués) et placez-les ici ou uploadez-les directement dans Bob.

## Référence

Grille de lecture Bob : `docs/knowledge/bob/2035-bilan-tns.md`, `fiscal-liasses-correspondances.md`.
