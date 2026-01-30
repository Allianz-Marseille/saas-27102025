import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/bob", destination: "/commun/agents-ia/bob-sante", permanent: true },
    ];
  },
  // Optimiser les imports (compatible avec Turbopack)
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      '@radix-ui/react-dialog',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-tooltip',
      'recharts',
      'framer-motion',
    ],
  },

  // Exclure pdf-parse du bundling Next.js (nécessaire pour Vercel)
  // pdf-parse utilise des binaires natifs qui doivent être chargés à l'exécution
  serverExternalPackages: ['pdf-parse'],

  // Configuration Turbopack (Next.js 16 utilise Turbopack par défaut)
  turbopack: {},
};

export default nextConfig;
