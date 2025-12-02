# 🏗️ Architecture de l'Application

## 📁 Structure du Projet

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/
│   │   └── login/         # Page de connexion
│   ├── dashboard/         # Dashboard CDC Commercial
│   ├── admin/             # Dashboard Administrateur
│   ├── layout.tsx         # Layout principal avec Provider
│   ├── page.tsx           # Homepage
│   └── globals.css        # Styles globaux Tailwind
│
├── components/
│   ├── dashboard/         # Composants dashboard spécifiques
│   │   ├── kpi-card.tsx
│   │   └── theme-toggle.tsx
│   ├── providers/         # Providers React (Theme, etc.)
│   │   └── theme-provider.tsx
│   ├── ui/                # Composants shadcn/ui
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   ├── password-input.tsx
│   │   └── sonner.tsx
│   └── icons/
│       └── allianz-logo.tsx
│
├── lib/
│   ├── firebase/          # Configuration et services Firebase
│   │   ├── config.ts      # Init Firebase
│   │   ├── auth.ts        # Auth (login, register, logout)
│   │   ├── acts.ts        # CRUD actes commerciaux
│   │   ├── companies.ts   # CRUD compagnies
│   │   └── commission-rules.ts  # Règles commissions
│   ├── utils/
│   │   ├── kpi.ts         # Calcul KPI et commissions
│   │   └── utils.ts       # Utilities générales (cn)
│
├── types/
│   └── index.ts           # Types TypeScript globaux
│
├── public/                # Assets statiques
│
├── firestore.rules        # Règles de sécurité Firestore
├── firestore.indexes.json # Index Firestore pour queries
├── .env.local.example     # Template variables d'environnement
└── README.md             # Documentation principale
```

## 🔐 Authentification

### Restriction de domaine
- Emails autorisés : `@allianz-nogaro.fr` uniquement
- Validation côté client et serveur

### Rôles
- `ADMINISTRATEUR` → Accès `/admin` (gestion complète)
- `CDC_COMMERCIAL` → Accès `/dashboard` (saisie actes uniquement)

### Flow
1. Connexion via Firebase Auth
2. Vérification domaine email
3. Récupération profil Firestore (`users/{uid}`)
4. Redirection selon rôle

## 💾 Données Firestore

### Collection `users`
```typescript
{
  id: string;           // UID Firebase Auth
  email: string;
  role: "ADMINISTRATEUR" | "CDC_COMMERCIAL";
  active: boolean;
  createdAt: Date;
}
```

### Collection `acts`
```typescript
{
  id: string;
  userId: string;
  kind: "AN" | "M+3" | "PRETERME_AUTO" | "PRETERME_IRD";
  clientNom: string;
  numeroContrat: string;
  contratType: string;
  compagnie: string;
  dateEffet: Date;
  dateSaisie: Date;
  primeAnnuelle?: number;
  montantVersement?: number;
  commissionPotentielle: number;
  commissionReelle?: number;
  moisKey: string;      // Format "YYYY-MM"
}
```

### Collection `companies`
```typescript
{
  id: string;
  name: string;
  active: boolean;
  createdAt: Date;
}
```

### Collection `commissionRules`
```typescript
{
  id: string;
  contratType: string;
  montant?: number;
  pourcentage?: number;
  trancheMin?: number;
  active: boolean;
}
```

## 💰 Calcul des Commissions

### Règles par type de contrat
| Type          | Montant         |
|---------------|-----------------|
| AUTO_MOTO     | 10 €            |
| IRD_PART      | 20 €            |
| IRD_PRO       | 20€ + 10€/tranche >999€ |
| PJ             | 30 €            |
| GAV            | 40 €            |
| NOP_50_EUR    | 10 €            |
| SANTE_PREV    | 50 €            |
| VIE_PP        | 50 €            |
| VIE_PU        | 1% du montant   |

### Validation des commissions réelles
Conditions **TOUTES** requises :
- ✅ Commissions potentielles ≥ 200 €
- ✅ Nombre de process ≥ 15
- ✅ Ratio ≥ 100%

## 📊 Calcul des KPI

### Méthode `calculateKPI()`
```typescript
{
  caMensuel: number;              // Somme primes + versements
  caAuto: number;                 // CA des contrats auto/moto
  caAutres: number;              // CA des autres contrats
  nbContrats: number;            // Total actes
  nbContratsAuto: number;        // Nombre actes auto
  nbContratsAutres: number;     // Nombre autres actes
  ratio: number;                 // (autres/auto) × 100 ou 100%
  nbProcess: number;            // = nbContrats
  commissionsPotentielles: number;
  commissionsReelles: number;    // Si validation OK
  commissionValidee: boolean;
}
```

### Ratio
```
ratio = (nbContratsAuto === 0) 
  ? 100 
  : (nbContratsAutres / nbContratsAuto) × 100
```

## 🎨 Design System

### Palette Allianz
- **Primary** : `#00529B` (bleu Allianz)
- **Background** : clair/sombre via `next-themes`
- **Timeline** : samedi=orange, dimanche=rouge

### Animations
- **GSAP** : Hero, entrées de page, timeline
- **Framer Motion** : Transitions, hover effects

### Responsive
- Mobile-first avec Tailwind
- Breakpoints : sm, md, lg, xl

## 🔒 Sécurité Firestore

### Rules principales
1. **Read** : Tous les utilisateurs authentifiés
2. **Create** : CDC pour acts, Admin pour companies/rules
3. **Update** : CDC pour ses propres acts, Admin pour tout
4. **Delete** : Admin uniquement

### Validation
- Domaine email client + serveur
- Rôles vérifiés via Firestore
- Zod pour validation formulaires

## 🚀 Déploiement

### Variables d'environnement requises
```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

### Commandes
```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Production local
npm run lint     # ESLint
```

## 📝 TODO Futur

- [ ] Implémenter la modal d'ajout d'acte (2 étapes)
- [ ] Tableau filtrable avec export CSV
- [ ] Gestion complète admin (CRUD users/companies/rules)
- [ ] Connexion réelle Firebase (actuellement mockée)
- [ ] Tests unitaires (Jest + React Testing Library)
- [ ] PWA (service worker, offline support)

