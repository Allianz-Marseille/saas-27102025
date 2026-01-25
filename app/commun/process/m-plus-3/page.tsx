"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Users,
  Calendar,
  Target,
  PhoneCall,
  CheckCircle2,
  AlertCircle,
  FileText,
  ClipboardList,
  TrendingUp,
  Shield,
  Lightbulb,
  XCircle,
  MessageSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase/config";
import { collection, query, where, getDocs } from "firebase/firestore";

/**
 * Extrait le prénom depuis l'email
 */
function extractFirstName(email: string): string {
  const emailParts = email.split("@")[0].split(".");
  const rawFirstName = emailParts[0] || "Commercial";
  return (
    rawFirstName.charAt(0).toUpperCase() + rawFirstName.slice(1).toLowerCase()
  );
}

/**
 * Récupère tous les commerciaux actifs depuis Firestore
 * Uniquement les commerciaux CDC (exclut les commerciaux santé)
 */
async function getActiveCommercials(): Promise<string[]> {
  if (!db) return [];

  try {
    const usersRef = collection(db, "users");

    // Récupérer tous les utilisateurs actifs et filtrer côté client
    const q = query(usersRef, where("active", "==", true));
    const querySnapshot = await getDocs(q);

    const firstNames = querySnapshot.docs
      .map((doc) => {
        const data = doc.data();
        // Filtrer uniquement les commerciaux CDC (exclut COMMERCIAL_SANTE_INDIVIDUEL et COMMERCIAL_SANTE_COLLECTIVE)
        if (data.role === "CDC_COMMERCIAL") {
          return extractFirstName(data.email || "");
        }
        return null;
      })
      .filter((name): name is string => name !== null && name !== "Commercial")
      .sort();

    return firstNames;
  } catch (error) {
    console.error("Erreur lors de la récupération des commerciaux:", error);
    return [];
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
    },
  },
};

