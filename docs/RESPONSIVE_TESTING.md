# Checklist de Tests - Version Responsive

## ✅ Implémentation Complète

### Composants Créés
- [x] `components/navigation/mobile-menu.tsx`
- [x] `components/navigation/responsive-header.tsx`
- [x] `components/navigation/navigation-items.tsx`

### Sections Migrées
- [x] Section Admin (`/admin`)
- [x] Section Commercial (`/dashboard`)
- [x] Section Santé Individuelle (`/sante-individuelle`)

---

## 🧪 Tests à Effectuer

### Desktop (>= 1024px)

#### Section Admin
- [ ] Sidebar visible par défaut
- [ ] Bouton burger masqué dans le header
- [ ] Collapse/expand sidebar fonctionne
- [ ] Navigation entre pages
- [ ] Déconnexion fonctionne
- [ ] ThemeToggle fonctionne
- [ ] Boutons flottants (collapse/expand) visibles
- [ ] Header fixe ne s'affiche pas

#### Section Commercial
- [ ] Sidebar visible par défaut
- [ ] NotificationCenter visible dans sidebar
- [ ] Navigation entre pages
- [ ] Déconnexion fonctionne
- [ ] Collapse/expand fonctionne

#### Section Santé Individuelle
- [ ] Sidebar visible par défaut
- [ ] Navigation entre pages
- [ ] Vérification permissions d'accès
- [ ] Déconnexion fonctionne
- [ ] Collapse/expand fonctionne

---

### Tablette (768px - 1023px)

#### Section Admin
- [ ] Sidebar desktop masquée
- [ ] Bouton burger visible dans header
- [ ] Clic burger ouvre le menu mobile
- [ ] Menu mobile slide depuis la gauche
- [ ] Overlay sombre apparaît
- [ ] Clic overlay ferme le menu
- [ ] Clic sur un lien ferme le menu
- [ ] Navigation fonctionne
- [ ] Déconnexion depuis menu mobile fonctionne
- [ ] Header fixe en haut

#### Section Commercial
- [ ] Mêmes tests que Admin
- [ ] NotificationCenter visible dans header
- [ ] ThemeToggle visible dans header

#### Section Santé Individuelle
- [ ] Mêmes tests que Admin
- [ ] ThemeToggle visible
- [ ] Couleurs vertes appliquées

---

### Mobile (< 768px)

#### Tests Généraux
- [ ] Burger visible et accessible
- [ ] Menu prend max 85% de largeur
- [ ] Scroll bloqué quand menu ouvert
- [ ] Touch gestures fonctionnent
- [ ] Menu se ferme après navigation
- [ ] Logo Allianz visible dans header
- [ ] Titre section visible (md+)
- [ ] Header sticky fonctionne

#### Performance Mobile
- [ ] Animations fluides (60fps)
- [ ] Pas de lag à l'ouverture du menu
- [ ] Transitions CSS smooth
- [ ] Pas de flash de contenu

---

## ♿ Accessibilité (WCAG AA)

### Navigation Clavier
- [ ] Tab parcourt les éléments du menu
- [ ] Enter/Space active les liens
- [ ] Escape ferme le menu mobile
- [ ] Focus visible sur tous les éléments interactifs
- [ ] Focus retourne au burger après fermeture menu

### ARIA & Sémantique
- [ ] `aria-label` sur bouton burger
- [ ] `role="dialog"` sur menu mobile
- [ ] `aria-modal="true"` sur menu mobile
- [ ] `aria-hidden` sur overlay
- [ ] Titres de section corrects (h1)
- [ ] Landmarks HTML5 corrects

### Screen Readers
- [ ] Menu annoncé correctement
- [ ] État ouvert/fermé communiqué
- [ ] Liens de navigation lisibles
- [ ] Bouton déconnexion identifiable

### Contraste & Visibilité
- [ ] Ratio contraste texte >= 4.5:1
- [ ] Ratio contraste boutons >= 3:1
- [ ] Focus visible (outline ou shadow)
- [ ] Textes lisibles sur tous fonds

---

## 🎨 Visual Testing

### Responsive Breakpoints
- [ ] 320px (iPhone SE)
- [ ] 375px (iPhone standard)
- [ ] 768px (iPad portrait)
- [ ] 1024px (iPad landscape)
- [ ] 1280px (Desktop)
- [ ] 1920px (Full HD)

### Dark Mode
- [ ] Admin section (dark)
- [ ] Commercial section (dark)
- [ ] Santé section (dark)
- [ ] Transitions light ↔ dark fluides
- [ ] Logos visibles en dark mode
- [ ] Contrastes respectés en dark

