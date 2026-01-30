# TODO — Implémentation Boost

Référence : [BOOST.md](./BOOST.md)

---

## 1. Données et backend

- [ ] Créer le type `Boost` dans `types/` (id, userId, type, clientName, stars, remuneration, date, createdAt)
- [ ] Créer la collection Firestore `boosts` avec les règles de sécurité appropriées
- [ ] Créer `lib/firebase/boosts.ts` : `createBoost`, `getBoostsByMonth`, `getBoostsByUserAndMonth`, `getAllBoostsForAdmin`
- [ ] Index Firestore pour les requêtes par mois + userId + type

---

## 2. Page Boost collaborateur (`/boost`)

- [ ] Créer la route `app/boost/page.tsx` (ou sous layout commun si besoin)
- [ ] Section 1.1 : CTA "Boost" qui ouvre une modale
- [ ] Section 1.2 : Modale de déclaration
  - [ ] Boutons cliquables par type (Google pour l'instant)
  - [ ] Image `public/boost/google.png` pour le bouton Google
  - [ ] Formulaire : nom client, select 1–5 étoiles, date auto, rémunération 5 € affichée
  - [ ] Validation et enregistrement en Firestore
- [ ] Section 1.3 : Liste des boosts du mois de l'utilisateur connecté (tableau : date, type, client, étoiles, rémunération)
- [ ] Section 2 : Classement boost par boost de tous les collaborateurs (leaderboard par type)

---

## 3. Navigation collaborateur

- [ ] Ajouter le bouton "Boost" dans `CommercialSidebar` (menuItems)
- [ ] Ajouter le bouton "Boost" dans les sidebars Santé Individuelle, Santé Collective, Sinistre
- [ ] Ajouter le bouton "Boost" dans `NavigationItems` et `MobileMenu` pour chaque variant
- [ ] Mettre à jour `app/commun/layout.tsx` et layouts dashboard si nécessaire

---

## 4. Admin — Sidebar et Dashboard

- [ ] Ajouter l'item "Boost" dans `AdminSidebar` (après Sinistre, avant Process)
  - [ ] Icône : `Zap` ou `TrendingUp` ou `Star`
  - [ ] Lien : `/admin/boost`
- [ ] Ajouter la section Boost sur le Dashboard admin (`app/admin/page.tsx`)
  - [ ] Nouvelle carte sous Sinistre
  - [ ] KPIs : nb boosts, rémunération totale, nb collaborateurs concernés
  - [ ] MonthSelector pour filtrer le mois
  - [ ] Bouton "Voir le détail complet" → `/admin/boost`

---

## 5. Page admin Boost (`/admin/boost`)

- [ ] Créer `app/admin/boost/page.tsx`
- [ ] Liste exhaustive des boosts (tableau : date, collaborateur, type, client, étoiles, rémunération)
- [ ] Filtres : mois, collaborateur, type de boost
- [ ] Totaux par collaborateur (nb boosts + rémunération)
- [ ] Classement / leaderboard par type de boost
- [ ] (Optionnel) Export CSV/Excel

---

## 6. Contrôles d'accès

- [ ] RouteGuard / protection de `/boost` : tous les rôles sauf ? (à définir)
- [ ] Protection `/admin/boost` : réservé aux ADMINISTRATEUR

---

## 7. Extensions (hors scope v1)

- [ ] Nouveaux types de boosts (boutons additionnels dans la modale)
- [ ] Grille de rémunération configurable par type
- [ ] Export CSV/Excel pour paie
- [ ] Workflow de validation admin
