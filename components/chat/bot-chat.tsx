"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  Send,
  Loader2,
  Copy,
  Check,
  Paperclip,
  RefreshCw,
  MessageSquarePlus,
  Mail,
  ClipboardList,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/chat/mermaid-diagram";

export interface BotChatMessage {
  role: "user" | "assistant";
  content: string;
}

type AccentColor = "default" | "blue" | "emerald" | "orange";

/** Label affiché OU { label, message } pour envoyer un message différent. */
export type QuickReply = string | { label: string; message: string };

function normalizeQuickReply(item: QuickReply): { label: string; message: string } {
  return typeof item === "string"
    ? { label: item, message: item }
    : { label: item.label, message: item.message };
}

const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    label: "Je veux faire un bilan TNS",
    message:
      "Je veux faire un bilan TNS. Lance tes questions pas à pas pour collecter les données.",
  },
  {
    label: "Je colle une capture de la fiche Lagon",
    message:
      "Je vais coller une capture de la fiche Lagon. Quand je l'envoie : lis les infos (client, chargé de mission de l'agence), extrais ce que tu peux, puis lance ton process pas à pas pour faire le point.",
  },
  {
    label: "Question sur la SSI",
    message:
      "J'ai une question sur la SSI. Demande-moi de quoi j'ai besoin : un résumé, une explication générale, ou un point précis ?",
  },
  {
    label: "Quel régime obligatoire ?",
    message:
      "Je veux savoir quel régime obligatoire s'applique. Demande-moi le métier, puis donne-moi le nom du RO et demande ce que je souhaite savoir (résumé, explication générale, point précis).",
  },
];

interface BotChatProps {
  botId: string;
  botName: string;
  className?: string;
  /** Identité visuelle : "blue" pour Bob (bulles assistant, bordure header) */
  accentColor?: AccentColor;
  /** Réponses rapides (boutons au-dessus de l'input). string = label et message identiques. Défaut : liste prévoyance. */
  quickReplies?: QuickReply[];
  /** Boutons de niveau 1 (ex. Bonjour, Question SSI, Régime obligatoire, Loi Madelin). Si fourni avec quickRepliesLevel2 et bonjourTriggerMessage, active le mode deux niveaux. */
  quickRepliesLevel1?: QuickReply[];
  /** Boutons de niveau 2 affichés après la réponse à Bonjour (ex. Lagon, Liasse, Questions). Style coloré. */
  quickRepliesLevel2?: QuickReply[];
  /** Message envoyé quand on clique sur Bonjour (ex. "Bonjour"), pour afficher le niveau 2. */
  bonjourTriggerMessage?: string;
  /** Force le thème sombre (contraste) quand le conteneur a un fond sombre. Par défaut : true si accentColor="blue". */
  darkContainer?: boolean;
}

/**
 * Interface de chat avec un bot IA.
 * Appel POST /api/chat avec { message, botId, history }.
 */
const SCROLL_THRESHOLD_PX = 80;

/** Dérive le prénom du chargé de clientèle à partir de l'email (ex. jean.dupont@... → Jean). */
function getPrenomChargeFromEmail(email: string | null | undefined): string {
  if (!email || !email.includes("@")) return "Collaborateur";
  const beforeAt = email.split("@")[0].trim();
  const firstWord = beforeAt.replace(/[^a-zA-ZÀ-ÿ]+/g, " ").trim().split(/\s+/)[0] ?? "";
  if (!firstWord) return "Collaborateur";
  return firstWord.charAt(0).toUpperCase() + firstWord.slice(1).toLowerCase();
}

/** Extrait le nom du client des messages assistant (ex. "pour le client **Fred Fellous**" ou "client **X**"). */
function getClientNameFromMessages(messages: BotChatMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role !== "assistant") continue;
    const content = messages[i].content;
    const withBold = /(?:client|pour le client)[\s:]*\*\*([^*]+)\*\*/.exec(content);
    if (withBold?.[1]) return withBold[1].trim();
    const withoutBold = /(?:J'ai bien enregistré pour le client|client)[\s:]+([A-Za-zÀ-ÿ][A-Za-zÀ-ÿ\s-]+?)(?:\s*\.|$|\n)/.exec(content);
    if (withoutBold?.[1]) return withoutBold[1].trim();
  }
  return "";
}

