"use client";

import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Users, Mail, RefreshCw, AlertCircle, CheckCircle2, Phone, MessageSquare } from "lucide-react";
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
        setContent(`# Travailler ensemble avec les leads

## Principe fondamental

Personne ne travaille seul à l'agence et nous sommes efficaces "ensemble" seulement si nous travaillons de manière coordonnée, en appliquant les mêmes règles.

## Réception des leads

Tous les leads arrivent par mail.

## Information Allianz via Lagon

Il y a déjà une information Allianz qui n'est pas dynamique mais qui existe.

### Accès à l'information via Lagon

On a l'information via Lagon :

![Interface Lagon - Opportunités commerciales](/leads/info-lagon.PNG)

### Mise à jour de Lagon

Pour mettre à jour Lagon car l'image affichée est "fixe", il faut faire un reload :

![Bouton de reload](/leads/reload.PNG)

### Limites de cette méthode

- Il faut en permanence penser à "regarder" Lagon
- Il faut en permanence faire du "reload"

## Solution spécifique à l'agence

Pour rappeler les clients le plus rapidement possible dès l'arrivée du Leads, on a mis en place une solution spécifique à l'agence :

1. Tous les mails relatifs aux Leads arrivent "en même temps" sur une b@l Gmail

![Gmail - Boîte de réception](/leads/gmail.webp)

2. Ils sont "routés" vers le tableau Trello / Leads dans la colonne Trello

![Trello - Tableau Leads](/leads/trello.png)

3. Un message Slack est envoyé immédiatement : "Qui le prend en charge ?"

![Slack - Notification](/leads/slack.png)

## Notre processus

Quelque soit la manière dont vous avez l'information sur le leads à exploiter (Système compagnie ou système agence), il faut :

1. **Récupérer la carte Trello** et la mettre dans votre colonne
2. **Intégrer la fiche client depuis Lagon** pour récupérer le devis
3. **Reprendre le devis**
4. **Prendre contact avec le client**

## Ce qui n'est pas possible

### Interdictions

- ❌ Prendre contact avec le client sans avoir intégré la fiche Lagon
- ❌ Prendre contact avec le client sans avoir transféré la carte Trello de la colonne "entrée" à "sa propre" colonne, celle qui est à votre nom

### Pourquoi ces règles ?

On travaille ensemble :

- Si on est 10 à se connecter sur le Trello, on va être 10 à passer en revue toutes les entrées pour savoir ce qui a été fait ou pas
- Si on laisse le client "à intégrer" en Lagon, celui qui arrive derrière ne sait pas ce qui a été fait ou non

## Procédure de prise en charge d'un lead

### À faire quand je prends un leads

1. **Téléphoner avec un portable**
2. **Planification des appels** :
   - 3 appels le premier jour
   - 2 appels le deuxième jour
   - 1 appel le 3ème jour
3. **SMS à chaque fois** (après chaque appel)`);
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
    let sectionType: "principle" | "process" | "forbidden" | "procedure" | "solution" | "default" = "default";

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Détecter le type de section pour le style
      if (trimmed.includes("Principe fondamental")) {
        sectionType = "principle";
      } else if (trimmed.includes("Solution spécifique")) {
        sectionType = "solution";
      } else if (trimmed.includes("Notre processus")) {
        sectionType = "process";
      } else if (trimmed.includes("Ce qui n'est pas possible") || trimmed.includes("Interdictions")) {
        sectionType = "forbidden";
      } else if (trimmed.includes("Procédure de prise en charge")) {
        sectionType = "procedure";
      }

      // Images
      if (trimmed.startsWith("![") && trimmed.includes("](")) {
        const match = trimmed.match(/!\[([^\]]+)\]\(([^)]+)\)/);
        if (match) {
          const [, alt, src] = match;
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
          
          // Image reload : plus petite
          const isReload = src.includes("reload");
          const imageWidth = isReload ? 200 : 1200;
          const imageHeight = isReload ? 200 : 600;
          
          elements.push(
            <motion.div
              key={`img-${index}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "my-6 flex justify-center",
                isReload && "my-4"
              )}
            >
              <div className={cn(
                "relative rounded-xl border-2 shadow-xl overflow-hidden bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 p-4",
                isReload ? "w-fit" : "w-full max-w-4xl"
              )}>
                <Image
                  src={src}
                  alt={alt}
                  width={imageWidth}
                  height={imageHeight}
                  className={cn(
                    "rounded-lg w-full h-auto",
                    isReload && "w-48 h-auto"
                  )}
                  unoptimized
                />
              </div>
            </motion.div>
          );
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
        if (title.includes("Principe")) icon = <Users className="h-6 w-6" />;
        else if (title.includes("Réception")) icon = <Mail className="h-6 w-6" />;
        else if (title.includes("Information") || title.includes("Lagon")) icon = <RefreshCw className="h-6 w-6" />;
        else if (title.includes("Solution")) icon = <CheckCircle2 className="h-6 w-6" />;
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
        elements.push(
          <h3 key={`h3-${index}`} className="text-xl font-semibold mt-6 mb-3 text-foreground flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
            {trimmed.substring(4)}
          </h3>
        );
        return;
      }

      // Listes
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          inList = true;
          listType = "ul";
        }
        currentList.push(trimmed.substring(2));
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
                !isProcessList && !isForbiddenList && !isProcedureList && !isSolutionList && "bg-gradient-to-br from-slate-50/50 to-gray-50/50 dark:from-slate-900/20 dark:to-gray-900/20 border-slate-200 dark:border-slate-800"
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
                        {isProcessList ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                        ) : isForbiddenList ? (
                          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                        ) : (
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
                    
                    // Déterminer l'icône pour la section Solution
                    let appIcon = null;
                    if (isSolutionList) {
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
                          isSolutionList && "text-purple-900 dark:text-purple-100"
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

      // Paragraphes
      if (trimmed !== "" && !trimmed.startsWith("#") && !trimmed.startsWith("!")) {
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
          const parts = trimmed.split(/(❌)/g);
          return parts.map((part, i) => {
            if (part === "❌") {
              return <span key={i} className="text-red-600 dark:text-red-400 text-xl">{part}</span>;
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
            Gestion des leads
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
