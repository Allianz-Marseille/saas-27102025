# M+3 — Process de suivi client (à ~3 mois)

**Ce document** décrit le **workflow détaillé pour le bot M+3** (étapes, prompts, exemples). La définition métier (objectifs, échéance, critères) est reprise en introduction ci-dessous.

## 1. Introduction

### Pourquoi on le fait

Transformer un client « besoin ponctuel » (auto, MRH, etc.) en **relation globale** + sécuriser la **qualité du dossier** + générer des **opportunités concrètes** pour atteindre l'objectif **« client complet »**.

### Quand / pour qui

- Tous les **nouveaux clients** (origine : chalandise, reco, lead Allianz, site, salarié d'une boîte assurée, franchisé, etc.).
- Déclenché autour de **M+3** après la souscription.

### Finalité — Définition « Client complet »

Un M+3 est **réussi** si :

1. **Fiche CRM à jour**
2. **Contrats finalisés** (signatures + pièces)
3. **Bilan global fait**
4. **Actions commerciales tracées** (devis / RDV / relances)

---

## 2. Workflow utilisateur — Le cœur du document

### Phase 1 : Préparation (CDC seul, avant l'appel)

#### Démarrage

**Clic sur "Bonjour"** : Le CDC clique sur le bouton "Bonjour" dans l'interface pour lancer le workflow M+3.

**Le bot vous demande** :
- De coller la **fiche client Lagon**
- De coller la **fiche contrat** (masque des contrats en cours)

**Exemple de message initial du bot :**

> Bonjour ! Je vais vous accompagner pour réaliser un M+3.  
> Pour commencer, veuillez **copier-coller la fiche client Lagon** dans cette conversation.

#### Import des données

**Vous copiez-collez** dans le chat :
1. **Fiche client Lagon** (copier/coller)
2. **Masque des contrats en cours** (copier/coller) — tous les contrats actifs "chez nous"

Le bot extrait et structure automatiquement les données.

#### Analyse automatique et feedback

Le bot analyse les données et vous présente **3 éléments clés** :

##### ✅ Ce qui est présent mais à confirmer

- **Données client** : champs présents mais à vérifier avec le client (ex. : adresse, téléphone, situation familiale)
- **Contrats** : nature détectée mais à valider (ex. : "J'ai détecté un contrat Auto, confirmez-vous ?")
- **Pièces** : mentionnées mais statut incertain (signatures, documents)

**Format** : liste avec indicateurs ⚠️ "À confirmer avec le client"

##### ❌ Ce qui est absent et à compléter

- **Champs manquants** selon le type de client (personne physique vs personne morale)
- **Pièces manquantes** selon la nature des contrats détectés
- **Informations critiques** pour la qualité du dossier (DER)

**Format** : liste avec indicateurs ❌ "À compléter" + questions prêtes à poser au client

##### 🎯 Axes commerciaux prioritaires

Le bot analyse **"qui est le client"** + **"contrats chez nous"** et détermine les axes de développement prioritaires :

- **Trous logiques identifiés** : ce qui manque selon sa situation (famille, biens, activité, protection)
- **Opportunités commerciales** : recommandations TOP 3 basées sur le profil client
- **Questions clés à poser** : pour identifier les besoins non couverts
- **Plan d'action suggéré** : devis à faire, RDV à caler, docs à demander

**Exemple de sortie :**

> **Client détecté** : Personne physique, 35 ans, marié, 2 enfants, salarié cadre  
> **Contrats chez nous** : Auto uniquement  
> **Axes à privilégier** :
> 1. Habitation (pas de contrat détecté)
> 2. Santé/Prévoyance (famille avec enfants)
> 3. Protection juridique (salarié cadre)

#### Validation interactive

**Le bot pose des questions ciblées** pour compléter/valider les informations manquantes.

**Boutons cliquables** : Le bot propose des boutons interactifs pour fluidifier l'interaction :

- **Questions binaires** : "Le client est propriétaire ?" → [OUI] [NON]
- **Choix multiples** : "Situation matrimoniale ?" → [Célibataire] [Marié(e)] [Pacsé(e)] [Divorcé(e)] [Veuf(ve)]
- **Validation rapide** : "Le contrat Auto est signé ?" → [✅ Valider] [❌ Rejeter] [⚠️ À modifier]

**Gain de temps** : Pas besoin de taper, clic direct sur les boutons.

#### Résultat de la préparation

**Vous disposez maintenant de** :
- ✅ **Checklist qualité** : ce qui est OK / à confirmer / à compléter
- 🎯 **Feuille de route commerciale** : axes prioritaires + questions clés
- 📋 **Plan d'action** : étapes structurées pour l'appel

**Vous êtes prêt** pour l'appel client avec un dossier préparé et des objectifs clairs.

---

### Phase 2 : Appel client

#### Accroche (téléphone ou RDV)

**Prétexte** : « admin / mise à jour dossier ». Peut être fait par **un autre CDC** que celui qui a vendu.

**Exemple d'intro :**

> « C'est Julien qui a mis en place votre contrat auto. Moi je vais vous suivre et gérer votre dossier. Vous avez 3 minutes, sinon on cale un RDV téléphonique ? »

#### Mise à jour en temps réel

**Pendant l'appel, vous mettez à jour** les informations manquantes directement dans le chat avec le bot.

**Boutons rapides** : Le bot propose des boutons pour valider rapidement les réponses du client :

- "Le client confirme son adresse ?" → [OUI] [NON] [À modifier]
- "Contrat signé ?" → [OUI] [NON] [En attente]
- "Le client a une assurance habitation ailleurs ?" → [OUI] [NON] [Ne sait pas]

**Le bot peut** :
- Noter les réponses du client
- Mettre à jour la checklist en temps réel
- Suggérer des questions de relance selon les réponses

#### Objectifs de l'appel

##### Objectif 1 — Dossier carré dans Lagon (qualité données)

**But** : fiche CRM propre, complète, bien affectée — image « agence sérieuse ».

**Vous vérifiez / complétez selon le type** :
- **Particulier** : adresse, date **et lieu** de naissance, tel, email, situation familiale, situation pro…
- **Pro** : SIRET, NAF, activité, CA, effectif…
- **Entreprise** : idem + contact « gestion assurances » si besoin.

**Vous vérifiez** : agence / point de vente / chargé de clientèle bien renseignés.

**Résultat attendu** : fiche Lagon complète (base DER + traçabilité).

##### Objectif 2 — Contrats « finalisés » (signatures + pièces)

**But** : éviter les contrats « pas clean » (risque conformité / gestion / sinistre).

**Vous vérifiez** :
- Que tout est **signé** (DP, devis/projet selon cas)
- Les **pièces** (ex. : carte grise, permis, CNI, bail, etc.)
- Ce qui manque + plan de récupération (mail/SMS, relance, échéance)

**Résultat attendu** : contrat(s) sécurisés + dossier complet.

##### Objectif 3 — Bilan global (développement)

C'est le moment « commercial intelligent ».

**Phrase déclencheur type :**

> « On est maintenant votre assureur pour l'auto. Qui sont vos autres assureurs ? »

**Vous identifiez** :
- Ce qu'il a chez nous / ailleurs
- Les trous logiques selon sa situation (famille, biens, activité, protection…)

**Vous définissez un plan d'action** :
- devis à faire
- RDV à caler
- docs à envoyer
- relances

**Résultat attendu** : opportunités concrètes + prochaines étapes datées.

#### Analyse finale

**À la fin de l'appel**, le bot refait une analyse complète avec toutes les informations mises à jour.

**Priorités finales** : Détermination des axes commerciaux en connaissance de cause, basés sur toutes les informations collectées.

---

### Phase 3 : Sorties (selon besoin du CDC)

Selon votre demande et le contexte, le workflow M+3 peut aboutir à l'une ou plusieurs de ces sorties :

#### DER (conformité documentaire)

**Fourniture d'une fiche client exhaustive et conforme** aux exigences de conformité (DDA/RGPD).

- Vérification et traçabilité des données collectées
- Document prêt pour la conformité réglementaire

#### Mail avec préconisations

**Génération d'un mail** (copiable, exportable) synthétisant la situation client à M+3.

**Contenu du mail** :

1. **Synthèse M+3** : Bilan de la qualité du dossier, situation actuelle
2. **Opportunités commerciales TOP 3** : Recommandations basées sur le profil client
3. **Liens tarificateurs automatiques** : Selon les opportunités identifiées, le bot inclut les liens vers les tarificateurs en ligne Allianz avec le code agence H91358
4. **Plan d'action daté** : Devis à faire, nouveaux RDV, relances avec échéances

**Exemple de mail généré :**

> Objet : Synthèse M+3 — [Nom du client]
>
> Bonjour [Nom],
>
> Suite à notre échange, voici la synthèse de votre situation d'assurance à M+3 :
>
> **Situation actuelle** :
> - Contrat Auto : ✅ Actif et à jour
> - Fiche client : ✅ Complète
>
> **Opportunités identifiées** :
> 1. **Habitation** : Vous n'avez pas d'assurance habitation détectée. Pour réaliser un devis personnalisé : [Devis Habitation](https://www.allianz.fr/forms/api/context/sharing/fast-quotes/household?codeAgence=H91358)
> 2. **Santé/Prévoyance** : Pour votre famille, une complémentaire santé pourrait être pertinente : [Devis Santé](https://www.allianz.fr/assurance-particulier/formulaire/devis-sante.html?codeAgence=H91358)
> 3. **Protection juridique** : En tant que salarié cadre, une protection juridique pourrait vous être utile : [Devis Protection Juridique](https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-juridique/mes-droits-au-quotidien/devis-contact.html?codeAgence=H91358)
>
> **Plan d'action** :
> - [Date] : Envoi devis habitation
> - [Date] : Relance si pas de retour
> - [Date] : RDV de suivi si intéressé
>
> N'hésitez pas si vous avez des questions.
>
> Cordialement,  
> [Votre nom]

#### Checklist qualité

**Rapport de validation** des fiches (client/contrat) : identification précise des champs et pièces manquants ou à compléter.

- Suivi du statut de complétude et conformité par objectif ou par typologie
- Document de contrôle pour validation finale

**À retenir** : Le choix et la production de l'une ou plusieurs de ces sorties dépendent de votre besoin. Le chatbot facilite la collecte et la structuration mais la validation finale (pour la conformité) reste de votre ressort, garantissant toujours traçabilité et respect des obligations (DDA/RGPD).

---

## 3. Ergonomie et interface utilisateur

### Boutons cliquables dans le chat

#### Principe

Le bot propose des **boutons interactifs** pour fluidifier l'interaction et réduire le temps de saisie.

#### Types de boutons

- **OUI/NON** pour questions binaires
- **Choix multiples** pour sélections (situation matrimoniale, type contrat, etc.)
- **Validation rapide** (✅ Valider, ❌ Rejeter, ⚠️ À modifier)

#### Avantages

- **Gain de temps** : Pas besoin de taper, clic direct
- **Réduction des erreurs de saisie** : Pas de fautes de frappe ou d'erreurs de format
- **Expérience utilisateur fluide** : Interaction rapide et intuitive

#### Exemples d'utilisation

**Phase préparation** : Validation des données extraites

> Bot : "J'ai détecté que le client est propriétaire. Confirmez-vous ?"  
> Boutons : [OUI] [NON] [À vérifier]

**Phase appel** : Mise à jour rapide des infos client

> Bot : "Le client confirme son numéro de téléphone ?"  
> Boutons : [OUI] [NON] [À modifier]

**Génération sorties** : Choix du type de sortie souhaité

> Bot : "Quel type de sortie souhaitez-vous générer ?"  
> Boutons : [DER] [Mail avec préconisations] [Checklist qualité] [Tout]

---

## 4. Annexes techniques (références pour le bot)

### Annexe A : Champs à vérifier

#### Personne physique — Champs nécessaires

| Champ | Description |
|-------|-------------|
| Numéro Lagon | Identifiant unique client |
| Date de création de la fiche | Date d'ouverture du dossier |
| Genre | M / F / Autre |
| Prénom | |
| Nom | |
| Adresse complète | Rue, code postal, ville |
| Mail | |
| Téléphone | |
| Situation matrimoniale | Célibataire / Marié(e) / Pacsé(e) / Divorcé(e) / Veuf(ve) |
| Enfants | Oui / Non (nombre si oui) |
| Situation professionnelle | Statut professionnel |

#### Personne morale — Champs nécessaires

| Champ | Description |
|-------|-------------|
| Numéro Lagon | Identifiant unique client |
| Date de création de la fiche | Date d'ouverture du dossier |
| Raison sociale | Nom de l'entreprise |
| Qui la gère | Personne physique (figure sous le nom de la personne morale) |
| Téléphone | |
| Mail | |
| SIRET | |
| NAF | Code activité |
| Date de création | Date de création de l'entreprise |

**Note** : Le bot utilise ces références pour identifier ce qui est présent/absent lors de l'analyse.

---

### Annexe B : Contrats possibles par type de client

Le bot IA doit connaître **tous les contrats possibles** selon le type de client pour identifier les opportunités commerciales et les trous logiques.

#### Personne physique (Particulier)

##### A) IARD (biens / responsabilité)

1. **Auto / Moto** (`auto_moto`)
   - Assurance auto (tiers, tiers+, tous risques)
   - Assurance moto
   - Assurance utilitaire

2. **MRH — Habitation** (`mrh_habitation`)
   - Locataire
   - Propriétaire occupant

3. **PNO — Propriétaire non occupant** (`pno`)
   - Propriétaire bailleur
   - Logement vacant

4. **GAV — Garantie Accidents de la Vie** (`gav`)
   - Accidents corporels hors auto
   - Invalidité, décès accidentel

5. **Protection juridique** (`protection_juridique`)
   - Litiges consommation, immobilier, travail
   - Conflits familiaux, voisinage
   - Risques numériques

6. **Objets de valeur** (`objets_valeur`)
   - Bijoux, collections
   - Œuvres d'art
   - Instruments de musique

7. **Assurance scolaire** (`assurance_scolaire`)
   - Responsabilité civile scolaire
   - Accidents, activités extra-scolaires

8. **Animaux (chien/chat)** (`assurance_animaux`)
   - Santé animale
   - Responsabilité civile animaux

9. **Nautisme** (`nautisme`)
   - Bateau, voilier
   - Jet-ski, scooter des mers

10. **Résidence secondaire** (`residence_secondaire`)
    - Logement secondaire
    - Résidence portuaire

11. **Équipements spécifiques** (`equipements_specifiques`)
    - Piscine
    - Cave à vins
    - Énergies renouvelables
    - Appareils électroniques

##### B) Assurance de la personne (santé / prévoyance / protection)

12. **Santé individuelle** (`sante_individuelle`)
    - Complémentaire santé
    - Surcomplémentaire santé
    - Tiers payant

13. **Prévoyance arrêt / invalidité** (`prevoyance_itt_ipt`)
    - ITT (Incapacité Temporaire Totale)
    - IPT (Incapacité Permanente Totale)
    - Décès accidentel

14. **Assurance emprunteur** (`assurance_emprunteur`)
    - Prêt immobilier
    - Prêt consommation

15. **Épargne retraite** (`epargne_retraite`)
    - PER (Plan Épargne Retraite)
    - Assurance vie

16. **Dépendance** (`dependance`)
    - Perte d'autonomie
    - Aide à domicile

---

#### Professionnel (TNS — Travailleur Non Salarié)

> **Note** : Pour un TNS, toujours raisonner en **2 paniers** : **personnel du dirigeant** + **activité professionnelle**.

##### A) IARD Pro (activité professionnelle)

1. **RC Pro générale** (`rc_pro_generale`)
   - Responsabilité civile professionnelle
   - Tous les TNS (artisans, commerçants, professions libérales)

2. **RC médicale / paramédicale** (`rc_medicale_paramedicale`)
   - Médecins, chirurgiens, dentistes
   - Kinésithérapeutes, infirmiers
   - Professions paramédicales

3. **Décennale** (`decennale`)
   - Artisans du bâtiment
   - Constructeurs, maîtres d'œuvre
   - Activités de construction

4. **Multirisque pro** (`multirisque_pro`)
   - Locaux professionnels
   - Contenu, outillage, stock
   - Matériel professionnel

5. **Perte d'exploitation pro** (`perte_exploitation_pro`)
   - Continuité d'activité
   - Charges fixes
   - Chiffre d'affaires

6. **Bris de machine pro** (`bris_machine_pro`)
   - Machines, équipements critiques
   - Outillage spécialisé

7. **Auto mission / flotte** (`auto_mission_flotte`)
   - Véhicules professionnels
   - Transport de marchandises
   - Flotte

8. **Cyber pro** (`cyber_pro`)
   - Protection données
   - Cyberattaques
   - E-réputation

9. **Protection juridique pro** (`protection_juridique_pro`)
   - Litiges professionnels
   - Défense prud'hommes
   - Conflits avec organismes sociaux

##### B) Personnel du dirigeant TNS

10. **Santé TNS** (`sante_tns`)
    - Complémentaire santé dirigeant
    - Pas de mutuelle employeur

11. **Prévoyance TNS** (`prevoyance_tns`)
    - ITT/IPT dirigeant
    - Décès
    - Protection revenus

12. **Retraite TNS** (`retraite_tns`)
    - Épargne retraite dirigeant
    - PER TNS

---

#### Entreprise (Personne morale)

##### A) IARD Entreprise (pour l'entreprise)

1. **RC exploitation / produits / prestations** (`rc_exploitation_produits_prestations`)
   - Responsabilité civile entreprise
   - RC produits
   - RC prestations

2. **Multirisque entreprise** (`multirisque_entreprise`)
   - Bâtiments, locaux
   - Contenu, matériel, stock
   - Informatique

3. **Perte d'exploitation** (`perte_exploitation_entreprise`)
   - Continuité d'activité
   - Charges fixes
   - Chiffre d'affaires

4. **Bris de machine entreprise** (`bris_machine_entreprise`)
   - Machines, équipements critiques
   - Production, informatique

5. **Cyber entreprise** (`cyber_entreprise`)
   - Protection données
   - Cyberattaques
   - E-réputation
   - E-commerce

6. **D&O — Dirigeants et mandataires** (`do_dirigeants`)
   - Protection dirigeants
   - Administrateurs
   - Mandataires sociaux

7. **RC transporteur** (`rc_transporteur`)
   - Transport de marchandises
   - Logistique, livraisons

8. **TRC / DO — Travaux et dommages ouvrage** (`trc_do_entreprise`)
   - Travaux de construction
   - Dommages ouvrage
   - Maîtres d'ouvrage

9. **Flotte / auto mission** (`flotte_auto_mission`)
   - Véhicules professionnels
   - Flotte entreprise

10. **Protection juridique entreprise** (`protection_juridique_entreprise`)
    - Litiges entreprise
    - Défense prud'hommes
    - Conflits commerciaux

11. **Assurance-crédit / Poste client (Allianz Trade)** (`assurance_credit_poste_client`)
    - Protection contre les impayés clients
    - Sécurisation du cash-flow
    - Entreprises en B2B
    - Cautions, garanties financières
    - Recouvrement de créances
    - **Référence** : [Allianz Trade](https://www.allianz-trade.fr/a-propos.html)

##### B) Salariés (collectif)

12. **Santé collective** (`sante_collective`)
    - Mutuelle entreprise
    - Obligation employeur (50% minimum)
    - Tiers payant

13. **Prévoyance collective** (`prevoyance_collective`)
    - ITT/IPT salariés
    - Décès
    - Conventions collectives

14. **Épargne salariale** (`epargne_salariale`)
    - PEE (Plan Épargne Entreprise)
    - Intéressement, participation

##### C) Dirigeant (dans l'entreprise)

15. **Dirigeant TNS : santé + prévoyance + retraite** (`dirigeant_tns_sante_prevoyance`)
    - Santé dirigeant
    - Prévoyance dirigeant
    - Retraite dirigeant

16. **Assurance clé** (`assurance_cle`)
    - Personne clé de l'entreprise
    - Associés essentiels
    - Talents critiques

---

#### Utilisation par le bot IA

Le bot IA utilise ces listes pour :

1. **Détecter les contrats présents** : identifier ce que le client a déjà "chez nous"
2. **Identifier les trous logiques** : repérer ce qui manque selon le profil client
3. **Proposer des axes prioritaires** : recommander les contrats les plus pertinents
4. **Valider la cohérence** : vérifier que les contrats détectés correspondent au type de client

**Exemple d'analyse :**

> Client : Personne physique, 35 ans, marié, 2 enfants, salarié cadre  
> Contrats détectés chez nous : Auto uniquement  
> Trous logiques identifiés :
> - Habitation (MRH) — manquant
> - Santé individuelle — manquant
> - Prévoyance ITT/IPT — manquant
> - Protection juridique — manquant

---

### Annexe C : Tarificateurs en ligne

Le bot IA peut **proposer automatiquement** des liens vers les tarificateurs en ligne Allianz selon les opportunités identifiées lors du M+3.

**Fonctionnement** :
- Lorsque le bot identifie un **trou logique** ou une **opportunité commerciale**, il propose le lien du tarificateur correspondant
- Le lien inclut automatiquement le **code agence H91358** pour attribution
- Vous pouvez copier-coller le lien directement dans un mail/SMS au client

**Liste des tarificateurs disponibles** :

| Contrat | Lien tarificateur |
|---------|-------------------|
| **Devis Auto** | `https://www.allianz.fr/forms/api/context/sharing/quotes/auto?codeAgence=H91358` |
| **Devis Habitation** | `https://www.allianz.fr/forms/api/context/sharing/fast-quotes/household?codeAgence=H91358` |
| **Devis Santé** | `https://www.allianz.fr/assurance-particulier/formulaire/devis-sante.html?codeAgence=H91358` |
| **Devis Emprunteur** | `https://www.allianz.fr/forms/api/context/sharing/long-quotes/borrower?codeAgence=H91358` |
| **Devis Pro** | `https://www.allianz.fr/forms/api/context/sharing/fast-quotes/multiaccess-pro?codeAgence=H91358` |
| **Devis Scolaire** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-scolaire/devis-contact.html/?codeAgence=H91358` |
| **Devis GAV** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/garantie-des-accidents-de-la-vie-privee/devis-contact.html/?codeAgence=H91358` |
| **Nouvelles mobilités** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/nouvelles-mobilites/devis-contact.html/?codeAgence=H91358` |
| **Moto et scooter** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-2-roues/devis-contact.html/?codeAgence=H91358` |
| **Malussé résilié** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-auto/malusse-resilie/devis-contact.html/?codeAgence=H91358` |
| **Camping-car** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/camping-car/devis-contact.html/?codeAgence=H91358` |
| **Bateau** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-loisirs/bateau.html/?codeAgence=H91358` |
| **Chien chat** | `https://www.allianz.fr/assurance-particulier/sante-prevoyance/assurance-sante/assurance-chiens-chats/devis-contact.html/?codeAgence=H91358` |
| **Voiture sans permis** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/assurance-voiture-sans-permis/devis-contact.html/?codeAgence=H91358` |
| **Quad** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/assurance-quad/devis-contact.html/?codeAgence=H91358` |
| **Motoculteur** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/assurance-motoculteur/devis-contact.html/?codeAgence=H91358` |
| **Voiture de collection** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-autres-vehicules/assurance-voiture-collection/devis-contact.html/?codeAgence=H91358` |
| **Énergies renouvelables** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-equipements/installations-energies-renouvelables/devis-contact.html/?codeAgence=H91358` |
| **Piscine** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-equipements/piscine/devis-contact.html/?codeAgence=H91358` |
| **Cave à vins** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-equipements/cave-a-vins/devis-contact.html/?codeAgence=H91358` |
| **Appareils électroniques** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-equipements/appareils-electroniques/devis-contact.html/?codeAgence=H91358` |
| **Chasse** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-loisirs/chasse.html/?codeAgence=H91358` |
| **Protection Juridique** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-juridique/mes-droits-au-quotidien/devis-contact.html/?codeAgence=H91358` |
| **Vélo (deux roues)** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-2-roues/velo/devis-contact.html/?codeAgence=H91358` |
| **Appartement en location** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation/appartement-en-location/devis-contact.html/?codeAgence=H91358` |
| **Maison en location** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation/maison-en-location/devis-contact.html/?codeAgence=H91358` |
| **Télésurveillance** | `https://www.allianz.fr/assurance-particulier/habitation-biens/assurance-habitation/telesurveillance/devis-contact.html/?codeAgence=H91358` |
| **Véhicule pro** | `https://www.allianz.fr/assurance-particulier/vehicules/assurance-auto/vehicule-professionnel/devis-contact.html/?codeAgence=H91358` |
| **Instrument de musique** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-loisirs/instrument-de-musique/devis-contact.html/?codeAgence=H91358` |
| **Matériel de camping** | `https://www.allianz.fr/assurance-particulier/famille-loisirs/protection-de-la-famille/assurance-loisirs/materiel-de-camping-sport/devis-contact.html/?codeAgence=H91358` |
| **Formulaire contact générique** | `https://www.allianz.fr/assurance-particulier/infos-contact/rendez-vous-avec-mon-conseiller.html#/rendezvous/?codeAgence=H91358` |

**Exemple d'utilisation par le bot :**

> **Opportunité identifiée** : Client sans assurance habitation  
> **Proposition du bot** :  
> "Pour réaliser un devis habitation personnalisé, vous pouvez utiliser notre tarificateur en ligne :  
> [Devis Habitation](https://www.allianz.fr/forms/api/context/sharing/fast-quotes/household?codeAgence=H91358)  
> Ce lien vous permet d'obtenir une estimation en quelques minutes."

**Avantage** : Vous n'avez plus besoin de chercher les liens, le bot les propose automatiquement selon les opportunités détectées.

---

### Annexe D : Détails techniques (optionnel, pour dev)

#### Apport de Firebase ML dans le workflow M+3

Firebase ML (ML Kit) peut **automatiser et améliorer** plusieurs étapes du workflow M+3 :

##### 1. Extraction de données depuis les fiches Lagon

**Text Recognition (OCR)** :
- Extraction automatique du texte depuis les fiches copiées-collées (format texte brut ou images)
- Reconnaissance de la structure (tableaux, champs, valeurs)
- Détection des zones de données (adresse, téléphone, SIRET, etc.)

**Avantage** : réduction du temps de saisie manuelle, moins d'erreurs de transcription.

##### 2. Classification automatique

**Personne physique vs Personne morale** :
- Analyse des champs présents (SIRET, raison sociale, prénom/nom) pour déterminer automatiquement le type
- Validation croisée avec les patterns détectés (ex. : présence de "SARL", "SAS" → personne morale)

**Nature des contrats** :
- Classification automatique des contrats depuis les libellés détectés (Auto, MRH, Habitation, Santé, etc.)
- Apprentissage progressif des patterns spécifiques à l'agence

**Avantage** : détection immédiate, moins de validation manuelle nécessaire.

##### 3. Validation intelligente des données

**Format et cohérence** :
- Validation automatique des formats (SIRET 14 chiffres, téléphone français, email valide)
- Vérification de cohérence logique (ex. : code postal correspond à la ville, SIRET valide via API)
- Détection d'anomalies (dates incohérentes, valeurs aberrantes)

**Avantage** : feedback immédiat sur les erreurs, correction avant validation finale.

##### 4. Suggestions intelligentes

**Auto-complétion contextuelle** :
- Suggestions basées sur les données historiques (ex. : adresses fréquentes, formats de téléphone locaux)
- Prédiction de valeurs probables selon le contexte (ex. : code postal → ville probable)

**Avantage** : gain de temps, réduction des erreurs de saisie.

##### 5. Détection d'anomalies et alertes

**Qualité des données** :
- Identification automatique des champs critiques manquants selon le type de client
- Alertes sur les incohérences détectées (ex. : contrat Auto sans carte grise mentionnée)
- Scoring de complétude du dossier

**Avantage** : priorisation automatique des actions, focus sur les dossiers à compléter.

##### 6. Apprentissage continu

**AutoML** :
- Entraînement de modèles personnalisés sur les données historiques de l'agence
- Amélioration progressive de la détection (types de contrats, patterns spécifiques)
- Adaptation aux habitudes de saisie des CDC

**Avantage** : le système s'améliore avec l'usage, meilleure précision au fil du temps.

#### Architecture recommandée

```
Fiches Lagon (copier-coller)
    ↓
Firebase ML Text Recognition (extraction)
    ↓
Classification (Personne physique/morale, Type contrat)
    ↓
Validation intelligente (formats, cohérence)
    ↓
Feedback visuel (✅ OK / ❌ KO)
    ↓
Questions ciblées si manquants
    ↓
Validation CDC → Firestore
```

**Intégration technique** :
- **ML Kit Text Recognition** : extraction depuis texte/images
- **Custom Models (AutoML)** : classification personnalisée
- **Firestore** : stockage des données validées + historique pour apprentissage
- **Cloud Functions** : traitement asynchrone des validations complexes
