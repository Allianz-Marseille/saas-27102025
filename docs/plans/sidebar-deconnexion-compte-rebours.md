# Plan : Sidebar déconnexion auto, cadran et UX (révisé)

## Vue d’ensemble

Déconnexion automatique à 5 min, cadran de compte à rebours, footer de sidebar **unifié** (composant partagé pour Admin et Commerciaux), toggles centrés, suppression de la cloche, bouton déconnexion avec pulse. Le pulse et le même design de footer s’appliquent à **tous les rôles** (admin, commerciaux, santé via commun) via ce composant unique.

---

## 1. Déconnexion automatique à 5 minutes

- Dans `lib/hooks/use-auto-logout.ts` : message toast dynamique (utiliser `timeoutMinutes` au lieu de "10 minutes" en dur).
- Remplacer `timeoutMinutes: 10` par `timeoutMinutes: 5` dans tous les layouts qui appellent `useAutoLogout` :
  - `app/admin/layout.tsx`
  - `app/commun/layout.tsx`
  - `app/dashboard/layout.tsx`
  - `app/sante-individuelle/layout.tsx`
  - `app/sante-collective/layout.tsx`

---

## 2. Exposition du temps restant pour le cadran

- Modifier `lib/hooks/use-auto-logout.ts` pour retourner **`secondsRemaining`** (nombre de secondes jusqu’à la déconnexion), mis à jour environ chaque seconde, synchronisé avec les timers existants (reset à chaque activité).
  - Ref pour l’horodatage de fin de session ; à chaque `resetTimer` mettre à jour cette ref ; `setInterval` 1 s pour dériver `secondsRemaining` et le mettre en state.
  - Nettoyer timer et intervalle au démontage.

---

## 3. Composant CountdownDial (cadran moderne)

- Créer `components/dashboard/countdown-dial.tsx` :
  - Props : `secondsRemaining: number`, `totalSeconds: number` (ex. 5 * 60).
  - Affichage : cadran circulaire (anneau SVG avec `stroke-dasharray` / `stroke-dashoffset`), temps restant au centre en `mm:ss`.
  - Style sobre, lisible en clair et sombre.

---

## 4. Composant footer unifié (Admin + Commerciaux + Santé commun)

- Créer un composant partagé **`SidebarSessionFooter`** (ex. `components/dashboard/sidebar-session-footer.tsx`) qui reçoit :
  - `countdownSeconds?: number`
  - `userData` (avatar, nom, badge rôle)
  - `onLogout: () => void`
  - `variant: 'admin' | 'commercial' | 'health'` (couleurs / libellé badge)
  - `isCollapsed?: boolean`
- Rendu interne (ordre de haut en bas) :
  1. **Cadran** compte à rebours (si `countdownSeconds` défini)
  2. **Toggles** clair/sombre — **centrés** (`flex justify-center`)
  3. **Qui est connecté** (avatar + nom type "emma" + badge ADMIN/COMMERCIAL/SANTÉ)
  4. **Bouton Se déconnecter** avec **pulse léger** (animation discrète)

Ainsi tout est **unifié et synchronisé** : une seule source de vérité pour le footer (admin, commerciaux, et santé dans commun).

---

## 5. Utilisation du footer unifié dans les sidebars

- **Admin** : dans `components/admin/admin-sidebar.tsx`, remplacer tout le bloc footer actuel par `<SidebarSessionFooter countdownSeconds={…} userData={…} onLogout={…} variant="admin" isCollapsed={…} />`. Supprimer la cloche n’y figure pas (déjà absente).
- **Commerciaux** : dans `components/dashboard/commercial-sidebar.tsx`, **supprimer** `NotificationCenter` (cloche) et remplacer le footer par `<SidebarSessionFooter … variant="commercial" />`.
- **Santé (commun)** : dans `app/commun/layout.tsx`, pour la sidebar santé (inline), remplacer le bloc "User info et actions" par `<SidebarSessionFooter … variant="health" />` en lui passant `countdownSeconds` issu de `useAutoLogout` et le même ordre (cadran → toggles centrés → qui est connecté → déconnexion pulse).

