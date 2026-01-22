# Tests d'intégration E2E - Assistant Antécédents Auto

## Cas de test à valider manuellement

### Cas 1 : PM - 1er véhicule simple
1. Démarrer le wizard
2. Sélectionner "Personne morale"
3. Sélectionner "Privé"
4. Sélectionner "1er véhicule"
5. Sélectionner "Non" pour conducteur désigné
6. Sélectionner "Non" pour RI
7. Vérifier que le CRM calculé est 0.70
8. Vérifier que la règle SIN_01 est appliquée (36 mois)
9. Générer le journal
10. Vérifier que le journal contient toutes les sections

### Cas 2 : PM - Ajout 2e véhicule (moyenne parc)
1. Démarrer le wizard
2. Sélectionner "Personne morale"
3. Sélectionner "Tous déplacements"
4. Sélectionner "Ajout véhicule"
5. Saisir nb véhicules actuels : 1
6. Sélectionner "Non" pour conducteur désigné
7. Sélectionner "Oui" pour RI
8. Saisir les CRM des véhicules existants (ex: 0.68, 0.82)
9. Vérifier que le CRM calculé est la moyenne (0.75)
10. Vérifier que la règle SIN_02 est appliquée
11. Générer le journal

### Cas 3 : VTC - Personne physique avec blocage
1. Démarrer le wizard
2. Sélectionner "Personne physique"
3. Sélectionner "VTC"
4. Sélectionner "1er véhicule"
5. Sélectionner "Oui" pour RI
6. Saisir CRM RI : 1.15 (malus)
7. Vérifier que le blocage "SOUSCRIPTION INTERDITE" apparaît
8. Vérifier que le journal ne peut pas être généré

### Cas 4 : Gérant - Blocage 3e véhicule
1. Démarrer le wizard
2. Sélectionner "Personne morale"
3. Sélectionner "Privé"
4. Sélectionner "Ajout véhicule"
5. Sélectionner "Oui" pour conducteur désigné
6. Sélectionner "Gérant"
7. Saisir nb véhicules gérant : 3
8. Vérifier que le blocage "gérant max 2 véhicules" apparaît

### Cas 5 : Navigation breadcrumb
1. Compléter les 3 premières étapes
2. Cliquer sur une étape dans le breadcrumb
3. Vérifier que l'état est restauré
4. Modifier une réponse
5. Vérifier que les étapes suivantes sont réinitialisées

### Cas 6 : Export journal
1. Générer un journal complet
2. Cliquer sur "Copier tout"
3. Vérifier que le texte est dans le presse-papiers
4. Cliquer sur "Copier CRM seul"
5. Vérifier que seule la section CRM est copiée
6. Cliquer sur "Format email"
7. Vérifier que l'email est formaté correctement

### Cas 7 : Chat IA
1. Générer un journal
2. Cliquer sur "Expliquer" sur la section CRM
3. Poser une question : "Pourquoi le CRM est de 0.70 ?"
4. Vérifier que l'IA répond avec une explication
5. Poser une autre question sur les sinistres
6. Vérifier que le contexte est maintenu

## Tests de validation temps réel

### Validation RI
- Vérifier que l'alerte apparaît si RI > 3 mois
- Vérifier que l'alerte apparaît si RI absent

### Validation sinistres
- Vérifier que l'alerte apparaît si sinistre hors période
- Vérifier que le blocage apparaît si VTC + sinistre responsable

### Validation interruption
- Vérifier que l'alerte apparaît si interruption >36 mois
- Vérifier que la reprise bonus est possible si interruption <36 mois
