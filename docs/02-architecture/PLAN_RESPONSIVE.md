# Plan de Transformation Responsive

## 📋 Vue d'ensemble

Transformer l'application d'une architecture desktop avec sidebars fixes vers une architecture responsive avec menu burger pour mobile/tablette.

---

## 🎯 Objectifs

1. **Mobile-First** : Navigation optimale sur mobile (< 768px)
2. **Tablette** : Expérience adaptée (768px - 1024px)
3. **Desktop** : Conserver l'expérience actuelle (> 1024px)
4. **Consistance** : Même comportement sur les 3 sections (Admin, Commercial, Santé)

---

## 📊 Breakpoints Tailwind

```typescript
// Breakpoints à utiliser
sm: '640px'   // Petit mobile
md: '768px'   // Tablette portrait
lg: '1024px'  // Tablette landscape / petit desktop
xl: '1280px'  // Desktop
2xl: '1536px' // Grand écran
```

---

## 🏗️ Architecture Proposée

### 1. Composant Menu Burger Réutilisable

**Fichier** : `components/navigation/mobile-menu.tsx`

**Fonctionnalités** :
- Bouton burger (icône hamburger)
- Overlay sombre au clic
- Menu slide-in depuis la gauche
- Animation fluide
- Fermeture par clic overlay ou bouton X
- Accessibilité (ARIA labels, focus trap)

**Props** :
```typescript
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode; // Contenu du menu
  variant?: 'admin' | 'commercial' | 'health'; // Pour les couleurs
}
```

---

### 2. Header Responsive Réutilisable

**Fichier** : `components/navigation/responsive-header.tsx`

**Fonctionnalités** :
- Logo + titre de section
- Bouton burger (mobile/tablette)
- Actions rapides (notifications, thème)
- User menu (dropdown)
- Sticky top

**Props** :
```typescript
interface ResponsiveHeaderProps {
  title: string;
  onMenuToggle: () => void;
  variant?: 'admin' | 'commercial' | 'health';
  showNotifications?: boolean;
}
```

**Responsive Behavior** :
- `< md` : Burger visible, logo compact
- `md - lg` : Burger visible, logo + titre
- `>= lg` : Burger masqué (sidebar visible)

---

### 3. Navigation Container Réutilisable

**Fichier** : `components/navigation/navigation-container.tsx`

**Fonctionnalités** :
- Wrapper qui gère desktop sidebar vs mobile menu
- Logique de responsive automatique
- State management du menu

**Props** :
```typescript
interface NavigationContainerProps {
  navItems: NavItem[];
  variant?: 'admin' | 'commercial' | 'health';
  currentPath: string;
  onLogout: () => void;
  userData: UserData;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  separator?: boolean;
}
```

---

## 🔄 Modifications par Section

### A. Section Admin (`/admin`)

#### Fichiers à modifier :
1. `app/admin/layout.tsx`
2. `components/admin/admin-sidebar.tsx`

#### Changements :

**Layout (`app/admin/layout.tsx`)** :
```typescript
// Avant
<AdminSidebar ... />
<div className={isSidebarCollapsed ? "ml-16" : "ml-64"}>
  <header>...</header>
  <main>...</main>
</div>

// Après
<ResponsiveHeader 
  title="Administration"
  variant="admin"
  onMenuToggle={toggleMenu}
/>
<NavigationContainer
  navItems={adminNavItems}
  variant="admin"
  currentPath={pathname}
  onLogout={handleLogout}
  userData={userData}
/>
<main className="pt-16 md:pt-0 md:ml-0 lg:ml-64">
  {children}
</main>
```

**Sidebar (`components/admin/admin-sidebar.tsx`)** :
- Renommer en `admin-navigation.tsx` ou garder
- Supprimer les boutons collapse/expand fixes
- Ajouter props `isMobile` pour adapter le rendu
- Classe : `hidden lg:flex` pour masquer sur mobile

---

### B. Section Commercial (`/dashboard`)

#### Fichiers à modifier :
1. `app/dashboard/layout.tsx`
2. `components/dashboard/commercial-sidebar.tsx`

#### Changements :

**Layout** :
```typescript
// Structure similaire à Admin
<ResponsiveHeader 
  title="Dashboard Commercial"
  variant="commercial"
  showNotifications={true}
  onMenuToggle={toggleMenu}
/>
<NavigationContainer
  navItems={commercialNavItems}
  variant="commercial"
  ...
/>
<main className="pt-16 md:pt-0 lg:ml-64">
  {children}
</main>
```

**Sidebar** :
- Masquer sur mobile : `hidden lg:flex`
- Utiliser MobileMenu pour mobile

---

### C. Section Santé Individuelle (`/sante-individuelle`)

