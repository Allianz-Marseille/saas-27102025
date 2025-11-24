# SaaS Agence - Allianz Marseille

Application Next.js 15 pour la gestion complète de votre agence : actes commerciaux, commissions et indicateurs.

## 📋 Fonctionnalités

- ✅ Authentification Firebase avec restriction de domaine `@allianz-marseille.fr`
- ✅ Deux rôles : `ADMINISTRATEUR` et `CDC_COMMERCIAL`
- ✅ Dashboard CDC avec KPI en temps réel
- ✅ Timeline visuelle des actes (samedi=orange, dimanche=rouge)
- ✅ Calcul automatique des commissions
- ✅ Mode clair/sombre automatique avec next-themes
- ✅ Design responsive mobile-first
- ✅ Animations GSAP et transitions Framer Motion

## 🛠️ Stack Technique

- **Next.js 15** (App Router)
- **TypeScript**
- **Tailwind CSS v4**
- **Firebase** (Auth + Firestore)
- **shadcn/ui** (composants)
- **GSAP** (animations)
- **Framer Motion** (transitions)
- **React Hook Form** + **Zod** (validation)
- **next-themes** (mode sombre)

## 📦 Installation

```bash
# Cloner le projet
git clone <repo>

# Installer les dépendances
npm install

# Configurer Firebase
cp .env.local.example .env.local
# Éditer .env.local avec vos credentials Firebase

# Démarrer le serveur de développement
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## 🔥 Configuration Firebase

1. Créez un projet Firebase
2. Activez Authentication (Email/Password)
3. Créez une base Firestore
4. Configurez les Security Rules (voir `firestore.rules`)
5. Ajoutez vos credentials dans `.env.local`

### Collections Firestore

- `users` - Profils utilisateurs avec rôle
- `acts` - Actes commerciaux
- `companies` - Compagnies d'assurance
- `commissionRules` - Règles de calcul des commissions

## 💰 Règles de Commissions

| Type          | Montant ou formule                                  |
| ------------- | --------------------------------------------------- |
| AUTO_MOTO     | 10 €                                                |
| IRD_PART      | 20 €                                                |
| IRD_PRO       | 20 € + 10 €/tranche de 1 000 € > 999 €             |
| PJ             | 30 €                                                |
| GAV            | 40 €                                                |
| NOP_50_EUR    | 10 €                                                |
| SANTE_PREV    | 50 €                                                |
| VIE_PP        | 50 €                                                |
| VIE_PU        | 1% du montant versé                                 |

## 📊 KPI Calculés

- **CA Mensuel** : Total des primes + versements
- **CA Auto** vs **CA Autres**
- **Ratio** : `(autres / auto) × 100` (ou 100% si 0 auto)
- **Nb Process** : Nombre de contrats
- **Commissions Potentielles** : Calculées automatiquement
- **Commissions Réelles** : Si validation OK (≥200€, ≥15 process, ≥100%)

## 🎨 Pages

- `/` - Homepage avec hero animé (GSAP)
- `/login` - Connexion avec validation email et toggles dev
- `/dashboard` - Dashboard CDC avec KPI, timeline et tableau
- `/admin` - Dashboard admin (utilisateurs, compagnies, règles)

## 🧪 Mode Dev

Des boutons de connexion rapide sont disponibles en mode développement :
- "Connexion ADMIN (dev)" → `/admin`
- "Connexion CDC (dev)" → `/dashboard`

⚠️ À retirer en production !

## 📝 Scripts

```bash
npm run dev      # Développement
npm run build    # Build production
npm run start    # Serveur production
npm run lint     # Linter ESLint
```

## 🔒 Sécurité

- Validation du domaine email côté client et serveur
- Firebase Security Rules pour Firestore
- Validation Zod sur tous les formulaires
- Variables d'environnement pour les credentials Firebase

## 📄 Licence

Allianz Marseille © 2025
# Test sync Vercel
