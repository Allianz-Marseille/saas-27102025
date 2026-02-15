"use client";

import { useState } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { expliquerRegle } from "@/lib/tools/antecedents/antecedents-ia-service";
import type { JournalDecision } from "@/lib/tools/antecedents/antecedentsTypes";

interface AntecedentsIAChatProps {
  journal: JournalDecision;
  regleId?: string;
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

export function AntecedentsIAChat({ journal, regleId }: AntecedentsIAChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: input,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Si une règle est spécifiée, expliquer cette règle
      const regleToExplain = regleId || journal.crm.regle_id;
      const response = await expliquerRegle(regleToExplain, input);

      const assistantMessage: Message = {
        role: "assistant",
        content: response,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: "assistant",
        content: "Désolé, une erreur est survenue. Veuillez réessayer.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardContent className="p-4 flex flex-col h-full">
        <div className="flex items-center gap-2 mb-4">
          <Bot className="h-5 w-5 text-blue-600" />
          <h3 className="font-semibold">Questions sur ce résultat ?</h3>
        </div>

        <ScrollArea className="flex-1 mb-4 pr-4">
          {messages.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-8">
              <p className="mb-2">Posez une question sur le calcul du CRM ou les règles appliquées.</p>
              <p className="text-xs">Exemples :</p>
              <ul className="text-xs mt-2 space-y-1 list-disc list-inside">
                <li>"Pourquoi le CRM est de {journal.crm.valeur} ?"</li>
                <li>"Comment fonctionne la règle {journal.crm.regle_id} ?"</li>
                <li>"Quels sinistres sont retenus ?"</li>
              </ul>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                      <Bot className="h-4 w-4 text-blue-600" />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 dark:bg-gray-800"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  {message.role === "user" && (
                    <div className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
                    <Bot className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Posez votre question..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