export default function MPlus3ProcessPage() {
  const router = useRouter();
  const [commercialNames, setCommercialNames] = useState<string[]>([]);
  const [isLoadingCommercials, setIsLoadingCommercials] = useState(true);

  useEffect(() => {
    const loadCommercials = async () => {
      setIsLoadingCommercials(true);
      const names = await getActiveCommercials();
      setCommercialNames(names);
      setIsLoadingCommercials(false);
    };

    loadCommercials();
  }, []);

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      {/* Header */}
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground">
            Processus M+3 : Suivi client
          </h1>
          <Badge variant="secondary" className="text-sm px-3 py-1 w-fit">
            Commercial
          </Badge>
        </div>
        <p className="text-muted-foreground text-lg">
          Guide complet du processus M+3 : recontacter les nouveaux clients 3 mois après la souscription pour sécuriser la qualité du dossier, mieux connaître le client et identifier son potentiel commercial.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-6"
      >
        {/* Personnes concernées */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-slate-50 to-gray-50 dark:from-slate-950/20 dark:to-gray-950/20 border-slate-200 dark:border-slate-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Users className="h-5 w-5 text-slate-600 dark:text-slate-400" />
                Personnes concernées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCommercials ? (
                <div className="text-sm text-muted-foreground">
                  Chargement des commerciaux...
                </div>
              ) : commercialNames.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {commercialNames.map((name) => (
                    <Badge
                      key={name}
                      variant="outline"
                      className="text-sm px-3 py-1"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Aucun commercial actif trouvé
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Qu'est-ce que le M+3 ? */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                Qu'est-ce que le M+3 ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Le <strong>M+3</strong> (Mois + 3) est un processus de suivi client systématique qui consiste à recontacter les nouveaux clients <strong>environ 3 mois après la souscription</strong> de leur premier contrat d'assurance.
              </p>
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-3">
                  Pourquoi 3 mois ?
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      <strong>Période d'adaptation</strong> : Le client a eu le temps de vivre avec son contrat
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      <strong>Moment optimal</strong> : Assez tôt pour maintenir l'engagement, assez tard pour avoir du recul
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 dark:text-blue-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      <strong>Opportunité commerciale</strong> : Le client est encore "chaud" et réceptif
                    </span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Objectifs du processus */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                Objectifs du processus M+3
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    1. Qualité du dossier
                  </h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Vérifier et mettre à jour les informations du client dans le CRM (Lagon)</li>
                    <li>• S'assurer que toutes les pièces sont au dossier</li>
                    <li>• Valider les signatures des contrats</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    2. Connaissance du client
                  </h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Mieux comprendre sa situation</li>
                    <li>• Identifier ses besoins réels</li>
                    <li>• Évaluer son potentiel commercial</li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    3. Développement commercial
                  </h4>
                  <ul className="text-sm text-foreground space-y-1">
                    <li>• Réaliser un <strong>bilan global</strong> de ses assurances</li>
                    <li>• Identifier les opportunités de multi-équipement</li>
                    <li>• Transformer un "besoin ponctuel" en <strong>relation globale</strong></li>
                  </ul>
                </div>
                <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-purple-200 dark:border-purple-800">
                  <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    4. Objectif final : "Client complet"
                  </h4>
                  <p className="text-sm text-foreground">
                    Un client qui a tous ses contrats chez nous, selon sa situation et ses besoins.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quand effectuer un M+3 ? */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/20 dark:to-teal-950/20 border-emerald-200 dark:border-emerald-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Calendar className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                Quand effectuer un M+3 ?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-emerald-200 dark:border-emerald-800">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-3">
                  Critères d'éligibilité
                </h4>
                <ul className="space-y-2">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      Il a souscrit un contrat <strong>Affaire Nouvelle (AN)</strong> il y a <strong>3 mois</strong> (± 1 semaine)
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      Aucun M+3 n'a encore été réalisé pour ce contrat
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 mt-1 shrink-0" />
                    <span className="text-foreground text-sm">
                      Le contrat est toujours actif
                    </span>
                  </li>
                </ul>
              </div>
              <div className="p-4 rounded-lg bg-emerald-100/50 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700">
                <h4 className="font-semibold text-emerald-900 dark:text-emerald-100 mb-2">
                  Exemple de calcul
                </h4>
                <p className="text-sm text-foreground">
                  Contrat souscrit le <strong>15 janvier 2025</strong> (date d'effet)<br />
                  M+3 à réaliser autour du <strong>15 avril 2025</strong> (± 1 semaine)<br />
                  <span className="font-semibold">Fenêtre optimale : 8 avril - 22 avril 2025</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Les 3 objectifs */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                Le processus en 3 objectifs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Objectif 1 */}
              <div className="p-5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">1</span>
                  Valider la qualité de la fiche CRM (Lagon)
                </h3>
                <p className="text-sm text-foreground mb-4">
                  <strong>But :</strong> S'assurer que le dossier est complet, fiable et exploitable.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      Pour un Particulier — À valider :
                    </h4>
                    <ul className="text-sm text-foreground space-y-1 ml-4">
                      <li>• Adresse complète et à jour</li>
                      <li>• Téléphone + Email</li>
                      <li>• Situation matrimoniale</li>
                      <li>• Situation professionnelle</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      Pour un Professionnel (TNS) — En plus :
                    </h4>
                    <ul className="text-sm text-foreground space-y-1 ml-4">
                      <li>• SIRET / Code NAF</li>
                      <li>• Activité exacte</li>
                      <li>• Chiffre d'affaires + Effectif</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      Pour une Entreprise — En plus :
                    </h4>
                    <ul className="text-sm text-foreground space-y-1 ml-4">
                      <li>• SIRET / Code NAF</li>
                      <li>• Activité exacte</li>
                      <li>• Chiffre d'affaires + Effectif</li>
                      <li>• Contact "qui gère les assurances" côté entreprise</li>
                    </ul>
                  </div>
                  <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                    <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">
                      ⚠️ Point obligatoire : Vérifier / corriger la bonne agence (Corniche ou Rouvière) + le bon chargé de clientèle
                    </p>
                  </div>
                </div>
              </div>

              {/* Objectif 2 */}
              <div className="p-5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">2</span>
                  Finaliser les contrats en cours
                </h3>
                <p className="text-sm text-foreground mb-4">
                  <strong>But :</strong> Sécuriser la relation contractuelle et la conformité du dossier.
                </p>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      Checklist à contrôler :
                    </h4>
                    <div className="ml-4 space-y-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">Signatures :</p>
                        <ul className="text-sm text-foreground space-y-1 ml-4">
                          <li>• Dispositions particulières (DP) signées</li>
                          <li>• Devis / projets signés</li>
                        </ul>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">Pièces au dossier :</p>
                        <ul className="text-sm text-foreground space-y-1 ml-4">
                          <li>• Carte grise (pour auto/moto)</li>
                          <li>• Permis de conduire</li>
                          <li>• CNI / Passeport</li>
                          <li>• Bail (pour habitation)</li>
                          <li>• Justificatifs divers selon le risque</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objectif 3 */}
              <div className="p-5 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-indigo-200 dark:border-indigo-800">
                <h3 className="font-bold text-lg text-indigo-900 dark:text-indigo-100 mb-3 flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold">3</span>
                  Bilan global (développement commercial)
                </h3>
                <p className="text-sm text-foreground mb-4">
                  <strong>But :</strong> Identifier le potentiel commercial et les opportunités de multi-équipement.
                </p>
                <div className="space-y-3">
                  <div className="p-3 rounded bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-semibold text-sm text-indigo-900 dark:text-indigo-100 mb-2 flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Phrase déclencheur
                    </h4>
                    <p className="text-sm text-foreground italic">
                      "Nous sommes à présent votre assureur pour l'auto (par exemple). Qui sont vos autres assureurs ?"
                    </p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-indigo-800 dark:text-indigo-200 mb-2">
                      Déroulement :
                    </h4>
                    <ol className="text-sm text-foreground space-y-2 ml-4 list-decimal">
                      <li><strong>Laisser le client parler</strong> - Prendre des notes, ne pas interrompre</li>
                      <li><strong>Identifier les contrats</strong> - Chez nous / Ailleurs</li>
                      <li><strong>Repérer les manques logiques</strong> selon sa situation familiale, son métier, ses biens, ses besoins de protection</li>
                    </ol>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Méthode : Le cadre de l'appel */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <PhoneCall className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                Méthode : Le cadre de l'appel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-cyan-200 dark:border-cyan-800">
                <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
                  Le prétexte administratif
                </h4>
                <p className="text-sm text-foreground mb-3">
                  Le contact M+3 se fait sous un <strong>prétexte administratif</strong> : "mise à jour du dossier".
                </p>
                <p className="text-xs text-foreground">
                  Moins intrusif qu'un appel commercial pur, légitime aux yeux du client, permet d'aborder naturellement les sujets.
                </p>
              </div>
              <div className="p-4 rounded-lg bg-cyan-100/50 dark:bg-cyan-900/30 border border-cyan-300 dark:border-cyan-700">
                <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2 flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Accroche téléphonique (standard)
                </h4>
                <p className="text-sm text-foreground italic">
                  "Bonjour [Prénom], c'est [Votre prénom] de l'agence [Nom]. C'est [Prénom vendeur] qui a assuré votre contrat auto et c'est moi qui vais vous suivre et gérer votre dossier. Est-ce que vous avez quelques minutes, ou on prend un rendez-vous téléphonique ?"
                </p>
              </div>
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-cyan-200 dark:border-cyan-800">
                <h4 className="font-semibold text-cyan-900 dark:text-cyan-100 mb-2">
                  Points importants
                </h4>
                <ul className="text-sm text-foreground space-y-1">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />
                    <span>Se présenter clairement</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />
                    <span>Mentionner le vendeur initial (créer un lien)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />
                    <span>Proposer un créneau si pas disponible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-cyan-600 dark:text-cyan-400 mt-1 shrink-0" />
                    <span>Être souriant et professionnel</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Finalité : Client complet */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Target className="h-5 w-5 text-green-600 dark:text-green-400" />
                Finalité : "Client complet"
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-foreground leading-relaxed">
                Un <strong>"Client complet"</strong> est un client qui a tous ses contrats d'assurance chez nous, des contrats adaptés à sa situation, et une relation de confiance solide.
              </p>
              <div className="p-4 rounded-lg bg-white/50 dark:bg-slate-800/50 border border-green-200 dark:border-green-800">
                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-3">
                  Le M+3 : process "qualité + commercial"
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Qualité
                    </p>
                    <p className="text-sm text-foreground">
                      Fiche CRM à jour + Contrats finalisés
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                      Commercial
                    </p>
                    <p className="text-sm text-foreground">
                      Bilan global + Opportunités concrètes
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 rounded-lg bg-green-100/50 dark:bg-green-900/30 border border-green-300 dark:border-green-700">
                <p className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Objectif final : Augmenter le multi-équipement et la solidité de la relation client.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Suivi dans le SaaS */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20 border-orange-200 dark:border-orange-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <ClipboardList className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                Suivi dans le SaaS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-3">
                  Tags de suivi M+3
                </h4>
                <div className="space-y-2">
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-800/50 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Appel téléphonique
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OK / KO - Contact établi avec le client
                    </p>
                  </div>
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-800/50 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Mise à jour fiche Lagon
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OK / KO - Fiche CRM validée et mise à jour
                    </p>
                  </div>
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-800/50 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Bilan effectué
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OK / KO - Bilan global réalisé
                    </p>
                  </div>
                  <div className="p-3 rounded bg-white/50 dark:bg-slate-800/50 border border-orange-200 dark:border-orange-800">
                    <p className="text-sm font-medium text-foreground mb-1">
                      SMS/Mail coordonnées
                    </p>
                    <p className="text-xs text-muted-foreground">
                      OK / KO - Coordonnées envoyées (si KO sur appel)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Bonnes pratiques */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-teal-50 to-green-50 dark:from-teal-950/20 dark:to-green-950/20 border-teal-200 dark:border-teal-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <Lightbulb className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                Bonnes pratiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                  Avant l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Consulter le dossier client dans Lagon</li>
                  <li>• Vérifier le contrat initial (type, garanties, prime)</li>
                  <li>• Noter les éventuels sinistres depuis la souscription</li>
                  <li>• Préparer les questions selon le type de client</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                  Pendant l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Être à l'écoute, ne pas précipiter</li>
                  <li>• Prendre des notes en temps réel</li>
                  <li>• Valider les informations au fur et à mesure</li>
                  <li>• Ne pas forcer, proposer un rappel si besoin</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-teal-900 dark:text-teal-100 mb-2">
                  Après l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Mettre à jour immédiatement la fiche Lagon</li>
                  <li>• Créer l'acte M+3 dans le système avec tous les tags</li>
                  <li>• Noter les opportunités identifiées</li>
                  <li>• Planifier les actions de suivi (devis, RDV, etc.)</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Points de vigilance */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                Points de vigilance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  À éviter
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Appeler trop tôt (moins de 2,5 mois) ou trop tard (plus de 4 mois)</li>
                  <li>• Oublier de valider la fiche CRM</li>
                  <li>• Passer directement au commercial sans valider les objectifs 1 et 2</li>
                  <li>• Ne pas documenter les opportunités</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  À privilégier
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Respecter la fenêtre de 3 mois (± 1 semaine)</li>
                  <li>• Suivre les 3 objectifs dans l'ordre</li>
                  <li>• Documenter tout dans le système</li>
                  <li>• Planifier les actions de suivi immédiatement</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Checklist rapide */}
        <motion.div variants={itemVariants}>
          <Card className="border-2 bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950/20 dark:to-purple-950/20 border-violet-200 dark:border-violet-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-xl">
                <ClipboardList className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                Checklist rapide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">
                  Avant l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Client éligible (3 mois après AN)</li>
                  <li>• Dossier consulté dans Lagon</li>
                  <li>• Contrat initial vérifié</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">
                  Pendant l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Objectif 1 : Fiche CRM validée</li>
                  <li>• Objectif 2 : Contrats finalisés</li>
                  <li>• Objectif 3 : Bilan global réalisé</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-violet-900 dark:text-violet-100 mb-2">
                  Après l'appel
                </h4>
                <ul className="text-sm text-foreground space-y-1 ml-4">
                  <li>• Acte M+3 créé dans le système</li>
                  <li>• Tous les tags remplis</li>
                  <li>• Actions de suivi planifiées</li>
                  <li>• Notes ajoutées au dossier</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  );
}