#### Fichiers à modifier :
1. `app/sante-individuelle/layout.tsx`

#### Changements :
- Extraire la sidebar inline dans un composant
- Appliquer la même logique que Admin/Commercial
- Variant : `health` (couleurs vertes)

---

## 🎨 Composants UI à Créer

### 1. `mobile-menu.tsx`

```typescript
"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  variant?: 'admin' | 'commercial' | 'health';
}

export function MobileMenu({ isOpen, onClose, children, variant = 'commercial' }: MobileMenuProps) {
  // Bloquer le scroll quand le menu est ouvert
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const variantColors = {
    admin: 'from-blue-600 to-purple-600',
    commercial: 'from-blue-500 to-purple-600',
    health: 'from-green-500 to-emerald-600'
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
        aria-hidden={!isOpen}
      />

      {/* Menu Slide */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-80 max-w-[85vw] bg-white dark:bg-slate-950 shadow-2xl z-50 transition-transform duration-300 lg:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
        aria-label="Menu de navigation"
      >
        {/* Header avec bouton close */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className={cn("text-lg font-bold bg-gradient-to-r bg-clip-text text-transparent", variantColors[variant])}>
            Menu
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Contenu du menu */}
        <div className="overflow-y-auto h-[calc(100vh-73px)]">
          {children}
        </div>
      </aside>
    </>
  );
}
```

---

### 2. `responsive-header.tsx`

```typescript
"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface ResponsiveHeaderProps {
  title: string;
  onMenuToggle: () => void;
  variant?: 'admin' | 'commercial' | 'health';
  showNotifications?: boolean;
}

export function ResponsiveHeader({ 
  title, 
  onMenuToggle, 
  variant = 'commercial',
  showNotifications = false 
}: ResponsiveHeaderProps) {
  const variantColors = {
    admin: 'from-blue-600 via-purple-600 to-blue-600',
    commercial: 'from-blue-600 via-purple-600 to-blue-600',
    health: 'from-green-600 via-emerald-600 to-green-600'
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-950 border-b z-30 lg:left-64">
      <div className="h-full px-4 flex items-center justify-between gap-4">
        {/* Burger + Logo (Mobile) */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onMenuToggle}
            className="lg:hidden"
            aria-label="Ouvrir le menu"
          >
            <Menu className="h-6 w-6" />
          </Button>
          
          <Image
            src="/allianz.svg"
            alt="Allianz"
            width={80}
            height={20}
            className="h-5 w-auto brightness-0 dark:brightness-100 md:h-6"
          />
          
          <h1 className={cn(
            "hidden md:block text-base lg:text-xl font-bold bg-gradient-to-r bg-clip-text text-transparent",
            variantColors[variant]
          )}>
            {title}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {showNotifications && <NotificationCenter />}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
```

---

### 3. `navigation-items.tsx`

```typescript
"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  exact?: boolean;
  separator?: boolean;
}

interface NavigationItemsProps {
  items: NavItem[];
  currentPath: string;
  variant?: 'admin' | 'commercial' | 'health';
  onLogout: () => void;
  userData: any;
  onNavigate?: () => void; // Pour fermer le menu mobile après navigation
}

export function NavigationItems({ 
  items, 
  currentPath, 
  variant = 'commercial',
  onLogout,
  userData,
  onNavigate 
}: NavigationItemsProps) {
  const router = useRouter();

  const variantColors = {
    admin: {
      active: 'from-blue-600 via-purple-600 to-blue-600',
      hover: 'from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30',
      badge: 'bg-purple-500'
    },
    commercial: {
      active: 'from-blue-600 via-purple-600 to-blue-600',
      hover: 'from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30',
      badge: 'bg-blue-500'
    },
    health: {
      active: 'from-green-500 to-emerald-600',
      hover: 'from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30',
      badge: 'bg-green-500'
    }
  };

  const colors = variantColors[variant];

  return (
    <div className="flex flex-col h-full">
      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = item.exact 
            ? currentPath === item.href
            : currentPath?.startsWith(item.href);

          return (
            <div key={item.href}>
              {item.separator && (
                <div className="my-3 border-t border-muted" />
              )}
              <Link 
                href={item.href}
                onClick={onNavigate}
              >
                <Button
                  variant="ghost"
                  className={cn(
                    "w-full justify-start gap-3 transition-all relative overflow-hidden",
                    isActive 
                      ? `bg-gradient-to-r ${colors.active} text-white font-semibold shadow-md` 
                      : `hover:bg-gradient-to-r hover:${colors.hover}`
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Button>
              </Link>
            </div>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="mt-auto border-t bg-gradient-to-r from-blue-500/5 to-purple-500/5">
        {userData && (
          <div className="p-4 border-b">
            <div className="flex items-center gap-3">
              <div className={cn(
                "h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white font-bold text-lg shadow-md",
                colors.active
              )}>
                {userData.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {userData.email.split('@')[0]}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("px-2 py-0.5 rounded-full text-white text-[10px] font-bold", colors.badge)}>
                    {variant === 'admin' ? 'ADMIN' : variant === 'health' ? 'SANTÉ' : 'COMMERCIAL'}
                  </div>
                  <User className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="p-4">
          <Button
            variant="outline"
            className="w-full gap-3 bg-red-50 text-red-600 border-red-300 hover:bg-red-100 hover:text-red-700 hover:border-red-400 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
            onClick={onLogout}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Déconnexion
          </Button>
        </div>
      </div>
    </div>
  );
}
```

