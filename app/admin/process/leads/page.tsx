"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, 
  Users, 
  Mail, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  MessageSquare,
  Target,
  Route,
  Building2,
  Zap,
  Clock,
  FileText,
  UserPlus,
  ArrowRight,
  Ban,
  Lightbulb,
  ListChecks,
  TrendingUp,
  Shield,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { GmailIcon } from "@/components/icons/gmail-icon";
import { TrelloIcon } from "@/components/icons/trello-icon";
import { SlackIcon } from "@/components/icons/slack-icon";

export default function LeadsProcessPage() {
  const router = useRouter();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Lire le fichier markdown via l'API
    fetch("/api/process/leads")
      .then((res) => res.json())
      .then((data) => {
        setContent(data.content || "");
        setIsLoading(false);
      })
      .catch(() => {
        // Si le fetch échoue, utiliser le contenu directement
        setContent(`# Gestion des Leads

## Objectif

Tous les leads sont traités rapidement et la personne qui prend en charge un lead respecte les bonnes pratiques :

• être rapide

• mettre le lead dans son tuyau

• éviter aux autres de se poser la question : "pris ou pas pris ?" → c'est une perte de temps

**Idée : gain de temps et efficacité**

---

## 2 chemins pour les leads

• le chemin strictement Allianz

• le chemin développé par l'agence pour gagner en efficacité

---

## Le chemin Allianz

• un mail arrive dans la b@l général

• une information descend dans Lagon seulement quand on recharge Lagon

![Bouton de reload](/leads/reload.PNG)

ou le lendemain à l'ouverture du poste

![Interface Lagon - Opportunités commerciales](/leads/info-lagon.PNG)

### Inconvénients

• ce n'est **pas dynamique**

• il faut y penser

• et comme nous sommes nombreux, ça devient "tout le monde ou personne"

---

## La solution mise en place par l'agence

• le mail arrive dans un tableau Trello / entrée : Leads Allianz

• tout le monde en est informé par Slack "qui le prend en charge" → ce n'est pas la peine d'y penser (pas de charge mentale)

![Gmail - Boîte de réception](/leads/gmail.webp)

![Trello - Tableau Leads](/leads/trello.png)

![Slack - Notification](/leads/slack.png)

---

## Quand je prends un lead, une méthode à respecter

### Méthode simple en 4 étapes

**1) Je prends la carte Trello**

• Je la glisse de **Entrée** → vers **ma colonne**

• Elle m'appartient : personne d'autre ne l'appellera

**2) Il faut créer la fiche prospect en Lagon pour gérer le devis**

• Je crée la fiche prospect dans Lagon

• Je peux ainsi gérer le devis

**3) Je peux ainsi gérer le devis et en prendre connaissance**

• Vérification

• Ajustements

• Préparation à l'appel

**4) C'est seulement à ce moment que je peux téléphoner au client**

### Plan d'appel

| Jour | Appels | SMS                |
| ---- | ------ | ------------------ |
| 1    | 3      | Après chaque appel |
| 2    | 2      | Après chaque appel |
| 3    | 1      | Après l'appel      |

**Pourquoi ce rythme ?**

Parce qu'il multiplie les chances d'avoir le client tout en restant respectueux.

---

## ⛔ Les deux choses qu'on ne doit **jamais** faire

❌ Appeler sans avoir intégré la fiche Lagon

→ On perd la trace du lead et on crée du flou pour l'équipe.

❌ Laisser la carte dans « Entrée » alors qu'on s'en occupe

→ Les autres pensent qu'elle n'est pas prise.

---

## 💡 Pourquoi ces règles existent ?

Parce qu'on veut éviter :

• les doublons d'appel

• les oublis

• la confusion

• les "Je croyais que c'était toi…"

Et favoriser :

• la rapidité

• la clarté

• la répartition équitable

• la satisfaction client

• et nos résultats

---

## 📘 Résumé ultra simple

✅ Je prends la carte Trello pour moi

✅ J'intègre la fiche client en Lagon

✅ Je reprends le devis

✅ J'appelle (3/2/1)`);
        setIsLoading(false);
      });
  }, []);

  // Fonction helper pour traiter le texte en gras (**texte**)
  const processBoldText = (text: string): (string | ReactElement)[] => {
    const parts: (string | ReactElement)[] = [];
    let lastIndex = 0;
    const regex = /\*\*([^*]+)\*\*/g;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      // Ajouter le texte avant le match
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      // Ajouter le texte en gras (sans les **)
      parts.push(
        <strong key={key++} className="font-semibold text-blue-700 dark:text-blue-300">
          {match[1]}
        </strong>
      );
      lastIndex = regex.lastIndex;
    }

    // Ajouter le texte restant
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    // Si aucun match, retourner le texte tel quel
    return parts.length > 0 ? parts : [text];
  };

  // Fonction pour parser le markdown basique
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: ReactElement[] = [];
    let currentList: string[] = [];
    let inList = false;
    let listType: "ul" | "ol" = "ul";
    let sectionType: "principle" | "process" | "forbidden" | "procedure" | "solution" | "paths" | "default" = "default";
    let skipUntil = -1; // Pour sauter les lignes déjà traitées (tableaux)

    lines.forEach((line, index) => {
      // Skip les lignes déjà traitées
      if (index < skipUntil) {
        return;
      }
      const trimmed = line.trim();

      // Détecter le type de section pour le style
      if (trimmed.includes("Principe fondamental")) {
        sectionType = "principle";
      } else if (trimmed.includes("2 chemins") || trimmed.includes("chemins pour les leads")) {
        sectionType = "paths"; // Nouveau type pour la section des 2 chemins
      } else if (trimmed.includes("Solution spécifique") || trimmed.includes("solution mise en place")) {
        sectionType = "solution";
      } else if (trimmed.includes("Notre processus") || trimmed.includes("prends un lead") || trimmed.includes("méthode")) {
        sectionType = "process";
      } else if (trimmed.includes("Ce qui n'est pas possible") || trimmed.includes("Interdictions") || trimmed.includes("jamais")) {
        sectionType = "forbidden";
      } else if (trimmed.includes("Procédure de prise en charge")) {
        sectionType = "procedure";
      }

      // Images
      if (trimmed.startsWith("![") && trimmed.includes("](")) {
        const match = trimmed.match(/!\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, alt, src] = match;
          
          // Vérifier si c'est une image de la timeline (gmail, trello, slack)
          const isTimelineImage = src.includes("gmail") || src.includes("trello") || src.includes("slack");
          
          // Si c'est une image de timeline, vérifier si les 2 prochaines lignes sont aussi des images de timeline
          if (isTimelineImage) {
            const nextLine1 = lines[index + 1]?.trim();
            const nextLine2 = lines[index + 2]?.trim();
            const nextMatch1 = nextLine1?.match(/!\[([^\]]+)\]\(([^)]+)\)/);
            const nextMatch2 = nextLine2?.match(/!\[([^\]]+)\]\(([^)]+)\)/);
            
            const isNext1Timeline = nextMatch1 && (nextMatch1[2].includes("gmail") || nextMatch1[2].includes("trello") || nextMatch1[2].includes("slack"));
            const isNext2Timeline = nextMatch2 && (nextMatch2[2].includes("gmail") || nextMatch2[2].includes("trello") || nextMatch2[2].includes("slack"));
            
            // Si on a 3 images de timeline consécutives, créer la timeline
            if (isNext1Timeline && isNext2Timeline) {
              // Fermer la liste si nécessaire
              if (inList) {
                elements.push(
                  listType === "ul" ? (
                    <Card key={`list-before-timeline-${index}`} className="mb-4 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                      <CardContent className="p-6">
                        <ul className="space-y-3">
                          {currentList.map((item, i) => {
                            const processText = (text: string) => {
                              const parts = text.split(/(❌|✅)/g);
                              return parts.map((part, j) => {
                                if (part === "❌") {
                                  return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                                }
                                if (part === "✅") {
                                  return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                                }
                                return <span key={j}>{processBoldText(part)}</span>;
                              });
                            };
                            return (
                              <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                                <span className="flex-1">{processText(item)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={`list-before-timeline-${index}`} className={cn(
                      "mb-4 border-2",
                      sectionType === "solution" && "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
                    )}>
                      <CardContent className="p-6">
                        <ol className="space-y-4">
                          {currentList.map((item, i) => {
                            const processText = (text: string) => {
                              const parts = text.split(/(❌|✅)/g);
                              return parts.map((part, j) => {
                                if (part === "❌") {
                                  return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                                }
                                if (part === "✅") {
                                  return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                                }
                                return <span key={j}>{processBoldText(part)}</span>;
                              });
                            };
                            
                            let appIcon = null;
                            if (sectionType === "solution") {
                              const itemLower = item.toLowerCase();
                              if (itemLower.includes("gmail") || itemLower.includes("mail")) {
                                appIcon = <GmailIcon className="h-6 w-6" />;
                              } else if (itemLower.includes("trello")) {
                                appIcon = <TrelloIcon className="h-6 w-6" />;
                              } else if (itemLower.includes("slack")) {
                                appIcon = <SlackIcon className="h-6 w-6" />;
                              }
                            }
                            
                            return (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                  "flex items-start gap-4 text-foreground leading-relaxed",
                                  sectionType === "solution" && "text-purple-900 dark:text-purple-100"
                                )}
                              >
                                {appIcon ? (
                                  <div className="mt-0.5 shrink-0">
                                    {appIcon}
                                  </div>
                                ) : (
                                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 min-w-[1.5rem]">
                                    {i + 1}.
                                  </span>
                                )}
                                <span className="flex-1">{processText(item)}</span>
                              </motion.li>
                            );
                          })}
                        </ol>
                      </CardContent>
                    </Card>
                  )
                );
                currentList = [];
                inList = false;
              }
              
              // Fermer la liste si nécessaire
              if (inList) {
                elements.push(
                  listType === "ul" ? (
                    <Card key={`list-before-timeline-${index}`} className="mb-4 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                      <CardContent className="p-6">
                        <ul className="space-y-3">
                          {currentList.map((item, i) => {
                            const processText = (text: string) => {
                              const parts = text.split(/(❌|✅)/g);
                              return parts.map((part, j) => {
                                if (part === "❌") {
                                  return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                                }
                                if (part === "✅") {
                                  return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                                }
                                return <span key={j}>{processBoldText(part)}</span>;
                              });
                            };
                            return (
                              <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                                <span className="flex-1">{processText(item)}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card key={`list-before-timeline-${index}`} className={cn(
                      "mb-4 border-2",
                      sectionType === "solution" && "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
                    )}>
                      <CardContent className="p-6">
                        <ol className="space-y-4">
                          {currentList.map((item, i) => {
                            const processText = (text: string) => {
                              const parts = text.split(/(❌|✅)/g);
                              return parts.map((part, j) => {
                                if (part === "❌") {
                                  return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                                }
                                if (part === "✅") {
                                  return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                                }
                                return <span key={j}>{processBoldText(part)}</span>;
                              });
                            };
                            
                            let appIcon = null;
                            if (sectionType === "solution") {
                              const itemLower = item.toLowerCase();
                              if (itemLower.includes("gmail") || itemLower.includes("mail")) {
                                appIcon = <GmailIcon className="h-6 w-6" />;
                              } else if (itemLower.includes("trello")) {
                                appIcon = <TrelloIcon className="h-6 w-6" />;
                              } else if (itemLower.includes("slack")) {
                                appIcon = <SlackIcon className="h-6 w-6" />;
                              }
                            }
                            
                            return (
                              <motion.li
                                key={i}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className={cn(
                                  "flex items-start gap-4 text-foreground leading-relaxed",
                                  sectionType === "solution" && "text-purple-900 dark:text-purple-100"
                                )}
                              >
                                {appIcon ? (
                                  <div className="mt-0.5 shrink-0">
                                    {appIcon}
                                  </div>
                                ) : (
                                  <span className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 min-w-[1.5rem]">
                                    {i + 1}.
                                  </span>
                                )}
                                <span className="flex-1">{processText(item)}</span>
                              </motion.li>
                            );
                          })}
                        </ol>
                      </CardContent>
                    </Card>
                  )
                );
                currentList = [];
                inList = false;
              }
              
              // Créer la timeline avec les 3 images et texte explicatif - ICÔNES RÉDUITES
              const timelineItems = [
                { 
                  name: "Gmail", 
                  icon: <GmailIcon className="h-4 w-4" />, 
                  color: "from-red-500 to-red-600", 
                  description: "Le mail arrive dans la boîte Gmail dédiée",
                  src: src 
                },
                { 
                  name: "Trello", 
                  icon: <TrelloIcon className="h-4 w-4" />, 
                  color: "from-blue-500 to-blue-600", 
                  description: "Création automatique d'une carte dans Trello / Entrée",
                  src: nextMatch1[2] 
                },
                { 
                  name: "Slack", 
                  icon: <SlackIcon className="h-4 w-4" />, 
                  color: "from-purple-500 to-purple-600", 
                  description: "Notification Slack : \"Qui le prend en charge ?\"",
                  src: nextMatch2[2] 
                },
              ];
              
              elements.push(
                <motion.div
                  key={`timeline-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="my-6"
                >
                  <Card className="border-2 bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-4">
                      <div className="relative flex items-start justify-between gap-3">
                        {timelineItems.map((item, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center relative z-10">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                              className={cn(
                                "p-2 rounded-md bg-gradient-to-br shadow-sm mb-2",
                                item.color
                              )}
                            >
                              <div className="text-white">
                                {item.icon}
                              </div>
                            </motion.div>
                            <p className="text-xs font-semibold text-foreground text-center mb-1">{item.name}</p>
                            <p className="text-[10px] text-muted-foreground text-center leading-tight px-0.5">
                              {item.description}
                            </p>
                            {i < timelineItems.length - 1 && (
                              <div 
                                className="absolute top-4 left-full w-full h-0.5 bg-gradient-to-r from-purple-300 to-purple-500 dark:from-purple-700 dark:to-purple-500 z-0"
                                style={{ width: 'calc(100% - 0.5rem)' }}
                              />
                            )}
                            {i < timelineItems.length - 1 && (
                              <div 
                                className="absolute top-3.5 left-full -translate-x-1/2 z-20"
                                style={{ left: 'calc(100% - 0.25rem)' }}
                              >
                                <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[6px] border-l-purple-500 dark:border-l-purple-400 border-b-[3px] border-b-transparent" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
              
              // Marquer les 2 prochaines lignes à sauter pour éviter d'afficher les images individuellement
              skipUntil = index + 3;
              return;
            }
          }
          
          // Si ce n'est pas une image de timeline ou pas dans un groupe de 3, traiter normalement
          // MAIS on ne doit JAMAIS afficher les images gmail/trello/slack individuellement
          if (src.includes("gmail") || src.includes("trello") || src.includes("slack")) {
            // Ignorer ces images - elles sont déjà dans la timeline
            return;
          }
          // Si on est dans une liste, on la ferme temporairement pour ajouter l'image
          // mais on garde l'état pour permettre la reprise
          let wasInList = false;
          let savedListType: "ul" | "ol" = "ul";
          let savedList: string[] = [];
          
          if (inList) {
            wasInList = true;
            savedListType = listType;
            savedList = [...currentList];
            // Fermer la liste actuelle
            elements.push(
              savedListType === "ul" ? (
                <Card key={`list-before-img-${index}`} className="mb-4 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                  <CardContent className="p-6">
                    <ul className="space-y-3">
                      {savedList.map((item, i) => {
                        const processText = (text: string) => {
                          const parts = text.split(/(❌)/g);
                          return parts.map((part, j) => {
                            if (part === "❌") {
                              return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                            }
                            return <span key={j}>{processBoldText(part)}</span>;
                          });
                        };
                        return (
                          <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                            <span className="flex-1">{processText(item)}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                <Card key={`list-before-img-${index}`} className={cn(
                  "mb-4 border-2",
                  sectionType === "solution" && "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
                )}>
                  <CardContent className="p-6">
                    <ol className="space-y-4">
                      {savedList.map((item, i) => {
                        const processText = (text: string) => {
                          const parts = text.split(/(❌)/g);
                          return parts.map((part, j) => {
                            if (part === "❌") {
                              return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                            }
                            return <span key={j}>{processBoldText(part)}</span>;
                          });
                        };
                        
                        let appIcon = null;
                        if (sectionType === "solution") {
                          const itemLower = item.toLowerCase();
                          if (itemLower.includes("gmail") || itemLower.includes("mail")) {
                            appIcon = <GmailIcon className="h-6 w-6" />;
                          } else if (itemLower.includes("trello")) {
                            appIcon = <TrelloIcon className="h-6 w-6" />;
                          } else if (itemLower.includes("slack")) {
                            appIcon = <SlackIcon className="h-6 w-6" />;
                          }
                        }
                        
                        return (
                          <motion.li
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "flex items-start gap-4 text-foreground leading-relaxed",
                              sectionType === "solution" && "text-purple-900 dark:text-purple-100"
                            )}
                          >
                            {appIcon ? (
                              <div className="mt-0.5 shrink-0">
                                {appIcon}
                              </div>
                            ) : (
                              <span className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 min-w-[1.5rem]">
                                {i + 1}.
                              </span>
                            )}
                            <span className="flex-1">{processText(item)}</span>
                          </motion.li>
                        );
                      })}
                    </ol>
                  </CardContent>
                </Card>
              )
            );
            currentList = [];
            inList = false;
          }
          
          // Image reload : plus petite
          const isReload = src.includes("reload");
          // Pour les images de la section Solution (gmail, trello, slack), utiliser une taille réduite
          const isSolutionImage = src.includes("gmail") || src.includes("trello") || src.includes("slack");
          const imageWidth = isReload ? 200 : isSolutionImage ? 400 : 1200;
          const imageHeight = isReload ? 200 : isSolutionImage ? 300 : 600;
          
          elements.push(
            <motion.div
              key={`img-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "my-6 flex justify-center",
                isReload && "my-4",
                isSolutionImage && "my-4"
              )}
            >
              <div className={cn(
                "relative rounded-xl border-2 shadow-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4",
                isReload ? "w-fit" : isSolutionImage ? "w-fit max-w-md" : "w-full max-w-4xl"
              )}>
                <Image
                  src={src}
                  alt={alt}
                  width={imageWidth}
                  height={imageHeight}
                  className={cn(
                    "rounded-lg h-auto object-contain",
                    isReload && "w-48 h-auto",
                    isSolutionImage && "w-80 h-auto"
                  )}
                  unoptimized
                />
              </div>
            </motion.div>
          );
          
          // Note: On ne reprend pas la liste automatiquement après l'image
          // car le prochain élément de liste créera une nouvelle liste
        }
        return;
      }

      // Titres
      if (trimmed.startsWith("# ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-4">
              {currentList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        elements.push(
          <motion.h1
            key={`h1-${index}`}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mt-8 mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent"
          >
            {trimmed.substring(2)}
          </motion.h1>
        );
        return;
      }

      if (trimmed.startsWith("## ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-4">
              {currentList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        const title = trimmed.substring(3);
        let icon = null;
        if (title.includes("Objectif")) icon = <Target className="h-6 w-6" />;
        else if (title.includes("chemins") || title.includes("chemin")) icon = <Route className="h-6 w-6" />;
        else if (title.includes("Allianz")) icon = <Building2 className="h-6 w-6" />;
        else if (title.includes("solution") || title.includes("Solution")) icon = <Zap className="h-6 w-6" />;
        else if (title.includes("prends un lead") || title.includes("méthode")) icon = <ListChecks className="h-6 w-6" />;
        else if (title.includes("jamais") || title.includes("ne doit")) icon = <Ban className="h-6 w-6" />;
        else if (title.includes("Pourquoi") || title.includes("règles")) icon = <Lightbulb className="h-6 w-6" />;
        else if (title.includes("Résumé")) icon = <Sparkles className="h-6 w-6" />;
        else if (title.includes("Principe")) icon = <Users className="h-6 w-6" />;
        else if (title.includes("Réception")) icon = <Mail className="h-6 w-6" />;
        else if (title.includes("Information") || title.includes("Lagon")) icon = <RefreshCw className="h-6 w-6" />;
        else if (title.includes("processus")) icon = <CheckCircle2 className="h-6 w-6" />;
        else if (title.includes("possible") || title.includes("Interdictions")) icon = <AlertCircle className="h-6 w-6" />;
        else if (title.includes("Procédure")) icon = <Phone className="h-6 w-6" />;
        
        elements.push(
          <motion.div
            key={`h2-${index}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-8 mb-4"
          >
            <Card className="border-2 bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 dark:from-blue-950/20 dark:via-purple-950/20 dark:to-pink-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  {icon && (
                    <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg">
                      {icon}
                    </div>
                  )}
                  <h2 className="text-2xl font-bold text-foreground">
                    {title}
                  </h2>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
        return;
      }

      if (trimmed.startsWith("### ")) {
        if (inList) {
          elements.push(
            <ul key={`list-${index}`} className="list-disc list-inside space-y-1 mb-4">
              {currentList.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          );
          currentList = [];
          inList = false;
        }
        
        const h3Title = trimmed.substring(4);
        let h3Icon = null;
        if (h3Title.includes("Inconvénients")) h3Icon = <AlertCircle className="h-5 w-5 text-orange-500" />;
        else if (h3Title.includes("Méthode") || h3Title.includes("étapes")) h3Icon = <ListChecks className="h-5 w-5 text-blue-500" />;
        else if (h3Title.includes("Plan d'appel") || h3Title.includes("appel")) h3Icon = <Phone className="h-5 w-5 text-green-500" />;
        else if (h3Title.includes("Via les mails") || h3Title.includes("mails")) h3Icon = <Mail className="h-5 w-5 text-red-500" />;
        else if (h3Title.includes("Via Allianz") || h3Title.includes("Lagon")) h3Icon = <RefreshCw className="h-5 w-5 text-blue-500" />;
        else if (h3Title.includes("Trello")) h3Icon = <TrelloIcon className="h-5 w-5" />;
        else if (h3Title.includes("Slack")) h3Icon = <SlackIcon className="h-5 w-5" />;
        
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-semibold mt-6 mb-3 text-foreground flex items-center gap-3">
            {h3Icon && (
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30">
                {h3Icon}
              </div>
            )}
            {!h3Icon && <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />}
            <span>{h3Title}</span>
          </h3>
        );
        return;
      }

      // Listes
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ") || trimmed.startsWith("• ")) {
        if (!inList) {
          inList = true;
          listType = "ul";
        }
        currentList.push(trimmed.replace(/^[-*•]\s+/, ""));
        return;
      }

      if (trimmed.match(/^\d+\. /)) {
        if (!inList) {
          inList = true;
          listType = "ol";
        }
        currentList.push(trimmed.replace(/^\d+\. /, ""));
        return;
      }

      // Fermer la liste si on change de type
      if (inList && trimmed !== "") {
        const isProcessList = sectionType === "process";
        const isForbiddenList = sectionType === "forbidden";
        const isProcedureList = sectionType === "procedure";
        const isSolutionList = sectionType === "solution";
        const isPathsList = sectionType === "paths";
        
        elements.push(
          listType === "ul" ? (
            <Card
              key={`list-${index}`}
              className={cn(
                "mb-6 border-2",
                isProcessList && "bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800",
                isForbiddenList && "bg-gradient-to-br from-red-50/50 to-rose-50/50 dark:from-red-950/20 dark:to-rose-950/20 border-red-200 dark:border-red-800",
                isProcedureList && "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
                isSolutionList && "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800",
                isPathsList && "bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/20 dark:to-blue-950/20 border-indigo-200 dark:border-indigo-800",
                !isProcessList && !isForbiddenList && !isProcedureList && !isSolutionList && !isPathsList && "bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800"
              )}
            >
              <CardContent className="p-6">
                <ul className="space-y-3">
                  {currentList.map((item, i) => {
                    const processText = (text: string) => {
                      // Traiter les emojis ❌ d'abord
                      const parts = text.split(/(❌)/g);
                      return parts.map((part, j) => {
                        if (part === "❌") {
                          return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                        }
                        // Traiter le texte en gras
                        return <span key={j}>{processBoldText(part)}</span>;
                      });
                    };
                    // Déterminer l'icône pour les listes à puces selon le contenu
                    let bulletIcon = null;
                    const itemLower = item.toLowerCase();
                    
                    if (isProcessList) {
                      bulletIcon = <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />;
                    } else if (isForbiddenList) {
                      bulletIcon = <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />;
                    } else if (isPathsList) {
                      // Pour la section "2 chemins", utiliser la même icône Route pour tous les éléments
                      bulletIcon = <Route className="h-4 w-4 text-indigo-500 dark:text-indigo-400 mt-1.5 shrink-0" />;
                    } else {
                      // Icônes contextuelles selon le contenu
                      if (itemLower.includes("rapide") || itemLower.includes("temps") || itemLower.includes("efficacité")) {
                        bulletIcon = <Zap className="h-4 w-4 text-yellow-500 dark:text-yellow-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("tuyau") || itemLower.includes("colonne") || itemLower.includes("carte")) {
                        bulletIcon = <ArrowRight className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("éviter") || itemLower.includes("perte")) {
                        bulletIcon = <Shield className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("mail") || itemLower.includes("gmail")) {
                        bulletIcon = <Mail className="h-4 w-4 text-red-500 dark:text-red-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("lagon") || itemLower.includes("reload") || itemLower.includes("recharge")) {
                        bulletIcon = <RefreshCw className="h-4 w-4 text-blue-500 dark:text-blue-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("dynamique") || itemLower.includes("penser") || itemLower.includes("nombreux")) {
                        bulletIcon = <Clock className="h-4 w-4 text-purple-500 dark:text-purple-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("trello") || itemLower.includes("tableau")) {
                        bulletIcon = <TrelloIcon className="h-4 w-4" />;
                      } else if (itemLower.includes("slack") || itemLower.includes("informé")) {
                        bulletIcon = <SlackIcon className="h-4 w-4" />;
                      } else if (itemLower.includes("doublons") || itemLower.includes("oublis") || itemLower.includes("confusion")) {
                        bulletIcon = <AlertCircle className="h-4 w-4 text-orange-500 dark:text-orange-400 mt-1.5 shrink-0" />;
                      } else if (itemLower.includes("rapidité") || itemLower.includes("clarté") || itemLower.includes("satisfaction") || itemLower.includes("résultats")) {
                        bulletIcon = <TrendingUp className="h-4 w-4 text-green-500 dark:text-green-400 mt-1.5 shrink-0" />;
                      }
                    }
                    
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-start gap-3 text-foreground leading-relaxed",
                          isProcessList && "text-green-900 dark:text-green-100",
                          isForbiddenList && "text-red-900 dark:text-red-100"
                        )}
                      >
                        {bulletIcon || (
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                        )}
                        <span className="flex-1">{processText(item)}</span>
                      </motion.li>
                    );
                  })}
                </ul>
              </CardContent>
            </Card>
          ) : (
            <Card
              key={`list-${index}`}
              className={cn(
                "mb-6 border-2",
                isProcedureList && "bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800",
                isSolutionList && "bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-purple-950/20 dark:to-pink-950/20 border-purple-200 dark:border-purple-800"
              )}
            >
              <CardContent className="p-6">
                <ol className="space-y-4">
                  {currentList.map((item, i) => {
                    const processText = (text: string) => {
                      // Traiter les emojis ❌ d'abord
                      const parts = text.split(/(❌)/g);
                      return parts.map((part, j) => {
                        if (part === "❌") {
                          return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                        }
                        // Traiter le texte en gras
                        return <span key={j}>{processBoldText(part)}</span>;
                      });
                    };
                    
                    // Déterminer l'icône selon le contenu
                    let stepIcon = null;
                    const itemLower = item.toLowerCase();
                    
                    if (isSolutionList) {
                      if (itemLower.includes("gmail") || itemLower.includes("mail")) {
                        stepIcon = <GmailIcon className="h-6 w-6" />;
                      } else if (itemLower.includes("trello")) {
                        stepIcon = <TrelloIcon className="h-6 w-6" />;
                      } else if (itemLower.includes("slack")) {
                        stepIcon = <SlackIcon className="h-6 w-6" />;
                      }
                    } else if (sectionType === "process" || sectionType === "procedure") {
                      // Icônes pour les étapes de la méthode
                      if (itemLower.includes("prends la carte") || itemLower.includes("carte trello")) {
                        stepIcon = <TrelloIcon className="h-6 w-6" />;
                      } else if (itemLower.includes("créer la fiche") || itemLower.includes("intègre") || itemLower.includes("fiche client") || itemLower.includes("lagon")) {
                        stepIcon = <UserPlus className="h-6 w-6" />;
                      } else if (itemLower.includes("gérer le devis") || itemLower.includes("reprends le devis") || itemLower.includes("devis")) {
                        stepIcon = <FileText className="h-6 w-6" />;
                      } else if (itemLower.includes("téléphoner") || itemLower.includes("appelle") || itemLower.includes("appel")) {
                        stepIcon = <Phone className="h-6 w-6" />;
                      }
                    }
                    
                    // Si pas d'icône spécifique, utiliser un badge numéroté avec icône par défaut
                    const defaultStepIcon = !stepIcon ? (
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 text-white font-bold text-sm shadow-lg">
                        {i + 1}
                      </div>
                    ) : null;
                    
                    return (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={cn(
                          "flex items-start gap-4 text-foreground leading-relaxed",
                          isSolutionList && "text-purple-900 dark:text-purple-100",
                          (sectionType === "process" || sectionType === "procedure") && "text-blue-900 dark:text-blue-100"
                        )}
                      >
                        {stepIcon ? (
                          <div className="mt-0.5 shrink-0 p-2 rounded-lg bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border border-blue-200 dark:border-blue-800">
                            {stepIcon}
                          </div>
                        ) : defaultStepIcon ? (
                          defaultStepIcon
                        ) : (
                          <span className="text-lg font-semibold text-purple-600 dark:text-purple-400 mt-0.5 shrink-0 min-w-[1.5rem]">
                            {i + 1}.
                          </span>
                        )}
                        <span className="flex-1">{processText(item)}</span>
                      </motion.li>
                    );
                  })}
                </ol>
              </CardContent>
            </Card>
          )
        );
        currentList = [];
        inList = false;
      }

      // Lignes horizontales
      if (trimmed.match(/^---+$/)) {
        if (inList) {
          elements.push(
            listType === "ul" ? (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                          <span className="flex-1">{processText(item)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ol className="space-y-3 list-decimal list-inside">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="text-foreground leading-relaxed">
                          {processText(item)}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            )
          );
          currentList = [];
          inList = false;
        }
        elements.push(
          <hr key={`hr-${index}`} className="my-8 border-t-2 border-gradient-to-r from-blue-200 via-purple-200 to-blue-200 dark:from-blue-800 dark:via-purple-800 dark:to-blue-800" />
        );
        return;
      }

      // Blockquotes
      if (trimmed.startsWith("> ")) {
        if (inList) {
          elements.push(
            listType === "ul" ? (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                          <span className="flex-1">{processText(item)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ol className="space-y-3 list-decimal list-inside">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="text-foreground leading-relaxed">
                          {processText(item)}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            )
          );
          currentList = [];
          inList = false;
        }
        const quoteText = trimmed.substring(2);
        elements.push(
          <Card key={`blockquote-${index}`} className="my-6 border-l-4 border-blue-500 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
            <CardContent className="p-4 pl-6">
              <p className="text-foreground italic leading-relaxed">
                {processBoldText(quoteText)}
              </p>
            </CardContent>
          </Card>
        );
        return;
      }

      // Tableaux
      if (trimmed.includes("|") && trimmed.split("|").length >= 3) {
        if (inList) {
          elements.push(
            listType === "ul" ? (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                          <span className="flex-1">{processText(item)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ol className="space-y-3 list-decimal list-inside">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        const parts = text.split(/(❌|✅)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          if (part === "✅") {
                            return <span key={j} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
                          }
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="text-foreground leading-relaxed">
                          {processText(item)}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            )
          );
          currentList = [];
          inList = false;
        }
        
        // Collecter toutes les lignes du tableau
        const tableLines: string[] = [trimmed];
        let tableIndex = index + 1;
        while (tableIndex < lines.length) {
          const nextLine = lines[tableIndex]?.trim();
          if (nextLine && nextLine.includes("|") && nextLine.split("|").length >= 3) {
            tableLines.push(nextLine);
            tableIndex++;
          } else if (nextLine && nextLine.match(/^[\s|-]+$/)) {
            // Ligne de séparation du tableau (ignorée)
            tableIndex++;
          } else {
            break;
          }
        }
        
        // Parser le tableau
        const headers = tableLines[0].split("|").map(h => h.trim()).filter(h => h);
        const rows = tableLines.slice(1).filter(line => !line.match(/^[\s|-]+$/)).map(line => 
          line.split("|").map(cell => cell.trim()).filter(cell => cell)
        );
        
        elements.push(
          <Card key={`table-${index}`} className="my-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6 overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-slate-300 dark:border-slate-700">
                    {headers.map((header, i) => (
                      <th key={i} className="px-4 py-2 text-left font-semibold text-foreground">
                        {processBoldText(header)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i} className="border-b border-slate-200 dark:border-slate-800">
                      {row.map((cell, j) => (
                        <td key={j} className="px-4 py-2 text-foreground">
                          {processBoldText(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        );
        
        // Marquer les lignes à sauter
        skipUntil = tableIndex;
        return;
      }

      // Paragraphes
      if (trimmed !== "" && !trimmed.startsWith("#") && !trimmed.startsWith("!") && !trimmed.startsWith(">") && !trimmed.includes("|")) {
        if (inList) {
          elements.push(
            listType === "ul" ? (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ul className="space-y-3">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        // Traiter les emojis ❌ d'abord
                        const parts = text.split(/(❌)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          // Traiter le texte en gras
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                          <span className="flex-1">{processText(item)}</span>
                        </li>
                      );
                    })}
                  </ul>
                </CardContent>
              </Card>
            ) : (
              <Card key={`list-${index}`} className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
                <CardContent className="p-6">
                  <ol className="space-y-3 list-decimal list-inside">
                    {currentList.map((item, i) => {
                      const processText = (text: string) => {
                        // Traiter les emojis ❌ d'abord
                        const parts = text.split(/(❌)/g);
                        return parts.map((part, j) => {
                          if (part === "❌") {
                            return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                          }
                          // Traiter le texte en gras
                          return <span key={j}>{processBoldText(part)}</span>;
                        });
                      };
                      return (
                        <li key={i} className="text-foreground leading-relaxed">
                          {processText(item)}
                        </li>
                      );
                    })}
                  </ol>
                </CardContent>
              </Card>
            )
          );
          currentList = [];
          inList = false;
        }

        // Gérer le texte en gras et emojis
        const processedText = (() => {
          const parts = trimmed.split(/(❌|✅)/g);
          return parts.map((part, i) => {
            if (part === "❌") {
              return <span key={i} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
            }
            if (part === "✅") {
              return <span key={i} className="text-green-600 dark:text-green-400 text-xl">{part}</span>;
            }
            return <span key={i}>{processBoldText(part)}</span>;
          });
        })();

        elements.push(
          <motion.p
            key={`p-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mb-6 text-foreground leading-relaxed text-lg"
          >
            {processedText}
          </motion.p>
        );
      }

      // Ligne vide
      if (trimmed === "" && !inList) {
        // Ne rien faire, les marges CSS gèrent l'espacement
      }
    });

    // Fermer la dernière liste si nécessaire
    if (inList) {
      elements.push(
        listType === "ul" ? (
          <Card key="list-final" className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <ul className="space-y-3">
                {currentList.map((item, i) => {
                  const processText = (text: string) => {
                    // Traiter les emojis ❌ d'abord
                    const parts = text.split(/(❌)/g);
                    return parts.map((part, j) => {
                      if (part === "❌") {
                        return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                      }
                      // Traiter le texte en gras
                      return <span key={j}>{processBoldText(part)}</span>;
                    });
                  };
                  return (
                    <li key={i} className="flex items-start gap-3 text-foreground leading-relaxed">
                      <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
                      <span className="flex-1">{processText(item)}</span>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ) : (
          <Card key="list-final" className="mb-6 border-2 bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800">
            <CardContent className="p-6">
              <ol className="space-y-3 list-decimal list-inside">
                {currentList.map((item, i) => {
                  const processText = (text: string) => {
                    // Traiter les emojis ❌ d'abord
                    const parts = text.split(/(❌)/g);
                    return parts.map((part, j) => {
                      if (part === "❌") {
                        return <span key={j} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
                      }
                      // Traiter le texte en gras
                      return <span key={j}>{processBoldText(part)}</span>;
                    });
                  };
                  return (
                    <li key={i} className="text-foreground leading-relaxed">
                      {processText(item)}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        )
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4"
      >
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/process")}
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestion des Leads
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Processus de coordination pour la gestion des leads
          </p>
        </div>
      </motion.div>

      {/* Contenu */}
      {isLoading ? (
        <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
          <CardContent className="p-12">
            <div className="text-center text-muted-foreground">Chargement...</div>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {parseMarkdown(content)}
        </motion.div>
      )}
    </div>
  );
}
