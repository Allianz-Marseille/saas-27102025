"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, ArrowRight, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { motion } from "framer-motion";

export default function OutilsPage() {
  const router = useRouter();

  const outils = [
    {
      id: "beneficiaires-effectifs",
      title: "Bénéficiaires effectifs",
      description: "Recherchez les bénéficiaires effectifs d'une entreprise par SIREN/SIRET",
      icon: Users,
      href: "/commun/outils/beneficiaires-effectifs",
    },
    {
      id: "societe-entreprise",
      title: "Informations entreprise",
      description: "Consultez toutes les informations disponibles sur une entreprise (légales, dirigeants, bilans, établissements, etc.)",
      icon: Building2,
      href: "/commun/outils/societe-entreprise",
    },
  ] as const;

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>

        <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
          Outils
        </h1>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outils.map((outil, index) => {
          const Icon = outil.icon;
          return (
            <motion.div
              key={outil.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + index * 0.1 }}
            >
              <Card
                className="cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 border-2 bg-card text-card-foreground"
                onClick={() => router.push(outil.href)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-xl">{outil.title}</CardTitle>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground shrink-0" />
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm">
                    {outil.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
