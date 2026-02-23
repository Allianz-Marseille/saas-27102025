# 06 – Risques Pro & RC : CID-PIV et CRAC

Cette fiche couvre les conventions spécifiques aux **entreprises**, au **vol** et au secteur de la **construction**.

**Sommaire**
- 1. CID-PIV (pertes indirectes et vol)
- 2. CRAC (assurance construction)
- 3. Instructions pour Sinistro (IA) et synthèse vigilance

---

## 1. CID-PIV (Pertes Indirectes et Vol)

- **Définition :** Convention d’**Indemnisation Directe** pour les **Pertes Indirectes** et le **Vol**.
- **Usage :** S’applique principalement dans un **contexte professionnel** pour accélérer le règlement des **préjudices financiers** (pertes d’exploitation, perte de chiffre d’affaires) et des **vols** de marchandises ou de matériels.
- **Assureur gestionnaire** et règles d’indemnisation directe : détaillés dans les conventions officielles (documents dans `../pdf-sinistro/`).

**Mots-clés pour extraction :** CID-PIV, pertes indirectes, pertes d’exploitation, vol, professionnel.

---

## 2. CRAC (Assurance Construction)

- **Définition :** Convention de **Règlement de l’Assurance Construction**.
- **Cible :** Organise les recours entre les assureurs **Dommages-Ouvrage (DO)** et les assureurs de **Responsabilité Civile Décennale** des constructeurs.
- **Utilité pour Sinistro :** Le bot doit **identifier si le sinistre survient après réception des travaux** pour orienter vers la **garantie décennale** et la convention CRAC (délai de prescription décennale, responsabilité des constructeurs).

**Mots-clés pour extraction :** CRAC, DO, dommages-ouvrage, RC décennale, construction, réception des travaux.

---

## 3. Instructions pour Sinistro (IA) et synthèse vigilance

Pour les sinistres **professionnels** et **construction**, Sinistro doit adopter une **posture de vigilance accrue** :

1. **Alerte Décennale :** Pour tout **dommage bâtiment / construction**, vérifier la **date d’achèvement ou de réception des travaux** pour l’application de la **CRAC** et de la garantie décennale.

**Synthèse des instructions pour l’Agent IA (fiches 05 et 06)**  
Pour les dossiers **corporel** (fiche 05) et **pro / construction** (fiche 06), Sinistro doit :

- **Alerte AIPP** (fiche 05) : Pour tout accident auto avec blessé, demander si une expertise médicale est prévue pour évaluer l’AIPP (seuil IRCA vs PAOS).
- **Alerte Décennale** (fiche 06) : Pour tout dommage bâtiment pro, vérifier la date d’achèvement des travaux pour l’application de la CRAC.
- **Priorité victime** (fiche 05) : Rappeler que les délais de provision (PAOS) sont prioritaires sur la discussion des responsabilités finales.
