"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileCheck,
  Lightbulb,
  PhoneCall,
  Target,
  Trophy,
  User,
  Wrench,
} from "lucide-react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const sectionAnimation = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const reasons = [
  'Contre le "One-Shot" : Un client avec un seul contrat partira au premier claquement de doigts.',
  "Pour la solidité : Plus un client a de contrats, plus il est fidèle et plus l'agence progresse.",
  "Pour le confort : Maîtriser son dossier, c'est maîtriser son stress en cas de sinistre.",
];

const foundationChecklist = [
  {
    type: "Particulier",
    checklist:
      "Nom, Prénom, Adresse, Tél, Mail, Situation pro & matrimoniale.",
  },
  {
    type: "Pro",
    checklist: "Idem + SIREN/SIRET, Code NAF, Activité précise.",
  },
  {
    type: "Entreprise",
    checklist: "Idem + Identification du décideur (Nom du gérant).",
  },
];

const contractChecks = [
  "GED : Toutes les pièces sont-elles présentes ?",
  "Signature : Le contrat est-il signé ?",
  "Instances : Reste-t-il des éléments en attente ?",
];

const winConditions = [
  `Le client sait qu'il a un interlocuteur dédié (Effet "Wow").`,
  "Le client a enregistré ton numéro et ton mail (Envoi du SMS/Vcard).",
  "La fiche Lagon est 100% qualifiée.",
  "Le client a pris conscience de ses zones de risque.",
];