export function BotChat({
  botId,
  botName,
  className,
  accentColor = "default",
  quickReplies = DEFAULT_QUICK_REPLIES,
  quickRepliesLevel1,
  quickRepliesLevel2,
  bonjourTriggerMessage,
  darkContainer: darkContainerProp,
}: BotChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [copiedAction, setCopiedAction] = useState<"chat" | "mail" | "note" | null>(null);
  const [sessionStart, setSessionStart] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopy = async (content: string, index: number) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignorer si clipboard non disponible
    }
  };

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollTop = el.scrollHeight;
    });
  }, []);

  const shouldAutoScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    const { scrollTop, scrollHeight, clientHeight } = el;
    return scrollHeight - scrollTop - clientHeight < SCROLL_THRESHOLD_PX;
  }, []);

  useEffect(() => {
    if (shouldAutoScroll()) scrollToBottom();
  }, [messages, streamingContent, scrollToBottom, shouldAutoScroll]);

  useEffect(() => {
    if (isLoading || streamingContent) scrollToBottom();
  }, [isLoading, streamingContent, scrollToBottom]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const prevLoadingRef = useRef(isLoading);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading]);

  const sendMessage = useCallback(
    async (
      messageText?: string,
      options?: { historyOverride?: BotChatMessage[] }
    ) => {
      const text = (messageText ?? input.trim()).trim();
      if (!text || !user || isLoading) return;

      setInput("");
      setError(null);
      const historyToUse = options?.historyOverride ?? messages;
      if (!options?.historyOverride) {
        setMessages((prev) => [...prev, { role: "user", content: text }]);
      }
      if (!sessionStart) setSessionStart(Date.now());
      setIsLoading(true);
      setStreamingContent("");

      try {
        const token = await user.getIdToken();
        const history = historyToUse.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        const apiUrl =
          typeof window !== "undefined"
            ? `${window.location.origin}/api/chat`
            : "/api/chat";
        const response = await fetch(apiUrl, {
          method: "POST",
          cache: "no-store",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
            "X-Requested-With": "XMLHttpRequest",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: text,
            botId,
            history,
          }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          const msg =
            response.status === 405
              ? "Erreur 405 (Méthode refusée). Rafraîchissez la page (Ctrl+F5), ou vérifiez que le déploiement est à jour."
              : errData.error ?? `Erreur ${response.status}`;
          throw new Error(msg);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("Pas de stream");
        }

        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullContent += chunk;
          setStreamingContent(fullContent);
        }

        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: fullContent },
        ]);
        setStreamingContent("");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'envoi");
        setStreamingContent("");
      } finally {
        setIsLoading(false);
        setTimeout(() => inputRef.current?.focus(), 0);
      }
    },
    [
      input,
      user,
      isLoading,
      messages,
      sessionStart,
    ]
  );

  const handleRegenerate = useCallback(() => {
    if (messages.length === 0 || messages[messages.length - 1].role !== "user")
      return;
    const lastUserContent = messages[messages.length - 1].content;
    let truncated = messages.slice(0, -1);
    if (
      truncated.length > 0 &&
      truncated[truncated.length - 1].role === "assistant"
    ) {
      truncated = truncated.slice(0, -1);
    }
    setMessages(truncated);
    sendMessage(lastUserContent, { historyOverride: truncated });
  }, [messages, sendMessage]);

  const buildSynthèseText = useCallback(() => {
    const lines: string[] = [];
    messages.forEach((m) => {
      const role = m.role === "user" ? "Vous" : botName;
      lines.push(`${role}:\n${m.content}\n`);
    });
    return lines.join("\n---\n\n");
  }, [messages, botName]);

  const handleCopierChat = useCallback(async () => {
    const text = buildSynthèseText();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedAction("chat");
      setTimeout(() => setCopiedAction(null), 2000);
    } catch {
      // Fallback si clipboard non disponible
    }
  }, [buildSynthèseText]);

  const handlePreparerMail = useCallback(async () => {
    const prenomCharge = getPrenomChargeFromEmail(user?.email ?? undefined);
    const nomClient = getClientNameFromMessages(messages) || "[Nom client]";
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const corps = lastAssistant?.content ?? "Aucun contenu.";
    const lines = [
      `Objet : Synthèse prévoyance – ${nomClient}`,
      "",
      "Bonjour,",
      "",
      `Suite à notre échange, je vous adresse ci-dessous la synthèse.`,
      "",
      corps,
      "",
      `Cordialement,`,
      prenomCharge,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedAction("mail");
      setTimeout(() => setCopiedAction(null), 2000);
    } catch {
      // Fallback si clipboard non disponible
    }
  }, [messages, user?.email]);

  const handlePreparerNoteSynthèse = useCallback(async () => {
    const prenomCharge = getPrenomChargeFromEmail(user?.email ?? undefined);
    const nomClient = getClientNameFromMessages(messages) || "[Nom client]";
    const lastAssistant = [...messages].reverse().find((m) => m.role === "assistant");
    const corps = lastAssistant?.content ?? "Aucun contenu.";
    const dateStr = new Date().toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    const lines = [
      `Note de synthèse – ${nomClient}`,
      "",
      `Date : ${dateStr}`,
      `Client : ${nomClient}`,
      `Chargé de clientèle : ${prenomCharge}`,
      "",
      corps,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopiedAction("note");
      setTimeout(() => setCopiedAction(null), 2000);
    } catch {
      // Fallback si clipboard non disponible
    }
  }, [messages, user?.email]);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleNewConversation = useCallback(() => {
    if (isLoading) return;
    setMessages([]);
    setStreamingContent("");
    setInput("");
    setError(null);
    setSessionStart(null);
    setCopiedIndex(null);
    inputRef.current?.focus();
  }, [isLoading]);

  const sessionLabel =
    sessionStart != null
      ? messages.length > 0
        ? `${messages.length} message${messages.length > 1 ? "s" : ""}`
        : `Session : ${Math.max(0, Math.floor((Date.now() - sessionStart) / 60000))} min`
      : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    sendMessage();
  };

  const isAccent =
    accentColor === "blue" ||
    accentColor === "emerald" ||
    accentColor === "orange";
  /** Chat avec fond sombre : force les variables dark pour un bon contraste texte/fond */
  const hasDarkContainer = darkContainerProp ?? isAccent;
  const headerBorderClass =
    accentColor === "blue"
      ? "border-b border-blue-500/30 bg-blue-950/20"
      : accentColor === "emerald"
        ? "border-b border-emerald-500/30 bg-emerald-950/20"
        : accentColor === "orange"
          ? "border-b border-orange-500/30 bg-orange-950/20"
          : "border-b bg-muted/30";
  const assistantBubbleClass =
    accentColor === "blue"
      ? "mr-auto bg-blue-950/40 border border-blue-500/20 shadow-sm"
      : accentColor === "emerald"
        ? "mr-auto bg-emerald-950/40 border border-emerald-500/20 shadow-sm"
        : accentColor === "orange"
          ? "mr-auto bg-orange-950/40 border border-orange-500/20 shadow-sm"
          : "mr-auto bg-muted shadow-sm";
  const userBubbleClass =
    "ml-auto bg-primary text-primary-foreground shadow-sm";
  const tableHeaderClass =
    accentColor === "blue"
      ? "bg-blue-900/60 text-slate-100"
      : accentColor === "emerald"
        ? "bg-emerald-900/60 text-slate-100"
        : accentColor === "orange"
          ? "bg-orange-900/60 text-slate-100"
          : "bg-muted text-foreground";
  const markdownTableComponents = hasDarkContainer
    ? {
        table: ({ children }: React.HTMLAttributes<HTMLTableElement>) => (
          <div className="my-3 overflow-x-auto rounded-lg border border-slate-600/50">
            <table className="w-full min-w-[400px] border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
          <thead className={tableHeaderClass}>{children}</thead>
        ),
        th: ({ children }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
          <th className="px-3 py-2 text-left text-xs font-semibold">
            {children}
          </th>
        ),
        tbody: ({ children }: React.HTMLAttributes<HTMLTableSectionElement>) => (
          <tbody className="divide-y divide-slate-600/30">{children}</tbody>
        ),
        tr: ({ children }: React.HTMLAttributes<HTMLTableRowElement>) => (
          <tr className="even:bg-slate-800/40 odd:bg-transparent">
            {children}
          </tr>
        ),
        td: ({ children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
          <td
            className="px-3 py-2 text-sm last:bg-amber-950/30 last:font-semibold last:text-amber-200"
            {...props}
          >
            {children}
          </td>
        ),
        blockquote: ({
          children,
          ...props
        }: React.BlockquoteHTMLAttributes<HTMLQuoteElement>) => (
          <blockquote
            className="my-2 border-l-4 border-amber-500/60 bg-amber-950/20 pl-3 py-1.5 text-sm italic"
            {...props}
          >
            {children}
          </blockquote>
        ),
        h4: ({
          children,
          ...props
        }: React.HTMLAttributes<HTMLHeadingElement>) => (
          <h4
            className="mt-4 mb-2 text-sm font-semibold text-slate-200 first:mt-0"
            {...props}
          >
            {children}
          </h4>
        ),
        hr: () => <hr className="my-4 border-slate-600/50" />,
        code: ({
          className,
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement>) => {
          const lang = className?.replace("language-", "");
          const code = String(children).replace(/\n$/, "");
          if (lang === "mermaid") {
            return <MermaidDiagram code={code} />;
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      }
    : {
        code: ({
          className,
          children,
          ...props
        }: React.HTMLAttributes<HTMLElement>) => {
          const lang = className?.replace("language-", "");
          const code = String(children).replace(/\n$/, "");
          if (lang === "mermaid") {
            return <MermaidDiagram code={code} />;
          }
          return (
            <code className={className} {...props}>
              {children}
            </code>
          );
        },
      } as const;
  const useTwoLevels =
    quickRepliesLevel1 != null &&
    quickRepliesLevel2 != null &&
    bonjourTriggerMessage != null &&
    quickRepliesLevel1.length > 0 &&
    quickRepliesLevel2.length > 0;
  const showLevel2 =
    useTwoLevels &&
    messages.length >= 2 &&
    messages[messages.length - 1].role === "assistant" &&
    messages[messages.length - 2].role === "user" &&
    messages[messages.length - 2].content.trim() === bonjourTriggerMessage.trim();
  const effectiveQuickReplies = useTwoLevels
    ? showLevel2
      ? quickRepliesLevel2
      : quickRepliesLevel1
    : quickReplies;
  const level2ButtonClass =
    accentColor === "blue"
      ? "bg-blue-600 hover:bg-blue-700 text-white border-blue-500"
      : accentColor === "emerald"
        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500"
        : accentColor === "orange"
          ? "bg-orange-600 hover:bg-orange-700 text-white border-orange-500"
          : "bg-primary text-primary-foreground";
  const lastMessageIsUser =
    messages.length > 0 && messages[messages.length - 1].role === "user";

  return (
    <div
      className={cn(
        "flex flex-col rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden",
        hasDarkContainer && "dark",
        className
      )}
    >
      <div
        className={cn(
          "px-4 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
          headerBorderClass
        )}
      >
        <p className="font-medium text-sm shrink-0">Chat avec {botName}</p>
        <div className="flex flex-wrap items-center gap-2 sm:justify-end min-w-0">
          {sessionLabel && (
            <span
              className={cn(
                "text-xs",
                hasDarkContainer ? "text-slate-400" : "text-muted-foreground"
              )}
            >
              {sessionLabel}
            </span>
          )}
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 shrink-0",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleNewConversation}
            disabled={isLoading}
            title="Nouvelle conversation"
          >
            <MessageSquarePlus className="h-4 w-4 shrink-0" />
            <span className="hidden md:inline whitespace-nowrap">Nouvelle conversation</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 shrink-0",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleCopierChat}
            disabled={!user || messages.length === 0}
            title="Copier l'intégralité du chat"
          >
            {copiedAction === "chat" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <ClipboardList className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden md:inline whitespace-nowrap">
              {copiedAction === "chat" ? "Copié !" : "Copier le chat"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 shrink-0",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handlePreparerMail}
            disabled={!user || messages.length === 0}
            title="Préparer un mail (objet, corps, signature)"
          >
            {copiedAction === "mail" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <Mail className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden md:inline whitespace-nowrap">
              {copiedAction === "mail" ? "Copié !" : "Préparer un mail"}
            </span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 gap-1.5 shrink-0",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handlePreparerNoteSynthèse}
            disabled={!user || messages.length === 0}
            title="Préparer une note de synthèse"
          >
            {copiedAction === "note" ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <FileText className="h-4 w-4 shrink-0" />
            )}
            <span className="hidden md:inline whitespace-nowrap">
              {copiedAction === "note" ? "Copié !" : "Préparer une note de synthèse"}
            </span>
          </Button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 min-h-[280px] max-h-[420px] overflow-y-auto overflow-x-hidden p-4 space-y-4"
      >
        {messages.length === 0 && !streamingContent && !isLoading && (
          <p
            className={cn(
              "text-sm",
              hasDarkContainer ? "text-slate-400" : "text-muted-foreground"
            )}
          >
            Posez votre question à {botName}. Santé et prévoyance TNS.
          </p>
        )}
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={`${i}-${msg.content.slice(0, 20)}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={cn(
                "rounded-xl px-3 py-2.5 text-sm max-w-[85%]",
                msg.role === "user" ? userBubbleClass : assistantBubbleClass
              )}
            >
              {msg.role === "user" ? (
                <div className="flex items-start gap-2">
                  <span className="flex-1 min-w-0">{msg.content}</span>
                  {lastMessageIsUser && i === messages.length - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                      onClick={handleRegenerate}
                      disabled={isLoading}
                      title="Régénérer la réponse"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ) : (
                <div className="flex items-start gap-2 group/bubble">
                  <div className="flex-1 min-w-0 overflow-x-auto">
                    <div className="prose prose-invert prose-sm max-w-none dark:prose-invert [&_table]:my-3 [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={markdownTableComponents}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 opacity-70 group-hover/bubble:opacity-100 text-muted-foreground hover:text-foreground"
                    onClick={() => handleCopy(msg.content, i)}
                    title="Copier"
                  >
                    {copiedIndex === i ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && !streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm max-w-[85%]",
              assistantBubbleClass
            )}
          >
            <div className="flex gap-1">
              <span
                className="w-2 h-2 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "0ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "150ms" }}
              />
              <span
                className="w-2 h-2 rounded-full bg-current animate-bounce"
                style={{ animationDelay: "300ms" }}
              />
            </div>
          </motion.div>
        )}

        {streamingContent && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              "rounded-xl px-3 py-2.5 text-sm max-w-[85%]",
              assistantBubbleClass
            )}
          >
            <div className="overflow-x-auto">
              <div className="prose prose-invert prose-sm max-w-none dark:prose-invert [&_table]:my-3 [&_th]:px-3 [&_th]:py-2 [&_td]:px-3 [&_td]:py-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownTableComponents}
                >
                  {streamingContent}
                </ReactMarkdown>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="px-4 py-2 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {effectiveQuickReplies.length > 0 && (
        <div
          className={cn(
            "border-t px-4 py-2 overflow-x-auto",
            hasDarkContainer && "border-slate-600/50"
          )}
        >
          <div className="flex gap-2 pb-1">
            {effectiveQuickReplies.map((item) => {
              const { label, message } = normalizeQuickReply(item);
              const isLevel2 = useTwoLevels && showLevel2;
              return (
                <Button
                  key={label}
                  type="button"
                  variant={isLevel2 ? "default" : "outline"}
                  size="sm"
                  className={cn(
                    "shrink-0 text-xs h-8",
                    isLevel2 && level2ButtonClass,
                    !isLevel2 &&
                      hasDarkContainer &&
                      "border-slate-500/60 bg-slate-800/50 text-slate-200 hover:bg-slate-700/60 hover:text-white hover:border-slate-400/60"
                  )}
                  onClick={() => sendMessage(message)}
                  disabled={isLoading}
                >
                  {label}
                </Button>
              );
            })}
          </div>
        </div>
      )}

      <form
        method="post"
        onSubmit={handleSubmit}
        className={cn(
          "border-t p-4",
          hasDarkContainer && "border-slate-600/50"
        )}
        noValidate
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.pdf,.doc,.docx"
          aria-hidden
          onChange={() => {
            // Préparé pour future intégration upload / OCR
          }}
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "shrink-0 h-11 w-11",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleAttachClick}
            title="Joindre un fichier (à venir)"
          >
            <Paperclip className="h-4 w-4" />
          </Button>
          <Textarea
            ref={inputRef}
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Votre message..."
            rows={2}
            className={cn(
              "resize-none min-h-[44px] flex-1",
              hasDarkContainer &&
                "placeholder:text-slate-400 bg-slate-800/50 border-slate-600/50 text-slate-100 focus-visible:border-blue-400/50"
            )}
            disabled={isLoading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
          />
          <Button
            type="button"
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 h-11 w-11"
            onClick={() => sendMessage()}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