On **ne modifie pas** les layouts dédiés `app/sante-individuelle/layout.tsx` et `app/sante-collective/layout.tsx` : ils gardent leur footer actuel (pas de cadran/toggles unifiés dans ce plan).

---

## 6. Passage de `secondsRemaining` depuis les layouts

- `app/admin/layout.tsx` : `const { secondsRemaining } = useAutoLogout({…});` puis passer `countdownSeconds={secondsRemaining}` à `AdminSidebar`.
- `app/dashboard/layout.tsx` : idem, passer `countdownSeconds={secondsRemaining}` à `CommercialSidebar`.
- `app/commun/layout.tsx` : récupérer `secondsRemaining` et le passer à `AdminSidebar`, `CommercialSidebar`, et au `SidebarSessionFooter` de la sidebar santé (inline).

---

## 7. Suppression de la cloche (NotificationCenter)

- `components/dashboard/commercial-sidebar.tsx` : retirer import et rendu de `NotificationCenter`.
- `components/navigation/navigation-items.tsx` : retirer import et rendu de `NotificationCenter`.
- `components/navigation/responsive-header.tsx` : retirer import et rendu de `NotificationCenter`.

Le composant `NotificationCenter` reste dans le projet pour un usage futur ; seul son affichage est supprimé.

---

## 8. Bouton « Se déconnecter » avec pulse léger

- Le pulse est **intégré dans `SidebarSessionFooter`** (une seule implémentation). Tous les rôles (admin, commerciaux, santé via commun) en bénéficient.
- Animation : classe Tailwind `animate-pulse` ou animation CSS custom légère (opacité ou scale, boucle 1,5–2 s).

---

## Résumé des fichiers

| Fichier | Action |
|--------|--------|
| `lib/hooks/use-auto-logout.ts` | Retourner `secondsRemaining`, toast dynamique, 5 min dans les appels |
| `components/dashboard/countdown-dial.tsx` | **Nouveau** : cadran circulaire |
| `components/dashboard/sidebar-session-footer.tsx` | **Nouveau** : footer unifié (cadran + toggles centrés + user + déconnexion pulse) |
| `components/admin/admin-sidebar.tsx` | Utiliser `SidebarSessionFooter`, prop `countdownSeconds` |
| `components/dashboard/commercial-sidebar.tsx` | Suppression cloche, utiliser `SidebarSessionFooter`, prop `countdownSeconds` |
| `app/commun/layout.tsx` | Passer `countdownSeconds` aux sidebars + footer santé via `SidebarSessionFooter` |
| `app/admin/layout.tsx` | Passer `countdownSeconds` à `AdminSidebar` |
| `app/dashboard/layout.tsx` | Passer `countdownSeconds` à `CommercialSidebar` |
| `components/navigation/navigation-items.tsx` | Suppression cloche ; bouton déconnexion avec pulse (hors sidebar, menu mobile) |
| `components/navigation/responsive-header.tsx` | Suppression cloche |

**Non modifiés** (footer inchangé) : `app/sante-individuelle/layout.tsx`, `app/sante-collective/layout.tsx`.

---

## Ordre d’implémentation suggéré

1. Hook : 5 min + `secondsRemaining` + toast dynamique.
2. Composant `CountdownDial`.
3. Composant `SidebarSessionFooter` (cadran + toggles centrés + user + bouton pulse).
4. Admin sidebar : prop `countdownSeconds`, remplacer footer par `SidebarSessionFooter`.
5. Commercial sidebar : idem + suppression cloche.
6. Commun layout : passer `countdownSeconds` à Admin/Commercial sidebars + footer santé avec `SidebarSessionFooter`.
7. Admin et dashboard layouts : passer `countdownSeconds` aux sidebars.
8. Navigation-items + responsive-header : suppression cloche ; pulse sur bouton déconnexion (menu mobile).
