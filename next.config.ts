import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

  // Configuration Turbopack (Next.js 16 utilise Turbopack par défaut)
  turbopack: {},
};

export default nextConfig;
