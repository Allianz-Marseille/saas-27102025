"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target, Route, AlertCircle, CheckCircle2, Phone, Zap, Lightbulb, Sparkles, FileText, Users, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import DecryptedText from "@/components/DecryptedText";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import Image from "next/image";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { Components } from "react-markdown";
import type { HTMLAttributes } from "react";

// Mapping des classes de section vers les gradients Tailwind
const getSectionGradient = (className: string | undefined): string => {
  if (!className) return "";
  
  if (className.includes("section-enjeux")) {
    return "bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 border-blue-200 dark:border-blue-800";
  }
  if (className.includes("section-chemins")) {
    return "bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-950/20 dark:to-purple-950/20 border-indigo-200 dark:border-indigo-800";
  }
  if (className.includes("section-limitations")) {
    return "bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 border-red-200 dark:border-red-800";
  }
  if (className.includes("section-solution")) {
    return "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 border-green-200 dark:border-green-800";
  }
  if (className.includes("section-appels")) {
    return "bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/20 dark:to-sky-950/20 border-blue-200 dark:border-blue-800";
  }
  if (className.includes("section-interdictions")) {
    return "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-950/20 dark:to-pink-950/20 border-red-200 dark:border-red-800";
  }
  if (className.includes("section-raisons")) {
    return "bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-950/20 dark:to-blue-950/20 border-cyan-200 dark:border-cyan-800";
  }
  if (className.includes("section-resume")) {
    return "bg-gradient-to-br from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 border-green-200 dark:border-green-800";
  }
  return "";
};

// Fonction pour extraire la largeur depuis les attributs d'image
const extractImageWidth = (src: string): number | undefined => {
  const match = src.match(/\{width=(\d+)\}/);
  return match ? parseInt(match[1], 10) : undefined;
};

// Fonction pour nettoyer le src de l'image
const cleanImageSrc = (src: string): string => {
  return src.replace(/\{width=\d+\}/g, "");
};

// Fonction pour obtenir l'icône selon le titre
const getTitleIcon = (text: string) => {
  const lowerText = text.toLowerCase();
  if (lowerText.includes("enjeux") || lowerText.includes("objectif") || lowerText.includes("quand et comment")) {
    return <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  }
  if (lowerText.includes("clés") || lowerText.includes("répartition") || lowerText.includes("chemins") || lowerText.includes("chemin")) {
    return <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />;
  }
  if (lowerText.includes("inconvénients") || lowerText.includes("limitations") || lowerText.includes("évolutions")) {
    return <RefreshCw className="h-5 w-5 text-orange-600 dark:text-orange-400" />;
  }
  if (lowerText.includes("solution") || lowerText.includes("volume") || lowerText.includes("gestion")) {
    return <Zap className="h-5 w-5 text-green-600 dark:text-green-400" />;
  }
  if (lowerText.includes("appel") || lowerText.includes("appels") || lowerText.includes("travail") || lowerText.includes("équipe")) {
    return <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />;
  }
  if (lowerText.includes("interdictions") || lowerText.includes("jamais") || lowerText.includes("obligations")) {
    return <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />;
  }
  if (lowerText.includes("pourquoi") || lowerText.includes("raisons") || lowerText.includes("santé")) {
    return <Lightbulb className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />;
  }
  if (lowerText.includes("résumé") || lowerText.includes("resume")) {
    return <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400" />;
  }
  return null;
};