---

## 📱 Comportements Responsive

### Mobile (< 768px)
- ✅ Sidebar masquée par défaut
- ✅ Header fixe avec burger
- ✅ Menu burger slide-in
- ✅ Overlay sombre
- ✅ Scroll bloqué quand menu ouvert
- ✅ Fermeture auto après navigation

### Tablette (768px - 1024px)
- ✅ Même comportement que mobile
- ✅ Menu légèrement plus large (320px vs 280px)

### Desktop (>= 1024px)
- ✅ Sidebar permanente
- ✅ Burger masqué
- ✅ Système collapse/expand conservé
- ✅ Header ajusté (ml-64 ou ml-256)

---

## ✅ Checklist d'Implémentation

### Phase 1 : Création des Composants Communs
- [ ] Créer `components/navigation/mobile-menu.tsx`
- [ ] Créer `components/navigation/responsive-header.tsx`
- [ ] Créer `components/navigation/navigation-items.tsx`
- [ ] Tester les composants isolément

### Phase 2 : Section Admin
- [ ] Modifier `app/admin/layout.tsx`
- [ ] Adapter `components/admin/admin-sidebar.tsx`
- [ ] Tester navigation mobile
- [ ] Tester navigation desktop
- [ ] Vérifier transitions tablet ↔ desktop

### Phase 3 : Section Commercial
- [ ] Modifier `app/dashboard/layout.tsx`
- [ ] Adapter `components/dashboard/commercial-sidebar.tsx`
- [ ] Intégrer NotificationCenter dans header
- [ ] Tester responsive

### Phase 4 : Section Santé Individuelle
- [ ] Modifier `app/sante-individuelle/layout.tsx`
- [ ] Extraire sidebar en composant
- [ ] Appliquer pattern responsive
- [ ] Tester

### Phase 5 : Polish
- [ ] Animations fluides
- [ ] Tests accessibilité (ARIA, focus trap)
- [ ] Tests navigation clavier
- [ ] Tests sur vrais devices
- [ ] Performance (Lighthouse mobile)

---

## 🎯 Accessibilité

### ARIA Labels
```typescript
// Burger button
aria-label="Ouvrir le menu de navigation"

// Menu mobile
role="dialog"
aria-modal="true"
aria-labelledby="mobile-menu-title"

// Overlay
aria-hidden="true"

// Close button
aria-label="Fermer le menu"
```

### Focus Management
- Focus trap dans le menu mobile
- Focus sur le bouton close à l'ouverture
- Retour du focus sur le burger à la fermeture
- Navigation clavier (Escape pour fermer)

### Keyboard Navigation
- `Escape` : Ferme le menu
- `Tab` : Cycle dans le menu
- `Enter/Space` : Active les liens

---

## 🚀 Performance

### Optimisations
- Lazy load du menu mobile (ne rendre que si < lg)
- Utiliser `will-change: transform` pour animations
- Éviter re-renders inutiles (useCallback, memo)
- Utiliser CSS transitions plutôt que JS

### Bundle Size
- Réutiliser les composants existants
- Pas de librairies externes pour le menu
- Lucide icons déjà en place

---

## 🧪 Tests à Effectuer

### Desktop (>= 1024px)
- [ ] Sidebar visible par défaut
- [ ] Burger masqué
- [ ] Collapse/expand fonctionne
- [ ] Navigation entre pages
- [ ] Déconnexion

### Tablette (768px - 1023px)
- [ ] Sidebar masquée
- [ ] Burger visible et fonctionnel
- [ ] Menu slide correctement
- [ ] Overlay apparaît
- [ ] Navigation ferme le menu

### Mobile (< 768px)
- [ ] Burger visible
- [ ] Menu prend 85% largeur max
- [ ] Scroll bloqué quand ouvert
- [ ] Swipe pour fermer (bonus)
- [ ] Performance fluide

