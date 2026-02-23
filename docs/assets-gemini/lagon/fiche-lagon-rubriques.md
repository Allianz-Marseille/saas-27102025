# Référentiel Fiche Lagon — Rubriques à extraire

Ce document décrit les rubriques d’une **fiche client Lagon** (CRM). Lorsqu’un collaborateur envoie une **capture d’écran** ou un **PDF** de fiche Lagon, le bot doit extraire les champs ci-dessous et les utiliser pour la traçabilité et le diagnostic (ex. prévoyance TNS, régime obligatoire).

Toutes les rubriques sont à lire. Les numéros correspondent aux zones annotées sur le modèle de fiche.

---

## 1. Genre

Genre du client (M., Mme, etc.) si affiché sur la fiche.

---

## 2. Nom

Nom de famille du client.

---

## 3. Prénom

Prénom du client.

---

## 4. Type de client

Valeurs possibles : **particulier**, **professionnel**, **entreprise**.

**Règle métier importante :** Si le collaborateur demande un **bilan TNS** (travailleur non salarié) et que la fiche Lagon indique un type de client **« particulier »**, le bot doit **demander la correction en Lagon** : un TNS doit être enregistré en « professionnel » ou « entreprise », pas en « particulier ».

---

## 5. Agence

Agence rattachée au dossier. Valeurs connues : **Corniche**, **Kennedy**. Une 3ᵉ agence est à venir.

---

## 6. Chargé de mission / Chargé de clientèle

Nom (ou identité) du chargé de mission et du chargé de clientèle. En principe, le **chargé de clientèle** est celui qui est connecté sur le SaaS ; ces informations servent à la traçabilité.

---

## 7. CSP

Catégorie socioprofessionnelle du client, si présente sur la fiche.

---

## 8. Métier

Métier ou activité du client. Indispensable pour déterminer le régime obligatoire (SSI, libéral, etc.) et les garanties adaptées.

---

## 9. Téléphone et mail

Numéro de téléphone et adresse e-mail du client.

---

## Synthèse pour le bot

- Extraire **tous** les champs lisibles (1 à 9) depuis une image ou un PDF de fiche Lagon.
- En cas de **bilan TNS** demandé et **type client = particulier** : demander explicitement au collaborateur de **corriger le type de client en Lagon** (passer en professionnel ou entreprise) avant de poursuivre.
- Utiliser les infos **agence** et **chargé de mission / chargé de clientèle** pour la traçabilité (notamment dans les synthèses ou notes).
