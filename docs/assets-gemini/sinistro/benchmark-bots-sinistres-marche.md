# Benchmark — Bots et assistants à la gestion des sinistres (marché)

> **Objectif :** Recenser les solutions existantes (France et international) pour la gestion ou l’assistance aux sinistres, et identifier ce qui peut être utile pour Sinistro (conventions FSA, qualification, recours, UX).

**Référence :** Plan d’implémentation Sinistro ; workflow `00-workflow-sinistro.md`.

---

## 1. Vue d’ensemble du marché

| Catégorie | Exemples | Cible principale |
|-----------|----------|-------------------|
| **Chatbots / assistants internes** | Aréas (SQLI), Generali (Copilot), BPCE (Zelros) | Collaborateurs, documentation, procédures |
| **Chatbots / assistants clients** | Tolk.ai, Dydu, Syntalith | Assurés : déclaration, FAQ, statut sinistre |
| **Plateformes claims end-to-end** | Sprout.ai | Assureurs : FNOL, triage, adjudication, fraude |
| **Assistants vocaux agentiques** | Travelers (OpenAI) | Clients : prise de sinistre auto par voix |
| **Copilotes conseillers** | Zelros (Insurance Copilot™) | Conseillers : recommandations, réponses, automatisation |

Aucune solution repérée ne positionne explicitement un **bot expert conventions FSA** (IRSA, IRSI, CIDE-COP, etc.) pour la **qualification + assureur gestionnaire + recours** comme cœur de produit. Sinistro comble ce créneau (usage interne gestionnaires).

---

## 2. Acteurs détaillés

### 2.1 France — Usage interne / documentation

| Acteur | Produit | Fonctionnalités utiles pour Sinistro |
|--------|---------|--------------------------------------|
| **Aréas Assurances + SQLI** | Chatbot IA documentaire | Base documentaire structurée, 95 % de précision, boucle de feedback, déploiement par silos (équipes/procédures). **À retenir :** précision mesurée, transfert de savoir-faire pour autonomie, intégration (ex. Teams). |
| **Generali France** | Microsoft 365 Copilot, Azure OpenAI, RPA | Bots RPA (2,1 M d’opérations), résolution client en self-service (1,3 M d’appels). **À retenir :** combinaison IA générative + RPA pour délester le back-office. |
| **BPCE Assurances + Zelros** | The Insurance Copilot™ | Données structurées + non structurées (CG, bases métier), réponses personnalisées, interface no-code. **À retenir :** modèle “conseiller assisté” et réponses prêtes à l’emploi (emails, conseil). |

### 2.2 France — Chatbots clients / FAQ

| Acteur | Produit | Fonctionnalités utiles pour Sinistro |
|--------|---------|--------------------------------------|
| **Tolk.ai** | Chatbot assurance (40+ entreprises) | FAQ 3× plus efficace, 500+ questions pré-construites, livechat avec tri par thématique/priorité. **À retenir :** base de questions pré-construites, parcours déclaration, clarification des garanties (tableaux de garanties). |
| **Dydu** | Chatbot banques & assurances | Parcours déclaration sinistre guidé, arbres de décision, escalade vers opérateur, RGPD / hébergement France. **À retenir :** parcours pas à pas, escalade pour cas complexes, intégration CRM/ticketing. |

### 2.3 International — Claims & FNOL

| Acteur | Produit | Fonctionnalités utiles pour Sinistro |
|--------|---------|--------------------------------------|
| **Travelers + OpenAI** | Agentic AI Claim Assistant (voix) | Prise de sinistre auto par conversation vocale : conseil, couverture, décision de déclaration, puis workflows digitaux (photos, expertise, réparation, véhicule de remplacement). **À retenir :** enchaînement conseil → décision → parcours structuré ; bascule vers humain à tout moment. |
| **Sprout.ai** | Plateforme AI claims | FNOL (extraction, résumé, alertes), OCR multilingue, vérification contrat (limites, franchises), détection fraude, prédiction coûts/réserves, auto-adjudication avec renvoi vers humain. **À retenir :** triage structuré (complexité, gravité, risque fraude, recours), sorties standardisées pour audit. |
| **Syntalith** | Chatbot IA sinistres | FNOL en 3–5 min, statut 24/7, triage, hébergement UE (RGPD). **À retenir :** délai de soumission court, coût par interaction faible (ordre de grandeur €0,50–2). |

### 2.4 Références génériques (guides, triage)

- **Botpress (guide 2025–2026) :** FNOL automatisé, collecte détails + photos + tiers, premiers éléments de responsabilité.
- **Stack AI / IntelliHuman / DataRobot :** triage avec sorties structurées (score de complexité, risque fraude, potentiel de subrogation, estimation de réserves, codes de raison pour conformité).

---

## 3. Ce qui peut nous être utile pour Sinistro

### 3.1 Format de réponse et structure (Phase 1–3 du plan)

- **Sprout / triage market :** réponses en blocs standardisés (qualification, complexité, recours, référence de clause).  
  **→ Sinistro :** garder les 5 blocs (Qualification, Cadre conventionnel, Justification, Direction de gestion, État du recours) et les rendre explicites dans le prompt et le workflow.
- **Zelros / Aréas :** réponses “prêtes à l’emploi” et citation des sources.  
  **→ Sinistro :** toujours citer la convention et la fiche (ex. fichier 02 IRSA, fichier 03 IRSI), et rappeler Convention vs droit du client.

### 3.2 Montants et seuils (IRSI / CIDE-COP)

