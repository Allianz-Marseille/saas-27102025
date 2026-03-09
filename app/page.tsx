"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import gsap from "gsap";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, FileText } from "lucide-react";
import Image from "next/image";

export default function HomePage() {
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Animation du logo uniquement
      gsap.from(".logo-animation", {
        scale: 0,
        rotation: -180,
        duration: 1.2,
        ease: "back.out(1.7)",
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen relative">
      {/* Background image avec flou */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/vieux_port.jpeg"
          alt="Vieux-Port de Marseille"
          fill
          priority
          className="object-cover"
          style={{ filter: 'blur(8px)' }}
          quality={90}
        />
        {/* Overlay pour améliorer la lisibilité */}
        <div className="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60" />
      </div>

      {/* Contenu de la page */}
      <div className="relative z-10">
        <header className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="logo-animation">
              <Image
                src="/allianz.svg"
                alt="Allianz"
                width={150}
                height={40}
                priority
                className="h-10 w-auto brightness-0 invert"
              />
            </div>
            <span className="text-xl font-bold text-white">
              Marseille
            </span>
          </div>
          <Link href="/login">
            <Button variant="outline" className="border-white/60 text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm">
              Se connecter
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20">
        <div ref={heroRef} className="max-w-4xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="text-5xl md:text-7xl font-bold mb-6 text-white drop-shadow-2xl"
          >
            SaaS Agence
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.6 }}
            className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto drop-shadow-lg"
          >
            Gestion complète de votre agence : actes commerciaux, commissions
            et indicateurs en temps réel.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.9 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link href="/login">
              <Button size="lg" className="bg-[#00529B] hover:bg-[#003d73] text-white shadow-2xl hover:shadow-blue-500/50 transition-all hover:scale-105">
                Accéder à mon espace
              </Button>
            </Link>
          </motion.div>
        </div>

        <div className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <TrendingUp className="h-12 w-12 text-[#00529B] mb-4" />
            <h3 className="text-xl font-semibold mb-2">KPI en temps réel</h3>
            <p className="text-muted-foreground">
              Suivez vos indicateurs clés de performance en direct
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <DollarSign className="h-12 w-12 text-[#00529B] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Calcul automatique</h3>
            <p className="text-muted-foreground">
              Commissions calculées automatiquement selon les règles Allianz
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-6 rounded-lg shadow-xl hover:shadow-2xl transition-all hover:scale-105"
          >
            <FileText className="h-12 w-12 text-[#00529B] mb-4" />
            <h3 className="text-xl font-semibold mb-2">Historique complet</h3>
            <p className="text-muted-foreground">
              Visualisez tous vos actes commerciaux sur la timeline
            </p>
          </motion.div>
        </div>
      </main>

        <footer className="container mx-auto px-4 py-12 text-center text-white/90">
          <p>© 2025 Allianz Marseille. Tous droits réservés.</p>
        </footer>
      </div>
    </div>
  );
}
