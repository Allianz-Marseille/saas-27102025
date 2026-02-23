# 00 – Table des matières – Base de connaissance Sinistro

Ce document sert d’**index et de guide de priorité** pour le traitement des sinistres via l’IA. Les documents sont classés par étape du workflow : **Qualification → Application des Conventions → Action**. L’IA doit s’en servir comme plan de vol : lire d’abord la logique système, puis la branche métier concernée.

---

## Logique Système & Workflow (Priorité haute)

Documents à consulter **en premier** pour comprendre comment utiliser le reste de la base.

| Fichier | Rôle | Tags |
|---------|------|------|
| **00. Workflow Maître** ([`../00-workflow-sinistro.md`](../00-workflow-sinistro.md)) | **Document pivot** : philosophie de gestion, ordre des opérations (Qualification > Seuil > Localisation > Action), contraintes pour l’agent IA (croix du constat, Convention vs Droit commun). | — |
| **08. Logique de qualification** ([`08-logique-qualification-seuils.md`](08-logique-qualification-seuils.md)) | Arbre de décision technique pour l’aiguillage entre conventions ; type de sinistre → convention → fiche à consulter. | Seuils |
| **07. Glossaire & Lexique** ([`07-glossaire-acronymes-sinistro.md`](07-glossaire-acronymes-sinistro.md)) | Définition des concepts (IRSA, IDA, AIPP, FSA, Recours, Assureur gestionnaire) pour garantir la précision terminologique. | Définitions |

---

## Branche Automobile (IRSA / IDA / IRCA)

Conventions et barèmes pour les sinistres **auto matériel** et **auto corporel**.

| Fichier | Rôle | Tags | Statut |
|---------|------|------|--------|
| **01. Guide des conventions** ([`01-guide-conventions-inter-assurances.md`](01-guide-conventions-inter-assurances.md)) | Vue d’ensemble des accords matériels (IRSA, IDA) et corporels (IRCA, PAOS) ; liens utiles. | Définitions | Complet |
| **02. Barème responsabilités (IDA)** ([`02-cas-irsa-constat-amiable.md`](02-cas-irsa-constat-amiable.md)) | Détail des Cas IRSA (10, 13, 15, 17, 20, 40) ; croix du constat (cases 1 à 17) ; assureur gestionnaire et recours ; contraintes IA. | Barèmes | En cours d’enrichissement |
| **05. Corporel (IRCA / PAOS)** ([`05-auto-corporel-irca-paos.md`](05-auto-corporel-irca-paos.md)) | Gestion des seuils AIPP et des provisions ; corporel léger vs grave. | Seuils, Définitions | Complet |

---

## Branche Habitation (IRSI / CIDE-COP)

Conventions pour les **dégâts des eaux** et **incendie** en immeuble.

| Fichier | Rôle | Tags | Statut |
|---------|------|------|--------|
| **03. IRSI – Dégâts des eaux** ([`03-irsi-degats-eaux-immeuble.md`](03-irsi-degats-eaux-immeuble.md)) | **Règles de seuils** : Tranche 1 (&lt; 1 600 € HT), Tranche 2 (1 600 € – 5 000 € HT) ; assureur gestionnaire ; renvoi CIDE-COP au-delà de 5 000 €. | Seuils, Barèmes | Complet |
| **04. CIDE-COP – Copropriété** ([`04-cide-cop-copropriete.md`](04-cide-cop-copropriete.md)) | Procédures pour les sinistres lourds (&gt; 5 000 €) en copropriété ; parties communes / privatives ; recours. | Seuils | Complet |

---

## Branche Professionnelle & Construction

Conventions **Vol, Pertes indirectes** et **Assurance Construction**.

| Fichier | Rôle | Tags | Statut |
|---------|------|------|--------|
| **06. Pro & RC (CID-PIV / CRAC)** ([`06-pro-rc-cid-piv-crac.md`](06-pro-rc-cid-piv-crac.md)) | Conventions spécifiques : Pertes indirectes et Vol (CID-PIV), Assurance Construction (CRAC). | Définitions | Complet |

---

## Utilisation par l’IA

- **Citation recommandée** : Répondre en citant la branche et le fichier, ex. *« Selon la branche Habitation (fichier 03 – IRSI)… »* ou *« D’après le barème responsabilités (fichier 02)… »*.
- **Statut "En cours d’enrichissement"** : Pour le fichier 02 (barème IRSA), le contenu est exploitable mais peut être complété (ex. autres cas, précisions barème officiel). En cas de doute, l’IA peut indiquer la source et inviter à vérifier les conventions PDF.
- **Tags** : **Seuils** = règles de montants (1 600 €, 5 000 €, AIPP) ; **Barèmes** = répartition des responsabilités (Cas IRSA, tranches IRSI) ; **Définitions** = lexique et cadres conventionnels.

---

**Sources PDF originales :** Situées dans `../pdf-sinistro/`. En cas de contradiction, la version Markdown fait foi pour le bot ; le PDF reste la référence juridique officielle.
