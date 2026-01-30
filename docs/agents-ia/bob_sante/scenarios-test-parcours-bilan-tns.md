# Scénarios de test — Parcours Bilan prévoyance TNS

Référence : [parcours_bilan_tns.md](./parcours_bilan_tns.md) — [TODO_parcours_bilan_tns.md](./TODO_parcours_bilan_tns.md)

Scénarios types pour tests manuels et régression du parcours bilan prévoyance TNS.

---

## Prérequis

1. Aller sur la page Bob : `/commun/agents-ia/bob-sante` (ou `/bob`).
2. Cliquer sur « Bonjour » pour démarrer la conversation.
3. Cliquer sur le bouton **« Bilan prévoyance TNS »** (message d’amorce envoyé).

---

## Scénario 1 — Libéral BNC (grandes masses uniquement)

**Profil :** Médecin libéral, BNC, pas de documents fournis.

| Étape | Bob demande | Utilisateur répond |
|-------|--------------|--------------------|
| 1.1 | Situation familiale | Marié, 2 enfants (8 et 12 ans). |
| 1.2 | Profession / activité | Médecin libéral, BNC, NAF 86.21A. |
| 1.3 | Revenu (documents ou grandes masses) | Pas de document, je vous donne les chiffres : bénéfice 55 000 €, cotisations sociales 22 000 €. |
| 2.4 | Synthèse revenu | (Bob calcule : revenu IJ = 77 000 €) → « Souhaitez-vous qu’on passe aux besoins ? » |
| 3.1 | IJ | 90 % du revenu, franchise 30 jours, pas de contrat existant. |
| 3.2 | Capital décès | Oui, protéger le conjoint et les enfants, capital cible environ 3 ans de revenus. |
| 3.3 | Rente éducation / rente conjoint | Rente éducation oui pour les 2 enfants ; conjoint sans revenu, rente conjoint oui. |
| 4.1 | Madelin | Oui, rappeler les plafonds. |
| 4.2 | CCN | Non, pas de convention collective. |
| 5 | Synthèse | (Bob propose résumé, export PDF, lien devis.) |

**Points à vérifier :** Bob ne demande jamais la 2035 ; il calcule le revenu IJ à partir des grandes masses ; il propose bien rente éducation et rente conjoint ; en fin de parcours il propose résumé / PDF / devis.

---

## Scénario 2 — Commerçant BIC (grandes masses)

**Profil :** Artisan commerçant, BIC, uniquement les chiffres.

| Étape | Bob demande | Utilisateur répond |
|-------|--------------|--------------------|
| 1.1 | Situation familiale | Pacsé, 1 enfant 5 ans. |
| 1.2 | Profession / activité | Artisan plombier, BIC, NAF 43.21A. |
| 1.3 | Revenu | Résultat fiscal 42 000 €, cotisations (2033-D case 380) 16 500 €. |
| 2.4 | Synthèse revenu | (Bob : revenu IJ = 58 500 €) → passage aux besoins. |
| 3.1 | IJ | 80 % du revenu, franchise 45 jours. |
| 3.2 | Capital décès | Oui, conjoint et enfant ; capital pour dettes + 2 ans de train de vie. |
| 3.3 | Rente éducation / rente conjoint | Rente éducation oui ; conjoint actif, pas de rente conjoint. |
| 4.1 | Madelin | Non, pas besoin. |
| 4.2 | CCN | Non. |
| 5 | Synthèse | (Bob propose résumé, PDF, devis.) |

**Points à vérifier :** Formule BIC bien rappelée (2031 case 1 + 2033-D case 380) ; pas d’exigence de liasses ; rente conjoint non proposée si conjoint actif.

---

## Scénario 3 — Auto-entrepreneur (grandes masses)

**Profil :** Consultant, BIC prestations de services, micro-entreprise.

| Étape | Bob demande | Utilisateur répond |
|-------|--------------|--------------------|
| 1.1 | Situation familiale | Concubin, pas d’enfants. |
| 1.2 | Profession / activité | Consultant freelance, auto-entrepreneur BIC prestations. |
| 1.3 | Revenu | CA 28 000 €, régime BIC prestations (abattement 50 %). |
| 2.3 / 2.4 | Revenu après abattement | (Bob calcule : 28 000 − 50 % = 14 000 €) → passage aux besoins. |
| 3.1 | IJ | Compenser la perte de revenu, pas de contrat existant. |
| 3.2 | Capital décès | Conjoint à protéger, pas d’enfants ; capital modéré. |
| 3.3 | Rente conjoint | Conjoint dépendant financièrement, oui pour rente conjoint. |
| 4.1 | Madelin | Oui, rappeler les plafonds. |
| 4.2 | CCN | Non. |
| 5 | Synthèse | (Bob propose résumé, PDF, devis.) |

**Points à vérifier :** Formule auto-entrepreneur (CA − abattement 50 % BIC prestations) ; pas d’exigence d’attestation CA ; rappel clause bénéficiaire nominative pour concubin (audit-diagnostic-conseiller).

---

## Scénario 4 — Rappel d’étape (« Où en est-on ? »)

**Contexte :** Parcours en cours (ex. après avoir donné situation familiale + profession).

| Action utilisateur | Réponse attendue de Bob |
|--------------------|--------------------------|
| « Où en est-on ? » ou « On en est où ? » ou « Récap » | Résumé de l’étape en cours, des infos déjà collectées (ex. : marié 2 enfants, médecin libéral BNC), et proposition de la prochaine question (ex. : revenu à assurer — grandes masses ou documents). |

**Points à vérifier :** Bob ne redemande pas tout ; il résume et enchaîne sur la suite.

---

## Scénario 5 — Avec upload (optionnel)

**Contexte :** En étape 1.3 ou 2, l’utilisateur envoie un fichier 2035 ou 2033 au lieu de donner les grandes masses.

| Action utilisateur | Réponse attendue de Bob |
|--------------------|--------------------------|
| Envoi d’un fichier (ex. `exemple-2035-bnc.txt` ou `exemple-2033-bic.txt`) | Bob extrait les montants (bénéfice + cotisations pour BNC ; résultat + cotisations pour BIC), calcule le revenu IJ, rappelle la formule. Si bénéfice faible et frais généraux élevés → alerte « Frais Fixes » (règle détective). |

**Points à vérifier :** Analyse conforme au cœur Bob (costume juridique, formules IJ, alerte Frais Fixes si pertinent).

---

## Checklist régression

- [ ] Scénario 1 (BNC grandes masses) : parcours complet, pas d’exigence de document, synthèse finale avec proposition PDF / devis.
- [ ] Scénario 2 (BIC grandes masses) : formules BIC correctes, rente conjoint adaptée (conjoint actif = pas de rente).
- [ ] Scénario 3 (Auto-entrepreneur) : formule abattement 50 % BIC prestations, rappel clause bénéficiaire pour concubin.
- [ ] Scénario 4 (Rappel d’étape) : « Où en est-on ? » → résumé + prochaine question.
- [ ] Scénario 5 (Upload) : analyse 2035/2033, formules IJ, alerte Frais Fixes si pertinent.
