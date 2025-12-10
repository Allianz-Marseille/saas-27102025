"use client";

import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Workflow, Users, FileText } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const processes = [
  {
    id: "leads",
    title: "Gestion des leads",
    description: "Processus de coordination pour la gestion des leads : réception, traitement via Lagon, Trello et Slack, et procédure de prise en charge.",
    icon: Users,
    href: "/admin/process/leads",
    color: "from-blue-600 via-purple-600 to-blue-600",
    hoverColor: "hover:from-blue-700 hover:via-purple-700 hover:to-blue-700",
  },
  {
    id: "declaration-affaires",
    title: "Déclaration d'affaires",
    description: "Processus de déclaration d'affaires : clés de répartition par agence, règles de travail en équipe, obligations de déclaration et répartition santé.",
    icon: FileText,
    href: "/admin/process/declaration-affaires",
    color: "from-emerald-600 via-teal-600 to-emerald-600",
    hoverColor: "hover:from-emerald-700 hover:via-teal-700 hover:to-emerald-700",
  },
];

export default function ProcessPage() {
  const router = useRouter();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Processus
          </h1>
          <p className="text-muted-foreground mt-2">
            Consultez les processus et procédures de l'agence
          </p>
        </div>
      </div>

      {/* Grille de cartes */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {processes.map((process, index) => {
          const Icon = process.icon;
          return (
            <motion.div
              key={process.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  "cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] group relative overflow-hidden h-full",
                  "border-2 hover:border-blue-300 dark:hover:border-blue-700"
                )}
                onClick={() => router.push(process.href)}
              >
                {/* Gradient Background on Hover */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-300",
                    `from-blue-500 to-purple-500`
                  )}
                />

                {/* Shine Effect */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 0.6 }}
                />

                <CardHeader className="relative z-10">
                  <div className="flex items-start justify-between gap-4">
                    <div className={cn(
                      "p-3 rounded-lg bg-gradient-to-br shadow-lg",
                      `bg-gradient-to-br ${process.color}`
                    )}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 text-xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {process.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="relative z-10">
                  <CardDescription className="text-base leading-relaxed">
                    {process.description}
                  </CardDescription>
                  <div className="mt-4 flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:translate-x-2 transition-transform">
                    Consulter le processus
                    <svg
                      className="ml-2 h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
