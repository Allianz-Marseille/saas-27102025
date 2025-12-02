"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Copy, Check, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
  sources?: string[];
}

interface ChatMessageProps {
  message: Message;
  userInitial?: string;
  BotIcon?: React.ComponentType<{ className?: string }>;
}

export function ChatMessage({ message, userInitial, BotIcon }: ChatMessageProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Erreur lors de la copie:", error);
    }
  };

  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 animate-in slide-in-from-left-4 fade-in duration-500",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      {!isUser && BotIcon && (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-500 via-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shrink-0 ring-2 ring-emerald-300/50">
          <BotIcon className="h-8 w-8" />
        </div>
      )}
      {isUser && (
        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center shadow-lg shrink-0 text-white font-bold">
          {userInitial || "U"}
        </div>
      )}

      {/* Message content */}
      <div className="flex-1 group">
        <div
          className={cn(
            "rounded-2xl p-4 shadow-md relative",
            isUser
              ? "bg-gradient-to-r from-blue-500 to-purple-500 rounded-tr-none text-white"
              : "bg-white dark:bg-slate-800 rounded-tl-none border border-blue-100 dark:border-blue-900"
          )}
        >
          {/* Bouton copier (uniquement pour les messages assistant) */}
          {!isUser && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className={cn(
                "absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity",
                "hover:bg-blue-50 dark:hover:bg-slate-700 rounded-full"
              )}
              title="Copier le message"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4 text-gray-500" />
              )}
            </Button>
          )}

          {/* Contenu du message */}
          {isUser ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                className="markdown-content"
                components={{
                  p: ({ children }) => (
                    <p className="mb-4 text-sm leading-relaxed last:mb-0">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="mb-4 space-y-2 list-disc list-inside last:mb-0">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="mb-4 space-y-2 list-decimal list-inside last:mb-0">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-sm leading-relaxed">{children}</li>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-lg font-bold mt-6 mb-3 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-base font-semibold mt-4 mb-2 first:mt-0">
                      {children}
                    </h3>
                  ),
                  code: ({ children, className }) => {
                    const isInline = !className;
                    return isInline ? (
                      <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono">
                        {children}
                      </code>
                    ) : (
                      <code className={className}>{children}</code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="mb-4 p-3 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-x-auto last:mb-0">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic text-gray-600 dark:text-gray-400">
                      {children}
                    </blockquote>
                  ),
                  a: ({ href, children }) => (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      {children}
                    </a>
                  ),
                }}
              >
                {message.content}
              </ReactMarkdown>
            </div>
          )}

          {/* Indicateur de sources (si disponible) */}
          {!isUser && message.sources && message.sources.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 flex-wrap">
                <FileText className="h-3 w-3 text-gray-500" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Sources :
                </span>
                {message.sources.map((source, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center rounded-md bg-blue-50 dark:bg-blue-900/30 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 ring-1 ring-inset ring-blue-600/20"
                  >
                    {source}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