export default function MPlus3ProcessPage() {
  const router = useRouter();

  return (
    <div className="container mx-auto max-w-5xl px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="mb-8"
      >
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour
        </Button>

        <div className="mb-4 flex flex-wrap items-center gap-3">
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Process Commercial
          </Badge>
          <Badge className="bg-violet-600 px-3 py-1 text-sm hover:bg-violet-600">
            Effet wow
          </Badge>
        </div>

        <h1 className="mb-3 text-3xl font-bold text-foreground sm:text-4xl">
          🚀 Le Process &quot;M+3&quot; : Transformer un Dossier en Relation
        </h1>
        <p className="text-lg text-muted-foreground">
          Pourquoi nous ne sommes pas des balles de flipper.
        </p>
      </motion.div>

      <motion.div
        initial="hidden"
        animate="visible"
        transition={{ staggerChildren: 0.08 }}
        className="space-y-6"
      >
        <motion.div variants={sectionAnimation}>
          <Card className="border-2 border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 dark:border-emerald-800 dark:from-emerald-950/20 dark:to-teal-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                🎯 Pourquoi ce process ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="leading-relaxed text-foreground">
                En agence, sans méthode, nous subissons les événements. Le{" "}
                <strong>M+3</strong> (appel à 3 mois d'ancienneté) est notre
                phare dans la tempête.
              </p>
              <ul className="space-y-2">
                {reasons.map((reason) => (
                  <li key={reason} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-sm text-foreground">{reason}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionAnimation}>
          <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 dark:border-blue-800 dark:from-blue-950/20 dark:to-cyan-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Wrench className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                🛠 Étape 1 : La Fondation (Avant l'appel)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-foreground">
                On ne téléphone pas les mains vides. On vérifie deux piliers.
              </p>

              <div className="rounded-lg border border-blue-200 bg-white/70 p-4 dark:border-blue-800 dark:bg-slate-900/30">
                <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">
                  1. La Fiche Client "Parfaite"
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-blue-200 dark:border-blue-800">
                        <th className="py-2 pr-3 font-semibold">Type</th>
                        <th className="py-2 font-semibold">
                          Check-list impérative
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {foundationChecklist.map((item) => (
                        <tr
                          key={item.type}
                          className="border-b border-blue-100 last:border-0 dark:border-blue-900/60"
                        >
                          <td className="py-2 pr-3 font-medium text-foreground">
                            {item.type}
                          </td>
                          <td className="py-2 text-muted-foreground">
                            {item.checklist}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-white/70 p-4 dark:border-blue-800 dark:bg-slate-900/30">
                <h3 className="mb-3 font-semibold text-blue-900 dark:text-blue-100">
                  2. Le Contrat "Carré"
                </h3>
                <ul className="space-y-2">
                  {contractChecks.map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className="text-sm text-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionAnimation}>
          <Card className="border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 dark:border-amber-800 dark:from-amber-950/20 dark:to-orange-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <PhoneCall className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                📞 Étape 2 : Le Script de Prise de Contact
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="italic text-foreground">
                L'objectif est de passer de "l'administratif" au "conseil" sans
                braquer le client.
              </p>
              <div className="space-y-3 rounded-lg border border-amber-200 bg-white/70 p-4 dark:border-amber-800 dark:bg-slate-900/30">
                <p className="text-sm leading-relaxed text-foreground">
                  <strong>L'accroche :</strong> "Bonjour M. Durand, c'est
                  Jocelyne de votre agence Allianz. Vous vous souvenez, vous
                  aviez assuré votre voiture avec Jacques il y a 3 mois ? C'est
                  moi qui vais suivre votre dossier désormais."
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  <strong>La raison :</strong> "Je vous appelle car après 3
                  mois, nous vérifions systématiquement que tout est en ordre
                  pour nos assurés. Avez-vous 5 minutes ?"
                </p>
              </div>
              <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-100/60 p-3 dark:border-amber-800 dark:bg-amber-900/20">
                <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                  C&apos;est à ce moment précis de l&apos;échange que l&apos;on verrouille les deux piliers :
                </p>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                  <User className="h-4 w-4" />
                  <span>Client parfait</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-100">
                  <FileCheck className="h-4 w-4" />
                  <span>Contrat OK</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionAnimation}>
          <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:border-violet-800 dark:from-violet-950/20 dark:to-fuchsia-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lightbulb className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                💡 Étape 3 : La Bascule Commerciale
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <p className="text-foreground">
                Une fois les deux piliers validés, on bascule en mode conseil.
                Objectif : ouvrir le dialogue sans pression et identifier les
                protections manquantes.
              </p>

              <div className="rounded-lg border border-violet-200 bg-white/70 p-4 dark:border-violet-800 dark:bg-slate-900/30">
                <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">
                  🎯 Le déclic commercial
                </p>
                <p className="text-base italic text-foreground">
                  "Vous êtes assuré chez nous pour votre auto, mais qui sont vos
                  autres assureurs ?"
                </p>
              </div>

              <div className="rounded-lg border border-violet-200 bg-violet-100/60 p-4 dark:border-violet-800 dark:bg-violet-900/20">
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">
                  🤫 Règle d&apos;or : tais-toi et laisse le client remplir le
                  silence.
                </p>
              </div>

              <div className="rounded-lg border border-violet-200 bg-white/70 p-4 dark:border-violet-800 dark:bg-slate-900/30">
                <p className="mb-3 text-sm font-semibold text-violet-900 dark:text-violet-100">
                  🔁 Rebond par profil
                </p>
                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <span aria-hidden>🛡️</span>
                    <span>
                      <strong>Manque évident :</strong> "Je vois que vous
                      n&apos;avez pas de Protection Juridique ou de GAV, qui s&apos;en
                      occupe pour vous ?"
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <span aria-hidden>💼</span>
                    <span>
                      <strong>Pro / TNS :</strong> "En cas d&apos;arrêt de travail,
                      vous savez que la couverture est limitée, qu&apos;avez-vous
                      prévu ?"
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-sm text-foreground">
                    <span aria-hidden>📈</span>
                    <span>
                      <strong>Patrimonial :</strong> "Avez-vous pris des
                      dispositions pour votre retraite ou vos impôts ?"
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div variants={sectionAnimation}>
          <Card className="border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 dark:border-green-800 dark:from-green-950/20 dark:to-emerald-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Trophy className="h-5 w-5 text-green-600 dark:text-green-400" />
                🏆 La Définition de la Victoire
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-foreground">
                On ne gagne pas seulement quand on signe un contrat. On gagne si :
              </p>
              <ul className="space-y-2">
                {winConditions.map((condition) => (
                  <li key={condition} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600 dark:text-green-400" />
                    <span className="text-sm text-foreground">{condition}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </motion.div>

      </motion.div>
    </div>
  );
}
