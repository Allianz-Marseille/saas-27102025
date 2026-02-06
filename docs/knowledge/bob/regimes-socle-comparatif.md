# Comparatif des régimes socle (RG / SSI / RO)

Tableau de synthèse pour identifier le **régime obligatoire** selon le statut et comparer **carences**, **qui verse les IJ** et **décès** (capital, rente conjoint). Détails dans `regime-general.md`, `ro/ssi.md` et `ro/[caisse].md`. Chiffres : `regulatory-figures.ts`.

---

## Vue d’ensemble

| Régime | Public | Carence IJ | IJ J4–90 | IJ après 90 j | Invalidité (ordre) | Décès capital | Rente conjoint |
|--------|--------|------------|----------|---------------|--------------------|---------------|----------------|
| **Régime général** | Salariés secteur privé | 3 j | CPAM 50 % SJB (plafond 1,4 SMIC) | — (360 j max sur 3 ans) | 30 % / 50 % (3 cat.), plafonnée | Forfait (regulatory-figures) | Réversion 54 % (≥ 55 ans, marié) |
| **SSI** | Artisans, commerçants, industriels | 3 j (7 j sans hosp.) | SSI 1/730e RAAM, plafond PASS | — (360 j / 3 ans) | 30 % / 50 % plafonnée | ~20 % PASS cotisant | Réversion 54 % ; **pas de rente éducation** |
| **CARMF** | Médecins | 90 j | CPAM | CARMF (cl. A/B/C) | Rente selon classe | 30–60 k€ | Oui |
| **CARPIMKO** | Auxiliaires médicaux | 3 j | CPAM | CARPIMKO forfait 55,44 €/j | ~20 k€/an total, 10 k€ partiel | 36 288 € | Oui |
| **CARCDSF** | Dentistes, sages-femmes | 3 j | CPAM | CARCDSF 108,18 €/j | ~27 k€/an | ~53 k€ | Oui |
| **CAVP** | Pharmaciens | 3 j | CPAM | **Aucun** | ~17 k€/an (total uniquement) | 25 308 € | Oui |
| **CARPV** | Vétérinaires | 3 j | CPAM | **Aucun** | Selon classe (Min/Méd/Max) | 36–110 k€ | Oui |
| **CAVEC** | Experts-comptables | 3 j | CPAM | CAVEC 130 €/j | 4 classes, 66 %+ | 73–291 k€ | **Non** (option onéreuse) |
| **CIPAV** | Architectes, ingénieurs, etc. | 3 j | CPAM | **Aucun** | Forfait + proportionnel | 34–113 k€ | Oui |
| **CNBF** | Avocats | 15 j (contrats Barreaux) | Contrats Barreaux ~90 €/j | CNBF 90 €/j | ~800 €/mois (total uniquement) | 50 k€ (×2 acc., ×3 circ.) | **Non** |
| **CAVOM** | Huissiers, officiers min. | 3 j | CPAM | **Aucun** | 4 classes (A–D) | Selon classe | Oui |
| **CPRN** | Notaires | 3 j | CPAM | **Aucun** (prév. oblig. inval./décès) | 2 200 €/mois jusqu’à 62 ans | Rentes et/ou capital | Réversion |
| **CAVAMAC** | Agents généraux ass. | 3 j | CPAM | **Aucun** | 25 % commissions, min. ~24,5 k€/an | 50 % commissions + PRAGA | Oui (PRAGA) |

---

## Utilisation par Bob

- **Salarié** → `regime-general.md` ; chiffres RG dans le bloc injecté (SMIC, IJSS max, capital décès).
- **TNS artisan/commerçant** → `ro/ssi.md`.
- **Profession libérale réglementée** → identifier la caisse avec `regimes-obligatoires-tns.md` puis `ro/[caisse].md`.
- Pour répondre « différence régime général / SSI » ou « quel régime pour quel statut » : utiliser ce tableau puis renvoyer vers la fiche détaillée.

**Source :** regimes-socle-comparatif.md ; détails : regime-general.md, ro/ssi.md, ro/[caisse].md.