### Animations
- [ ] Menu slide-in fluide
- [ ] Overlay fade-in/out
- [ ] Boutons hover effects
- [ ] Transitions page à page
- [ ] Collapse sidebar smooth

---

## 🔒 Tests Fonctionnels

### Authentification
- [ ] Redirection si non connecté
- [ ] Auto-logout après inactivité
- [ ] Warning avant auto-logout
- [ ] Logs déconnexion enregistrés

### Permissions
- [ ] Section Admin (ADMINISTRATEUR seulement)
- [ ] Section Commercial (tous utilisateurs)
- [ ] Section Santé (permissions spéciales)
- [ ] Redirection si accès non autorisé

### Navigation
- [ ] Liens actifs surlignés correctement
- [ ] Navigation mobile ferme menu
- [ ] Retour navigateur fonctionne
- [ ] Deep links fonctionnent

---

## 🚀 Performance

### Lighthouse Mobile
- [ ] Performance >= 90
- [ ] Accessibility >= 95
- [ ] Best Practices >= 90
- [ ] SEO >= 90

### Core Web Vitals
- [ ] LCP (Largest Contentful Paint) < 2.5s
- [ ] FID (First Input Delay) < 100ms
- [ ] CLS (Cumulative Layout Shift) < 0.1

### Bundle Size
- [ ] Vérifier taille JS bundle
- [ ] Pas de duplications inutiles
- [ ] Lazy loading si nécessaire

---

## 🐛 Tests Edge Cases

### Comportements Extrêmes
- [ ] Resize fenêtre pendant menu ouvert
- [ ] Rotation device (portrait ↔ landscape)
- [ ] Multiples clics rapides burger
- [ ] Navigation pendant menu ouvert
- [ ] Logout pendant menu ouvert

### Données
- [ ] Email très long
- [ ] Pas de userData (null safety)
- [ ] Navigation vide (pas de pathname)
- [ ] Nombre élevé de notifications

---

## 📱 Devices Réels à Tester

### iOS
- [ ] iPhone SE (petit écran)
- [ ] iPhone 12/13/14
- [ ] iPhone 14 Pro Max (grand écran)
- [ ] iPad Mini
- [ ] iPad Pro

### Android
- [ ] Petit device (<= 360px)
- [ ] Device standard (375-414px)
- [ ] Tablette Android

### Navigateurs Mobile
- [ ] Safari iOS
- [ ] Chrome Mobile
- [ ] Firefox Mobile
- [ ] Samsung Internet

---

## 🔧 Fixes à Appliquer si Nécessaire

### CSS Fixes Potentiels
```css
/* Fix scroll mobile */
body {
  -webkit-overflow-scrolling: touch;
}

/* Fix safe area iOS */
padding-top: env(safe-area-inset-top);
padding-bottom: env(safe-area-inset-bottom);

/* Fix 100vh mobile */
height: 100dvh; /* Dynamic viewport height */
```

### JS Fixes Potentiels
```typescript
// Détecter resize avec debounce
useEffect(() => {
  const handleResize = debounce(() => {
    // Fermer menu mobile si passage à desktop
    if (window.innerWidth >= 1024 && isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  }, 150);
  
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, [isMobileMenuOpen]);
```

---

## ✅ Validation Finale

### Code Quality
- [x] Pas d'erreurs ESLint
- [x] Pas d'erreurs TypeScript
- [x] Imports organisés
- [x] Noms de variables cohérents
- [x] Commentaires utiles

### Documentation
- [x] Plan responsive créé
- [x] Checklist de tests créée
- [ ] Screenshots avant/après
- [ ] GIF démo du menu mobile

### Git
- [x] Branche `responsive` créée
- [x] Branche pushée sur GitHub
- [ ] Commits atomiques et descriptifs
- [ ] PR prête à review

---

## 🎯 Prochaines Étapes

1. Tester manuellement sur tous les breakpoints
2. Tester sur devices réels
3. Corriger les bugs identifiés
4. Prendre screenshots/vidéos
5. Créer PR avec description complète
6. Review par équipe
7. Merge dans main
8. Deploy sur environnement de test

---

## 📝 Notes

### Points d'Attention
- Vérifier que le `pt-16` (padding-top) sur mobile ne crée pas de problème de layout
- S'assurer que le z-index est correct (header: 30, overlay: 40, menu: 50)
- Tester le comportement avec beaucoup d'items de navigation
- Vérifier que les gradients s'affichent correctement sur tous navigateurs

### Améliorations Futures Potentielles
- [ ] Swipe gesture pour fermer le menu mobile
- [ ] Animation plus sophistiquée (spring physics)
- [ ] Menu persistant (garder état open/close en localStorage)
- [ ] Raccourcis clavier (Ctrl+K pour ouvrir menu)
- [ ] Search dans le menu mobile

