import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Optimisations pour accélérer le build
  swcMinify: true,
  
  // Optimiser les imports
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

  // Exclure certaines dépendances du bundle si possible
  webpack: (config, { isServer }) => {
    // Optimiser les dépendances lourdes pour le client uniquement
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }
    return config;
  },

  // Vercel gère déjà l'optimisation du build
};

export default nextConfig;