- **Sprout / plateformes claims :** vérification systématique des montants (limites, franchises) et demande de précision si ambigu.  
  **→ Sinistro :** exiger la confirmation **HT** avant de trancher Tranche 1 / 2 / CIDE-COP ; l’indiquer dans le workflow et les instructions système.

### 3.3 Analyse de constat (image / cases)

- **Travelers :** voix → puis parcours digital (photos, étapes).  
- **Sprout :** extraction document (OCR, incohérences).  
  **→ Sinistro :** pour une image de constat : (1) lister les cases cochées (1–17, A et B), (2) demander confirmation au collaborateur, (3) seulement ensuite donner cas IRSA, assureur gestionnaire et recours. Documenter ce flux dans le workflow (déjà prévu en tâche D).

### 3.4 Garde-fou convention vs droit du client

- Aucun acteur du benchmark ne met en avant les **conventions inter-assurances (FSA)** comme cœur métier.  
  **→ Sinistro :** garde-fou explicite dans le prompt : conventions = règles **entre assureurs** ; droit commun = droit du **client** à être indemnisé ; ne jamais présenter la convention comme limitant l’indemnisation client.

### 3.5 UX et parcours (quick replies, escalade)

- **Tolk / Dydu :** questions pré-formatées, parcours guidés, escalade.  
  **→ Sinistro :** conserver les quick replies niveau 1 (accroche métier) et niveau 2 (analyse constat, qualification, glossaire) ; en cas de doute (hors convention, litige), indiquer clairement que l’indemnisation et le recours relèvent du droit commun et orienter vers un expert.

### 3.6 Métriques et fiabilité

- **Aréas/SQLI :** 95 % de précision, boucle de feedback.  
  **→ Sinistro (roadmap) :** définir des critères de succès par scénario (convention citée, assureur gestionnaire correct) et, à terme, un suivi de la qualité des réponses (Phase 4 du plan : scénarios de test, optionnel Phase 5 : feedback/traçabilité).

### 3.7 Intégration logique métier (qualifySinister)

- **Sprout / triage :** sorties structurées utilisées pour le routing et l’adjudication.  
  **→ Sinistro (Phase 3) :** pour l’auto matériel, appeler `qualifySinister()` (croix ou cas IRSA) et injecter le résultat (assureur gestionnaire, recours) dans le prompt ou en post-traitement pour aligner le LLM sur la logique déterministe.

---

## 4. Synthèse — Points à intégrer ou renforcer

| Priorité | Élément | Source benchmark | Action Sinistro |
|----------|---------|------------------|-----------------|
| **Haute** | Réponse en 5 blocs (Qualification, Convention, Justification, Gestionnaire, Recours) | Sprout, triage | Déjà dans le plan (tâche D) ; renforcer dans le workflow. |
| **Haute** | Confirmation montant HT avant IRSI T1/T2 / CIDE-COP | Sprout, bonnes pratiques claims | Expliciter dans `00-workflow-sinistro.md` et instructions système. |
| **Haute** | Analyse constat : lister cases → confirmation → puis cas IRSA / recours | Travelers, Sprout | Déjà prévu (tâche D) ; documenter dans workflow ou fiche dédiée. |
| **Haute** | Convention ≠ droit du client (garde-fou) | Spécifique FSA | Déjà dans workflow ; garder en instruction explicite. |
| **Moyenne** | Quick replies par niveau (métier vs actions) | Tolk, Dydu | Implémenter niveau 1 + niveau 2 (plan section 3). |
| **Moyenne** | Citation des fiches / conventions dans la réponse | Zelros, Aréas | Renforcer dans le style de réponse (workflow §5). |
| **Roadmap** | Scénarios de test (IRSA 10, IRSI &lt; 1 600 €, etc.) | Aréas (précision), Sprout (audit) | Phase 4 du plan. |
| **Roadmap** | Appel `qualifySinister` pour auto matériel | Sprout (routing déterministe) | Phase 3 du plan. |

---

## 5. Références

- SQLI / Aréas : [Case study Aréas Assurances chatbot](https://www.sqli.com/int-en/case-studies/areas-assurances-ai-chatbot)
- Zelros : [BPCE Assurances Insurance Copilot](https://www.zelros.com/2024/05/24/bpce-assurances-optimise-lexperience-collaborateur-avec-the-insurance-copilot/)
- Tolk.ai : [Chatbot Assurance](https://www.tolk.ai/chatbot-assurances)
- Dydu : [Chatbot Banques et assurances](https://www.dydu.ai/produits/chatbot/relation-clients/banques-et-assurances/)
- Sprout.ai : [Platform](https://sprout.ai/platform/), [9 essential features AI claims](https://sprout.ai/blog/9-essential-features-to-look-for-in-ai-claims-processing-platforms/)
- Travelers : [Agentic AI Claim Assistant (OpenAI)](https://investor.travelers.com/newsroom/press-releases/news-details/2026/Travelers-Launches-Industry-Leading-Agentic-AI-Claim-Assistant-Developed-with-OpenAI/default.aspx)
- Syntalith : [AI Chatbot Insurance Claims 2026](https://syntalith.ai/en/blog/ai-chatbot-insurance-claims-2026)
- Botpress : [Complete Guide to AI Chatbots in Insurance (2026)](https://botpress.com/en/blog/insurance-chatbots)
- IntelliHuman : [Claims Triage Workflow](https://intellihuman.ai/resources/workflows/insurance/claims-triage-workflow)

---

*Document créé pour le projet Sinistro — à jour avec les recherches marché 2025–2026.*
