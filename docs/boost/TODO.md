# TODO — Implémentation Boost

Référence : [BOOST.md](./BOOST.md)

---

## 1. Données et backend

- [x] Créer le type `Boost` dans `types/boost.ts` (id, userId, type, clientName, stars, remuneration, date, createdAt)
- [x] Créer la collection Firestore `boosts` avec les règles de sécurité appropriées
- [x] Créer `lib/firebase/boosts.ts` : `createBoost`, `getBoostsByMonth`, `getBoostsByUserAndMonth`, `getAllBoostsForAdmin`
- [x] Index Firestore pour les requêtes par mois + userId + type

---

## 2. Page Boost collaborateur (`/commun/boost`)

- [x] Créer la route `app/commun/boost/page.tsx`
- [x] Section 1.1 : CTA "Boost" qui ouvre une modale
- [x] Section 1.2 : Modale de déclaration
  - [x] Boutons cliquables par type (Google pour l'instant)
  - [x] Image `public/boost/google.png` pour le bouton Google
  - [x] Formulaire : nom client, select 1–5 étoiles, date auto, rémunération 5 € affichée
  - [x] Validation et enregistrement en Firestore
- [x] Section 1.3 : Liste des boosts du mois de l'utilisateur connecté (tableau : date, type, client, étoiles, rémunération)
- [x] Section 2 : Classement boost par boost de tous les collaborateurs (leaderboard par type)

---

## 3. Navigation collaborateur

- [x] Ajouter le bouton "Boost" dans `CommercialSidebar` (menuItems)
- [x] Ajouter le bouton "Boost" dans les sidebars Santé Individuelle, Santé Collective
- [x] Gestionnaire Sinistre : utilise CommercialSidebar (avec Boost) via commun layout
- [x] Ajouter le bouton "Boost" dans `NavigationItems` et `MobileMenu` pour chaque variant
- [x] Mise à jour `app/commun/layout.tsx`, `app/dashboard/layout.tsx`, layouts Santé

---

## 4. Admin — Sidebar et Dashboard

- [x] Ajouter l'item "Boost" dans `AdminSidebar` (après Sinistre, avant Process)
  - [x] Icône : Zap
  - [x] Lien : `/admin/boost`
- [x] Ajouter la section Boost sur le Dashboard admin (`app/admin/page.tsx`)
  - [x] Nouvelle carte sous Sinistre
  - [x] KPIs : nb boosts, rémunération totale, nb collaborateurs concernés
  - [x] MonthSelector pour filtrer le mois
  - [x] Bouton "Voir le détail complet" → `/admin/boost`

---

## 5. Page admin Boost (`/admin/boost`)

- [x] Créer `app/admin/boost/page.tsx`
- [x] Liste exhaustive des boosts (tableau : date, collaborateur, type, client, étoiles, rémunération)
- [x] Filtres : mois, collaborateur, type de boost
- [x] Totaux par collaborateur (nb boosts + rémunération)
- [x] Classement / leaderboard par type de boost
- [ ] (Optionnel) Export CSV/Excel

---

## 6. Contrôles d'accès

- [x] `/commun/boost` : accessible à tous les rôles authentifiés (CDC, Santé Indiv, Santé Coll, Gestionnaire Sinistre, Admin)
- [x] `/admin/boost` : réservé aux ADMINISTRATEUR

---

## 7. Reste à faire

### Déploiement
- [x] Exécuter `firebase deploy` pour déployer les règles Firestore et les index

### Optionnel (v1)
- [ ] Export CSV/Excel sur la page admin Boost (pour paie / reporting)

### Extensions (hors scope v1)
- [ ] Nouveaux types de boosts (boutons additionnels dans la modale)
- [ ] Grille de rémunération configurable par type
- [ ] Workflow de validation admin