export default function DeclarationAffairesProcessPage() {
  const router = useRouter();
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/process/declaration-affaires")
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          setError(data.error);
        } else {
          setContent(data.content || "");
        }
        setIsLoading(false);
      })
      .catch((err) => {
        setError("Erreur lors du chargement du contenu");
        setIsLoading(false);
        console.error("Error fetching markdown:", err);
      });
  }, []);

  // Composants custom pour react-markdown
  const markdownComponents: Components = {
    // Sections avec classes → Cards colorées
    div: ({ className, children }: HTMLAttributes<HTMLDivElement>) => {
      if (className?.includes("section")) {
        const gradientClass = getSectionGradient(className);
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-6"
          >
            <Card className={cn("border-2", gradientClass)}>
              <CardContent className="p-6">
                {children}
              </CardContent>
            </Card>
          </motion.div>
        );
      }
      return <div className={className}>{children}</div>;
    },
    // Images avec sizing
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      if (!src || typeof src !== 'string') return null;
      const cleanSrc = cleanImageSrc(src);
      const width = extractImageWidth(src) || 400;
      const height = Math.round(width * 0.75); // Ratio 4:3 par défaut
      
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="my-4 flex justify-center"
        >
          <Image
            src={cleanSrc}
            alt={alt || ""}
            width={width}
            height={height}
            className="rounded-lg shadow-md"
            unoptimized={cleanSrc.endsWith('.PNG') || cleanSrc.endsWith('.png')}
          />
        </motion.div>
      );
    },
    // Titres avec icônes
    h2: ({ children, className, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      // Extraire le texte pour l'icône - gérer les cas où children est un array ou un objet
      let text = '';
      if (typeof children === 'string') {
        text = children;
      } else if (Array.isArray(children)) {
        text = children.map(c => typeof c === 'string' ? c : '').join('');
      } else {
        text = String(children || '');
      }
      const icon = getTitleIcon(text);
      return (
        <motion.h2
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={cn("text-2xl font-bold text-foreground mb-4 mt-6 flex items-center gap-3", className)}
        >
          {icon}
          <span>{children}</span>
        </motion.h2>
      );
    },
    h3: ({ children, ...props }: HTMLAttributes<HTMLHeadingElement>) => {
      return (
        <h3 className="text-xl font-semibold text-foreground mb-3 mt-4" {...props}>
          {children}
        </h3>
      );
    },
    // Tableaux avec composants Shadcn
    table: ({ children, ...props }: HTMLAttributes<HTMLTableElement>) => (
      <div className="my-6 overflow-x-auto">
        <Table {...props}>
          {children}
        </Table>
      </div>
    ),
    thead: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
      <TableHeader {...props}>{children}</TableHeader>
    ),
    tbody: ({ children, ...props }: HTMLAttributes<HTMLTableSectionElement>) => (
      <TableBody {...props}>{children}</TableBody>
    ),
    tr: ({ children, ...props }: HTMLAttributes<HTMLTableRowElement>) => (
      <TableRow {...props}>{children}</TableRow>
    ),
    th: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
      <TableHead {...props}>{children}</TableHead>
    ),
    td: ({ children, ...props }: HTMLAttributes<HTMLTableCellElement>) => (
      <TableCell {...props}>{children}</TableCell>
    ),
    // Listes avec styling
    ul: ({ children, ...props }: HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-none space-y-2 my-4" {...props}>
        {children}
      </ul>
    ),
    li: ({ children, ...props }: HTMLAttributes<HTMLLIElement>) => {
      // Extraire le contenu texte pour détecter les emojis
      let content = '';
      if (typeof children === 'string') {
        content = children;
      } else if (Array.isArray(children)) {
        content = children.map(c => {
          if (typeof c === 'string') return c;
          if (typeof c === 'object' && c !== null && 'props' in c) {
            // Extraire le texte des éléments React
            return String(c);
          }
          return String(c);
        }).join('');
      } else {
        content = String(children || '');
      }
      const isCheck = content.includes("✅");
      const isCross = content.includes("❌");
      
      return (
        <li className="flex items-start gap-3 text-foreground leading-relaxed" {...props}>
          {isCheck ? (
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          ) : isCross ? (
            <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
          ) : (
            <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 mt-2 shrink-0" />
          )}
          <span className="flex-1">{children}</span>
        </li>
      );
    },
    // Paragraphes
    p: ({ children, ...props }: HTMLAttributes<HTMLParagraphElement>) => (
      <p className="text-foreground leading-relaxed mb-4" {...props}>
        {children}
      </p>
    ),
    // Texte en gras
    strong: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
      <strong className="font-semibold text-foreground" {...props}>
        {children}
      </strong>
    ),
    // Emphase
    em: ({ children, ...props }: HTMLAttributes<HTMLElement>) => (
      <em className="italic text-muted-foreground" {...props}>
        {children}
      </em>
    ),
    // Ligne horizontale
    hr: (props: HTMLAttributes<HTMLHRElement>) => (
      <hr className="my-8 border-t border-border" {...props} />
    ),
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-8">
          <DecryptedText
            text="Déclaration d'affaires"
            animateOn="view"
            revealDirection="center"
            speed={30}
            maxIterations={15}
            className="text-foreground"
            encryptedClassName="text-muted-foreground opacity-50"
          />
        </h1>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Chargement...</div>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950/20">
          <CardContent className="p-6">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && content && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={markdownComponents}
          >
            {content}
          </ReactMarkdown>
        </motion.div>
      )}
    </div>
  );
}
