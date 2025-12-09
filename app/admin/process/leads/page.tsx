"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { cn } from "@/lib/utils";

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
2. Ils sont "routés" vers le tableau Trello / Leads dans la colonne Trello
3. Un message Slack est envoyé immédiatement : "Qui le prend en charge ?"

## Notre processus

Quelque soit la manière dont vous avez l'information sur le leads à exploiter (Système compagnie ou système agence), il faut :

1. **Récupérer la carte Trello** et la mettre dans votre colonne
2. **Intégrer la fiche client depuis Lagon** pour récupérer le devis
3. **Reprendre le devis**
4. **Prendre contact avec le client**

## Ce qui n'est pas possible

### Interdictions

- ❌ Prendre contact avec le client sans avoir intégré la fiche Lagon
- ❌ Prendre contact avec le client et ne pas avoir transféré la fiche client dans sa colonne

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

  // Fonction pour parser le markdown basique
  const parseMarkdown = (text: string) => {
    const lines = text.split("\n");
    const elements: JSX.Element[] = [];
    let currentList: string[] = [];
    let inList = false;
    let listType: "ul" | "ol" = "ul";

    lines.forEach((line, index) => {
      const trimmed = line.trim();

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
          elements.push(
            <div key={`img-${index}`} className="my-6 flex justify-center">
              <div className="relative w-full max-w-4xl">
                <Image
                  src={src}
                  alt={alt}
                  width={1200}
                  height={600}
                  className="rounded-lg border shadow-lg w-full h-auto"
                  unoptimized
                />
              </div>
            </div>
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
          <h1 key={`h1-${index}`} className="text-3xl font-bold mt-8 mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            {trimmed.substring(2)}
          </h1>
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
        elements.push(
          <h2 key={`h2-${index}`} className="text-2xl font-semibold mt-6 mb-3 text-foreground">
            {trimmed.substring(3)}
          </h2>
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
          <h3 key={`h3-${index}`} className="text-xl font-semibold mt-4 mb-2 text-foreground">
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
        // Garder le formatage en gras
        currentList.push(trimmed.substring(2));
        return;
      }

      if (trimmed.match(/^\d+\. /)) {
        if (!inList) {
          inList = true;
          listType = "ol";
        }
        // Garder le formatage en gras
        currentList.push(trimmed.replace(/^\d+\. /, ""));
        return;
      }

      // Fermer la liste si on change de type
      if (inList && trimmed !== "") {
        elements.push(
          listType === "ul" ? (
            <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4 ml-4">
              {currentList.map((item, i) => (
                <li key={i} className="text-foreground">
                  {item.includes("**") ? (
                    <span>
                      {item.split(/(\*\*[^*]+\*\*)/g).map((part, j) =>
                        part.startsWith("**") && part.endsWith("**") ? (
                          <strong key={j}>{part.slice(2, -2)}</strong>
                        ) : (
                          part
                        )
                      )}
                    </span>
                  ) : (
                    item
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <ol key={`list-${index}`} className="list-decimal list-inside space-y-2 mb-4 ml-4">
              {currentList.map((item, i) => {
                const processText = (text: string) => {
                  return text.split(/(\*\*[^*]+\*\*|❌)/g).map((part, j) => {
                    if (part.startsWith("**") && part.endsWith("**")) {
                      return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                    }
                    if (part === "❌") {
                      return <span key={j} className="text-red-600 dark:text-red-400">{part}</span>;
                    }
                    return part;
                  });
                };
                return (
                  <li key={i} className="text-foreground">
                    {processText(item)}
                  </li>
                );
              })}
            </ol>
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
              <ul key={`list-${index}`} className="list-disc list-inside space-y-2 mb-4 ml-4">
                {currentList.map((item, i) => {
                  const processText = (text: string) => {
                    return text.split(/(\*\*[^*]+\*\*|❌)/g).map((part, j) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      if (part === "❌") {
                        return <span key={j} className="text-red-600 dark:text-red-400">{part}</span>;
                      }
                      return part;
                    });
                  };
                  return (
                    <li key={i} className="text-foreground">
                      {processText(item)}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <ol key={`list-${index}`} className="list-decimal list-inside space-y-2 mb-4 ml-4">
                {currentList.map((item, i) => {
                  const processText = (text: string) => {
                    return text.split(/(\*\*[^*]+\*\*|❌)/g).map((part, j) => {
                      if (part.startsWith("**") && part.endsWith("**")) {
                        return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                      }
                      if (part === "❌") {
                        return <span key={j} className="text-red-600 dark:text-red-400">{part}</span>;
                      }
                      return part;
                    });
                  };
                  return (
                    <li key={i} className="text-foreground">
                      {processText(item)}
                    </li>
                  );
                })}
              </ol>
            )
          );
          currentList = [];
          inList = false;
        }

        // Gérer le texte en gras et emojis
        const processedText = trimmed.split(/(\*\*[^*]+\*\*|❌)/g).map((part, i) => {
          if (part.startsWith("**") && part.endsWith("**")) {
            return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
          }
          if (part === "❌") {
            return <span key={i} className="text-red-600 dark:text-red-400">{part}</span>;
          }
          return part;
        });

        elements.push(
          <p key={`p-${index}`} className="mb-4 text-foreground leading-relaxed">
            {processedText}
          </p>
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
          <ul key="list-final" className="list-disc list-inside space-y-2 mb-4 ml-4">
            {currentList.map((item, i) => {
              const processText = (text: string) => {
                return text.split(/(\*\*[^*]+\*\*|❌)/g).map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  if (part === "❌") {
                    return <span key={j} className="text-red-600 dark:text-red-400">{part}</span>;
                  }
                  return part;
                });
              };
              return (
                <li key={i} className="text-foreground">
                  {processText(item)}
                </li>
              );
            })}
          </ul>
        ) : (
          <ol key="list-final" className="list-decimal list-inside space-y-2 mb-4 ml-4">
            {currentList.map((item, i) => {
              const processText = (text: string) => {
                return text.split(/(\*\*[^*]+\*\*|❌)/g).map((part, j) => {
                  if (part.startsWith("**") && part.endsWith("**")) {
                    return <strong key={j} className="font-semibold">{part.slice(2, -2)}</strong>;
                  }
                  if (part === "❌") {
                    return <span key={j} className="text-red-600 dark:text-red-400">{part}</span>;
                  }
                  return part;
                });
              };
              return (
                <li key={i} className="text-foreground">
                  {processText(item)}
                </li>
              );
            })}
          </ol>
        )
      );
    }

    return elements;
  };

  return (
    <div className="space-y-6">
      {/* Header avec bouton retour */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/admin/process")}
          className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
            Gestion des leads
          </h1>
          <p className="text-muted-foreground mt-2">
            Processus de coordination pour la gestion des leads
          </p>
        </div>
      </div>

      {/* Contenu */}
      {isLoading ? (
        <Card>
          <CardContent className="p-8">
            <div className="text-center text-muted-foreground">Chargement...</div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardContent className="p-8 prose prose-slate dark:prose-invert max-w-none">
            {parseMarkdown(content)}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