### Accessibilité
- [ ] Screen reader compatible
- [ ] Navigation clavier
- [ ] Focus visible
- [ ] Contraste couleurs (AA/AAA)

---

## 📦 Fichiers Créés/Modifiés

### Nouveaux Fichiers
```
components/navigation/
  ├── mobile-menu.tsx
  ├── responsive-header.tsx
  └── navigation-items.tsx
```

### Fichiers Modifiés
```
app/
  ├── admin/layout.tsx
  ├── dashboard/layout.tsx
  └── sante-individuelle/layout.tsx

components/
  ├── admin/admin-sidebar.tsx
  └── dashboard/commercial-sidebar.tsx
```

---

## 🎨 Variants de Couleurs

```typescript
const variants = {
  admin: {
    gradient: 'from-blue-600 via-purple-600 to-blue-600',
    badge: 'bg-purple-500',
    hover: 'hover:from-blue-50 hover:to-purple-50'
  },
  commercial: {
    gradient: 'from-blue-600 via-purple-600 to-blue-600',
    badge: 'bg-blue-500',
    hover: 'hover:from-blue-50 hover:to-purple-50'
  },
  health: {
    gradient: 'from-green-500 to-emerald-600',
    badge: 'bg-green-500',
    hover: 'hover:from-green-50 hover:to-emerald-50'
  }
};
```

---

## 📝 Notes Importantes

### Éviter
- ❌ Dupliquer le code de navigation
- ❌ Utiliser des breakpoints custom (rester sur Tailwind standard)
- ❌ Animations trop lourdes
- ❌ State management complexe

### Privilégier
- ✅ Composants réutilisables
- ✅ Tailwind responsive utilities
- ✅ CSS transitions natives
- ✅ React state local (useState)

### Conventions
- Préfixe `is` pour booléens : `isOpen`, `isMobile`
- Préfixe `on` pour callbacks : `onClose`, `onToggle`
- Préfixe `handle` pour handlers : `handleLogout`
- Noms descriptifs : `mobileMenuOpen` plutôt que `open`

---

## 🔄 Migration Progressive

### Option 1 : Big Bang (Recommandé pour ce projet)
1. Créer tous les composants communs
2. Migrer les 3 sections en parallèle
3. Tester ensemble
4. Deploy

**Avantages** : Cohérence immédiate
**Inconvénients** : Plus de changements d'un coup

### Option 2 : Incrémentale
1. Migrer Section Admin
2. Deploy et test
3. Migrer Section Commercial
4. Deploy et test
5. Migrer Section Santé
6. Deploy final

**Avantages** : Risques réduits
**Inconvénients** : UX incohérente temporairement

**Recommandation** : Option 1 (projet de taille moyenne)

---

## 🎓 Bonnes Pratiques Next.js 15

### Server vs Client Components
```typescript
// Layouts : "use client" car state nécessaire
// Navigation items : "use client" car interactivité
// Header : "use client" car boutons
```

### Optimisations Images
```typescript
// Logo dans header
<Image
  src="/allianz.svg"
  alt="Allianz"
  width={100}
  height={24}
  priority // Dans header
  className="..."
/>
```

### Metadata
```typescript
// Dans chaque layout, ajouter viewport
export const metadata = {
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5'
};
```

---

## 🐛 Problèmes Potentiels & Solutions

### Problème 1 : Hydration Mismatch
**Cause** : État responsive différent server vs client
**Solution** : Utiliser `useEffect` + `useState` pour détecter viewport

```typescript
const [isMobile, setIsMobile] = useState(false);

useEffect(() => {
  const checkMobile = () => setIsMobile(window.innerWidth < 1024);
  checkMobile();
  window.addEventListener('resize', checkMobile);
  return () => window.removeEventListener('resize', checkMobile);
}, []);
```

### Problème 2 : Scroll Body Bloqué
**Cause** : Menu fermé mais overflow:hidden persiste
**Solution** : Cleanup dans useEffect

```typescript
useEffect(() => {
  if (isOpen) {
    document.body.style.overflow = 'hidden';
  } else {
    document.body.style.overflow = '';
  }
  return () => {
    document.body.style.overflow = ''; // Toujours cleanup
  };
}, [isOpen]);
```

### Problème 3 : Z-index Conflicts
**Solution** : Hiérarchie claire
```
Header: z-30
Overlay: z-40
Mobile Menu: z-50
```

---

## 🚀 Prêt à Implémenter ?

Ce plan couvre :
- ✅ Architecture responsive complète
- ✅ Composants réutilisables
- ✅ Accessibilité WCAG AA
- ✅ Performance optimisée
- ✅ Conventions Next.js 15
- ✅ Mobile-first approach
- ✅ Tests & validation

**Prochaine étape** : Implémenter les composants communs (Phase 1)

