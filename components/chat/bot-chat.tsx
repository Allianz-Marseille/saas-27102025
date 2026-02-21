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
  Download,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface BotChatMessage {
  role: "user" | "assistant";
  content: string;
}

type AccentColor = "default" | "blue";

const DEFAULT_QUICK_REPLIES = [
  "Calculer gain fiscal Madelin",
  "Comparer avec un contrat AXA",
  "Synthèse pour mail client",
  "Vérifier carences RO",
];

interface BotChatProps {
  botId: string;
  botName: string;
  className?: string;
  /** Identité visuelle : "blue" pour Bob (bulles assistant, bordure header) */
  accentColor?: AccentColor;
  /** Réponses rapides (boutons au-dessus de l'input). Défaut : liste prévoyance. */
  quickReplies?: string[];
  /** Force le thème sombre (contraste) quand le conteneur a un fond sombre. Par défaut : true si accentColor="blue". */
  darkContainer?: boolean;
}

/**
 * Interface de chat avec un bot IA.
 * Appel POST /api/chat avec { message, botId, history }.
 */
const SCROLL_THRESHOLD_PX = 80;

export function BotChat({
  botId,
  botName,
  className,
  accentColor = "default",
  quickReplies = DEFAULT_QUICK_REPLIES,
  darkContainer: darkContainerProp,
}: BotChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<BotChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState("");
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
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
    inputRef.current?.focus();
  }, []);

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
        inputRef.current?.focus();
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

  const handleDownloadSynthèse = useCallback(() => {
    const lines: string[] = [];
    messages.forEach((m) => {
      const role = m.role === "user" ? "Vous" : botName;
      lines.push(`${role}:\n${m.content}\n`);
    });
    const text = lines.join("\n---\n\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `synthèse-chat-${botName.replace(/\s/g, "-")}-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [messages, botName]);

  const handleAttachClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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

  const isBlue = accentColor === "blue";
  /** Chat avec fond sombre : force les variables dark pour un bon contraste texte/fond */
  const hasDarkContainer = darkContainerProp ?? isBlue;
  const headerBorderClass = isBlue
    ? "border-b border-blue-500/30 bg-blue-950/20"
    : "border-b bg-muted/30";
  const assistantBubbleClass = isBlue
    ? "mr-auto bg-blue-950/40 border border-blue-500/20 shadow-sm"
    : "mr-auto bg-muted shadow-sm";
  const userBubbleClass =
    "ml-auto bg-primary text-primary-foreground shadow-sm";
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
          "px-4 py-2 flex items-center justify-between gap-2 flex-wrap",
          headerBorderClass
        )}
      >
        <p className="font-medium text-sm">Chat avec {botName}</p>
        <div className="flex items-center gap-2">
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
              "h-8 gap-1.5",
              hasDarkContainer
                ? "text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={handleDownloadSynthèse}
            disabled={messages.length === 0}
            title="Télécharger la synthèse"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Synthèse</span>
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
                    <div className="prose prose-invert prose-sm max-w-none dark:prose-invert prose-table:overflow-x-auto prose-td:border prose-th:border prose-td:px-2 prose-th:px-2 prose-td:py-1 prose-th:py-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
              <div className="prose prose-invert prose-sm max-w-none dark:prose-invert prose-table:overflow-x-auto prose-td:border prose-th:border prose-td:px-2 prose-th:px-2 prose-td:py-1 prose-th:py-1">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
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

      {quickReplies.length > 0 && (
        <div
          className={cn(
            "border-t px-4 py-2 overflow-x-auto",
            hasDarkContainer && "border-slate-600/50"
          )}
        >
          <div className="flex gap-2 pb-1">
            {quickReplies.map((label) => (
              <Button
                key={label}
                type="button"
                variant="outline"
                size="sm"
                className={cn(
                  "shrink-0 text-xs h-8",
                  hasDarkContainer &&
                    "border-slate-500/60 bg-slate-800/50 text-slate-200 hover:bg-slate-700/60 hover:text-white hover:border-slate-400/60"
                )}
                onClick={() => sendMessage(label)}
                disabled={isLoading}
              >
                {label}
              </Button>
            ))}
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
