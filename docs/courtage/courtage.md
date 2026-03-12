# Gestion Courtage

## Objectif

Développer un système CRUD complet, accessible quel que soit le rôle, afin de gérer les compagnies de courtage avec lesquelles nous avons des accords.

## Colonnes retenues

Parmi les données disponibles, seules les colonnes suivantes sont prises en compte :

- Compagnie
- Identifiant
- Mot de passe
- Lien internet

Toutes les autres colonnes de la source initiale sont ignorées pour cette V1.

## Structure attendue (une ligne = une compagnie)

Chaque entrée courtage contient :

- `compagnie`
- `identifiant`
- `password`
- `internet`
- `dateModification`
- `qui`

## Règles fonctionnelles

- Une compagnie = une ligne.
- Actions CRUD disponibles : créer, lire, modifier, supprimer.
- Lien d'accès au module Courtage disponible depuis toutes les sidebars de l'application.
- Icône "oeil" pour accéder aux informations détaillées.
- Les mots de passe sont stockés en clair pour ce projet (décision métier validée).
- À chaque changement, enregistrer :
  - qui a effectué la modification ;
  - la date de la modification.
- Les informations de traçabilité sont accessibles uniquement via l'icône "oeil", avec affichage dans une modale.

## Règles sur `dateModification` et `qui`

- Import initial :
  - `dateModification` n'est pas renseignée (vide / `null`) ;
  - `qui` n'est pas renseigné tant qu'il n'y a pas de modification.
- Lors d'une création ou modification ultérieure :
  - `dateModification` est renseignée automatiquement au format `YYYY-MM-DD-HH-MM` ;
  - `qui` est renseigné automatiquement avec la partie avant `@` de l'email de l'utilisateur connecté.

Exemple :

- Email connecté : `jeanmichel@allianz-nogaro.fr`
- Valeur stockée dans `qui` : `jeanmichel`

## Contraintes d'implémentation validées

- Audit calculé uniquement côté serveur :
  - `qui` et `dateModification` ne viennent jamais du client ;
  - les valeurs sont écrites automatiquement par le backend.
- Gestion des droits :
  - fonctionnalité visible pour tous les rôles ;
  - permissions d'écriture (création, modification, suppression) pilotées par une matrice RBAC.
- Gestion de la date :
  - stockage recommandé en `timestamp` (ou ISO complet) ;
  - affichage UI au format `YYYY-MM-DD-HH-MM`.
- Import des données initiales :
  - prévoir une normalisation (lignes incomplètes, valeurs ambiguës, doublons) ;
  - conserver un `id` technique stable par enregistrement.
- Règle sur les secrets :
  - exception validée : `password` conservé en clair dans cette implémentation.

## Données source communiquées (brut)

```text
Compagnie	Identifiant	mot de passe 	internet	date de modification	qui	@sinistre	inspecteur
Add Value	jm.nogaro@allianz.fr	ALLIANZadd2025@	https://courtage.add-value.fr/	19/12/2025	JM		guillaume.laude@add-value.fr
Allianz Travel	Julien.boetti@allianz.fr	H91358h92083az@	https://allianztravel-agentmax.fr/onePortalIUI/#/	09/01/2026
Apivia	jean_michel,nogaro@C361D	H91358@H92083	D	09/09/2025
April	H91358AZ	H91358az@@nb		21/10/2025	JM
Assurimat	h913581@agents.allianz.fr	H91358	https://www.assurimmat.fr/v3/home
	AC07021584	a9s2y7a3	                                                	02/10/2025	TM	sinistres@assurmaxpro.com
Assurmax New	jm.nogaro@allianz.fr	H91358az@	Extranet | Assurmax	12/12/2024	JM
Carene	H91358	eDdB65WM		24/02/2025
Entoria	104248  /  JNOGARO	H91358AZh92083@	https://espacecourtier.entoria.fr/login				sboyer@entoria,fr / 0648202608
Fma	8423	H91358h92083@
Mondial Assistance	203160	VE203160	Mondial Assistance Pro
Mutuelle Du Soleill	nogaro.jean-michel	H91358AZ 	Espace Courtier ⋅ Mutuelles du soleil
Netvox	NETX9590_1372	Corniche13007!	Courtier en assurance : Login Netvox	20/08/2024	HS
Plus Simple	corniche13007@allianz.fr	Hh91358AZ	https://app.simplifieurs.pro/auth/login?redirect_uri=%2Fcatalog%2Faprilentrepriseest-opt11-multi	24/02/2025			SARRE J marie/ 0757594582
Progeas	91892	gdfd886	Progeas		ajout par TM
Repam	jm.nogaro@allianz.fr	H91358h92083@	Espace courtier	08/07/2025
SIDEXA // www.sidexa.fr	N°intervenant: FR0295014A	N°identifiant: hme01	BOETTIJ@agents.allianz.fr	Mdp: H91358h92083@	tel: 01.41.13.31.31
Sinistre				30/04/2025
Solly azar	corniche13007@allianz.fr	H91358az@	Solly Azar Pro	04/11/2025
SOS immeuble 	jm.nogaro@allianz.fr	H91358az@	https://sos-assurance-immeubles-tarifs.fr/SOS_Assurance_Immeubles	19/01/2026	JM
Stoik	jm.nogaro@allianz.fr	H91358h92083@	Stoïk · Connexion (stoik.io)
Tetris	corniche13007@allianz.fr	H91358neiges@	Tetris Assurance
Uniced	133184 / futur h913581@agents.allianz.fr	H91358AZ	https://espaces.uniced.fr/uniced/conseiller/menu.php	07/06/2023	KC
Unim	h913581@agents.allianz.fr	H91358h92083@	Auth Assurances Médicales	04/12/2025	KC
Zephir	I15997	H91358az@@@	https://www.zephiralize.fr/	03/12/2025	JP
Declarassur	340234962 / infodsn	|AZ-dsn-2025|	Declarassur Extranet V12.6.0	16/10/2025	KC
Maxance	corniche13007@allianz.fr	H91358H92083@	https://extranet.maxance.com/Maxance/Login	05/09/2025	TM
Jeresilie.com	jm.nogaro@allianz.fr	H91358AZ		23/09/2025
Yousign	"corniche13007@allianz.fr"	H91358AZ		09/02/2026
Slack	agenceallianznogaro			24/02/2025
Infogreffe	jm.nogaro@allianz.fr	ALLIANZh91358@		16/04/2025
Allianz Travel	corniche13007@allianz.fr	@H91358az	AgentMax	21/01/2026	EN
Cba Assurances	7021584	tbfy4f65 	https://extranet.cba-groupe.fr/ 	28/08/2025	GC
Plussimlple / Aksam	rouviere13009@allianz,fr	AKSAMallianz2025	Simplifieurs	29/04/2025	JM
April Connexion Julien	BOETTJU	H91358h92083@		16/12/2025
```

