"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, Send, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { cn } from "@/lib/utils";

/**
 * Page Nina — Bot Secrétaire (fullscreen).
 * Référence : docs/agents-ia/nina_secretaire/NINA-SECRETAIRE.md
 * Route : /commun/agents-ia/bot-secretaire
 */

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function BotSecretairePage() {
  const { user } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const updateMessage = useCallback((messageId: string, content: string) => {
    setMessages((prev) =>
      prev.map((msg) => (msg.id === messageId ? { ...msg, content } : msg))
    );
  }, []);

  const scrollToBottom = useCallback(() => {
    messagesContainerRef.current?.scrollTo({
      top: messagesContainerRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (hasStarted && !isLoading && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [hasStarted, isLoading]);

  const sendMessage = useCallback(
    async (
      textToSend: string,
      uiEvent?: string,
      options?: { retry?: boolean }
    ) => {
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }
      if (!textToSend.trim() && !uiEvent) return;

      setError(null);
      if (textToSend.trim() && !options?.retry) {
        setMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: "user", content: textToSend.trim() },
        ]);
        setInput("");
      }

      const assistantId = `a-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "" },
      ]);
      setIsLoading(true);

      try {
        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            message: textToSend.trim() || " ",
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            context: { agent: "nina" },
            uiEvent: uiEvent ?? undefined,
            stream: true,
          }),
        });

        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          throw new Error((err as { error?: string }).error || "Erreur lors de l'envoi");
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let accumulated = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split("\n\n");
            buffer = lines.pop() ?? "";
            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const raw = line.slice(6);
              if (raw === "[DONE]") break;
              try {
                const parsed = JSON.parse(raw) as { content?: string; error?: string };
                if (parsed.error) throw new Error(parsed.error);
                if (parsed.content) {
                  accumulated += parsed.content;
                  updateMessage(assistantId, accumulated);
                }
              } catch (e) {
                if (e instanceof Error && e.message !== "Unexpected end of JSON input") {
                  throw e;
                }
              }
            }
          }
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur réseau";
        setError(msg);
        setMessages((prev) => prev.filter((m) => m.id !== assistantId));
        toast.error(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [user, messages, updateMessage]
  );

  const handleBonjour = useCallback(() => {
    setHasStarted(true);
    sendMessage("Bonjour", "start");
  }, [sendMessage]);

  const handleSubmit = useCallback(() => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handleCopy = useCallback(async (id: string, content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedMessageId(id);
      setTimeout(() => setCopiedMessageId(null), 2000);
      toast.success("Copié");
    } catch {
      toast.error("Erreur lors de la copie");
    }
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:px-6">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/commun/agents-ia" aria-label="Retour aux agents IA">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
          Nina — Bot Secrétaire
        </h1>
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-emerald-500/30 shadow-md md:h-40 md:w-40">
              <Image
                src="/agents-ia/bot-secretaire/avatar-tete.jpg"
                alt="Nina, votre assistante secrétaire"
                fill
                className="object-cover object-top"
                sizes="(max-width: 768px) 128px, 160px"
                priority
              />
            </div>
            <p className="max-w-sm text-center text-slate-600 dark:text-slate-400">
              Je suis Nina, votre assistante secrétaire.
            </p>
            <Button
              size="lg"
              onClick={handleBonjour}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Bonjour
            </Button>
          </div>
        ) : (
          <>
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4"
            >
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === "user" && "flex-row-reverse"
                  )}
                >
                  {msg.role === "assistant" && (
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30">
                      <Image
                        src="/agents-ia/bot-secretaire/avatar-tete.jpg"
                        alt="Nina"
                        fill
                        className="object-cover object-top"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-emerald-600 text-white rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 rounded-tl-sm"
                    )}
                  >
                    {msg.role === "assistant" && msg.content && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-1 right-1 h-7 w-7 opacity-70 hover:opacity-100"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        aria-label="Copier la réponse"
                      >
                        {copiedMessageId === msg.id ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    )}
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="pr-8">
                        <MarkdownRenderer content={msg.content || ""} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-emerald-500/30">
                    <Image
                      src="/agents-ia/bot-secretaire/avatar-tete.jpg"
                      alt="Nina"
                      fill
                      className="object-cover object-top"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-sm text-slate-500">Nina écrit…</span>
                  </div>
                </div>
              )}
              {error && (
                <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 flex items-center justify-between gap-3">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const lastUser = [...messages]
                        .filter((m) => m.role === "user")
                        .pop();
                      if (lastUser)
                        sendMessage(lastUser.content, undefined, {
                          retry: true,
                        });
                      setError(null);
                    }}
                  >
                    Réessayer
                  </Button>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4">
              <div className="flex gap-2">
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Tapez votre message ou collez une image (Ctrl+V / Cmd+V)"
                  disabled={isLoading}
                  className="min-h-[52px] max-h-[180px] resize-none"
                  rows={2}
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isLoading || !input.trim()}
                  size="icon"
                  className="h-[52px] w-[52px] shrink-0 bg-emerald-600 hover:bg-emerald-700"
                >
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Entrée pour envoyer · Shift+Entrée pour un saut de ligne
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
