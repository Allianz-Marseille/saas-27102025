"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowLeft, Loader2, Send, Copy, Check, X, ImageIcon, FileText, FileDown, MoreVertical, MessageSquarePlus } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/lib/firebase/use-auth";
import { toast } from "sonner";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { maskSensitive } from "@/lib/assistant/mask-sensitive";
import {
  processImageFiles,
  convertImagesToBase64,
  type ImageFile,
} from "@/lib/assistant/image-utils";
import {
  processFiles,
  MAX_FILES_PER_MESSAGE,
  type ProcessedFile,
} from "@/lib/assistant/file-processing";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { PDF_EXPORT_MAX_CHARS } from "@/lib/assistant/config";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Page Bob — Assistant agence Santé & Prévoyance (fullscreen).
 * Référence : docs/agents-ia/bob_sante/bob_sante.md
 * Route : /commun/agents-ia/bob-sante
 */

const SUGGESTIONS_DEMARRAGE = [
  { label: "Rédiger une DUE (contrat groupe)", message: "Je voudrais rédiger une DUE pour la mise en place d'un contrat groupe santé/prévoyance" },
  { label: "Analyser une 2035 (IJ et frais généraux)", message: "Je voudrais analyser une 2035 pour déterminer les IJ et frais généraux d'un TNS" },
  { label: "Arguments pour rassurer un client TNS", message: "Quels arguments pour rassurer un client TNS sur la prévoyance ?" },
  { label: "Différence régime général / SSI", message: "Quelle est la différence entre le régime général et la SSI pour un prospect ?" },
  { label: "Garanties minimales entreprise", message: "Quelles garanties minimales rappeler pour une entreprise ?" },
  { label: "Comprendre une fiche de paie (santé)", message: "Comment comprendre les lignes santé sur une fiche de paie ?" },
  { label: "Comparer des contrats prévoyance", message: "Je voudrais comparer des contrats prévoyance" },
  { label: "Régime TNS vs salarié", message: "Quelles sont les différences entre le régime TNS et salarié ?" },
  { label: "Aide retraite / seniors", message: "J'ai besoin d'aide sur la retraite et les seniors" },
  { label: "Expliquer une attestation mutuelle", message: "Comment expliquer une attestation mutuelle à un client ?" },
  { label: "Extraire infos bulletin ou contrat", message: "Je voudrais extraire les infos d'un bulletin ou d'un contrat" },
] as const;

interface SourceItem {
  name: string;
  pages?: string;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceItem[];
}

export default function BobSantePage() {
  const { user } = useAuth();
  const [hasStarted, setHasStarted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [pdfExportMessageId, setPdfExportMessageId] = useState<string | null>(null);
  const [draftContent, setDraftContent] = useState("");
  const [selectedImages, setSelectedImages] = useState<ImageFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const [maskBeforeCopy, setMaskBeforeCopy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfExportRef = useRef<HTMLDivElement>(null);

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
      options?: { retry?: boolean },
      attachments?: { images: ImageFile[]; files: ProcessedFile[] }
    ) => {
      if (!user) {
        toast.error("Vous devez être connecté");
        return;
      }
      const hasAttachments =
        (attachments?.images?.length ?? 0) > 0 || (attachments?.files?.length ?? 0) > 0;
      if (!textToSend.trim() && !uiEvent && !hasAttachments) return;

      setError(null);
      const contentToShow =
        textToSend.trim() ||
        (attachments?.images?.length ? "Analyse cette image" : "") ||
        (attachments?.files?.length ? "Analyse ces fichiers" : "");
      if (contentToShow && !options?.retry) {
        setMessages((prev) => [
          ...prev,
          { id: `u-${Date.now()}`, role: "user", content: contentToShow },
        ]);
        setInput("");
      }

      const assistantId = `a-${Date.now()}`;
      const sources: SourceItem[] = [];
      if (attachments?.files?.length) {
        for (const f of attachments.files) {
          sources.push({ name: f.name, pages: undefined });
        }
      }
      if (attachments?.images?.length) {
        for (const img of attachments.images) {
          sources.push({ name: img.file.name, pages: undefined });
        }
      }
      setMessages((prev) => [
        ...prev,
        { id: assistantId, role: "assistant", content: "", sources: sources.length ? sources : undefined },
      ]);
      setIsLoading(true);

      try {
        const imageBase64s = attachments?.images?.length
          ? await convertImagesToBase64(attachments.images)
          : [];
        const filesPayload = attachments?.files?.length
          ? attachments.files.map((f) => ({
              name: f.name,
              type: f.type,
              content: f.content,
              data: f.data,
              error: f.error,
            }))
          : undefined;

        const messageForApi =
          textToSend.trim() ||
          (imageBase64s.length ? "Analyse cette image" : "") ||
          (filesPayload?.length ? "Analyse ces fichiers" : "") ||
          " ";

        const response = await fetch("/api/assistant/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${await user.getIdToken()}`,
          },
          body: JSON.stringify({
            message: messageForApi,
            images: imageBase64s.length ? imageBase64s : undefined,
            files: filesPayload,
            history: messages.map((m) => ({ role: m.role, content: m.content })),
            context: { agent: "bob" },
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
    const hasContent = input.trim() || selectedImages.length > 0 || selectedFiles.length > 0;
    if (!hasContent || isLoading || isProcessingFiles) return;

    const textToSend =
      input.trim() ||
      (selectedImages.length ? "Analyse cette image" : "") ||
      (selectedFiles.length ? "Analyse ces fichiers" : "");
    const imgs = [...selectedImages];
    const fils = [...selectedFiles];
    setSelectedImages([]);
    setSelectedFiles([]);
    sendMessage(textToSend, undefined, undefined, { images: imgs, files: fils });
  }, [input, selectedImages, selectedFiles, isLoading, isProcessingFiles, sendMessage]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit]
  );

  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      try {
        const processed = await processImageFiles(imageFiles);
        setSelectedImages((prev) => [...prev, ...processed]);
        toast.success(`${processed.length} image(s) ajoutée(s)`);
      } catch {
        toast.error("Erreur lors du traitement des images");
      }
    }
  }, []);

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;
      try {
        const processed = await processImageFiles(files);
        setSelectedImages((prev) => [...prev, ...processed]);
        toast.success(`${processed.length} image(s) ajoutée(s)`);
      } catch {
        toast.error("Erreur lors du traitement des images");
      }
      e.target.value = "";
    },
    []
  );

  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length === 0) return;

      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const otherFiles = files.filter((f) => !f.type.startsWith("image/"));

      if (imageFiles.length > 0) {
        try {
          const processed = await processImageFiles(imageFiles);
          setSelectedImages((prev) => [...prev, ...processed]);
          toast.success(`${processed.length} image(s) ajoutée(s)`);
        } catch {
          toast.error("Erreur lors du traitement des images");
        }
      }

      if (otherFiles.length > 0) {
        if (selectedFiles.length + otherFiles.length > MAX_FILES_PER_MESSAGE) {
          toast.error(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message.`);
        } else {
          setIsProcessingFiles(true);
          try {
            const result = await processFiles(otherFiles);
            // Pour les PDF, on exige que data soit présent (base64) pour parsing serveur
            const toAdd = result.filter((f) => {
              const isPdf = f.name?.toLowerCase().endsWith('.pdf');
              if (isPdf && !f.data) {
                console.error(`[handleFileChange] PDF ${f.name} n'a pas de data base64, ne sera pas ajouté`);
                return false;
              }
              return !f.error || f.data;
            });
            if (toAdd.length > 0) {
              setSelectedFiles((prev) => [...prev, ...toAdd]);
              toast.success(`${toAdd.length} fichier(s) ajouté(s)`);
            }
            result
              .filter((f) => {
                const isPdf = f.name?.toLowerCase().endsWith('.pdf');
                return f.error && (!f.data || (isPdf && !f.data));
              })
              .forEach((f) => {
                const isPdf = f.name?.toLowerCase().endsWith('.pdf');
                const msg = isPdf && !f.data
                  ? `${f.name}: Impossible de préparer le fichier pour l'envoi (conversion base64 échouée)`
                  : `${f.name}: ${f.error}`;
                toast.error(msg);
              });
          } catch {
            toast.error("Erreur lors du traitement des fichiers");
          } finally {
            setIsProcessingFiles(false);
          }
        }
      }
      e.target.value = "";
    },
    [selectedFiles.length]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files || []);
      if (files.length === 0) return;
      const imageFiles = files.filter((f) => f.type.startsWith("image/"));
      const otherFiles = files.filter((f) => !f.type.startsWith("image/"));
      if (imageFiles.length > 0) {
        try {
          const processed = await processImageFiles(imageFiles);
          setSelectedImages((prev) => [...prev, ...processed]);
          toast.success(`${processed.length} image(s) ajoutée(s)`);
        } catch {
          toast.error("Erreur lors du traitement des images");
        }
      }
      if (otherFiles.length > 0) {
        if (selectedFiles.length + otherFiles.length > MAX_FILES_PER_MESSAGE) {
          toast.error(`Maximum ${MAX_FILES_PER_MESSAGE} fichiers par message.`);
          return;
        }
        setIsProcessingFiles(true);
        try {
          const result = await processFiles(otherFiles);
          // Pour les PDF, on exige que data soit présent (base64) pour parsing serveur
          const toAdd = result.filter((f) => {
            const isPdf = f.name?.toLowerCase().endsWith('.pdf');
            if (isPdf && !f.data) {
              console.error(`[handleDrop] PDF ${f.name} n'a pas de data base64, ne sera pas ajouté`);
              return false;
            }
            return !f.error || f.data;
          });
          if (toAdd.length > 0) {
            setSelectedFiles((prev) => [...prev, ...toAdd]);
            toast.success(`${toAdd.length} fichier(s) ajouté(s)`);
          }
        } catch {
          toast.error("Erreur lors du traitement des fichiers");
        } finally {
          setIsProcessingFiles(false);
        }
      }
    },
    [selectedFiles.length]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const removeImage = useCallback((id: string) => {
    setSelectedImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const removeFile = useCallback((id: string) => {
    setSelectedFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  const handleCopy = useCallback(
    async (id: string, content: string) => {
      const toCopy = maskBeforeCopy ? maskSensitive(content) : content;
      try {
        await navigator.clipboard.writeText(toCopy);
        setCopiedMessageId(id);
        setTimeout(() => setCopiedMessageId(null), 2000);
        toast.success("Copié");
      } catch {
        toast.error("Erreur lors de la copie");
      }
    },
    [maskBeforeCopy]
  );

  const handleDownloadPdf = useCallback((messageId: string) => {
    setPdfExportMessageId(messageId);
  }, []);

  const handleExportConversationPdf = useCallback(async () => {
    if (messages.length === 0) {
      toast.error("Aucun message à exporter");
      return;
    }
    try {
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 15;
      const lineHeight = 5;
      let y = margin;
      pdf.setFontSize(10);
      pdf.setFont("helvetica", "bold");
      pdf.text("Conversation Bob — Assistant agence Santé & Prévoyance", margin, y);
      y += lineHeight + 2;
      pdf.text(
        new Date().toLocaleDateString("fr-FR", { dateStyle: "long" }),
        margin,
        y
      );
      y += lineHeight + 4;
      pdf.setFont("helvetica", "normal");
      for (const msg of messages) {
        if (y + lineHeight * 3 > pageHeight - margin) {
          pdf.addPage();
          y = margin;
        }
        pdf.setFont("helvetica", "bold");
        pdf.setTextColor(0, 82, 77);
        pdf.text(msg.role === "user" ? "Utilisateur :" : "Bob :", margin, y);
        y += lineHeight;
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(0, 0, 0);
        const lines = pdf.splitTextToSize(msg.content || "", pageWidth - 2 * margin);
        for (const line of lines) {
          if (y + lineHeight > pageHeight - margin) {
            pdf.addPage();
            y = margin;
          }
          pdf.text(line, margin, y);
          y += lineHeight;
        }
        y += lineHeight;
      }
      pdf.setFontSize(9);
      pdf.setTextColor(100, 100, 100);
      pdf.text(
        `Généré par Bob — ${new Date().toLocaleDateString("fr-FR", { dateStyle: "medium" })}`,
        pageWidth / 2,
        pageHeight - 10,
        { align: "center" }
      );
      const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const blob = pdf.output("blob");
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        pdf.save(`bob-conversation-${new Date().toISOString().slice(0, 10)}.pdf`);
      }
      toast.success("Conversation exportée en PDF");
    } catch (e) {
      console.error(e);
      toast.error("Erreur lors de l'export");
    }
  }, [messages]);

  const handleNewConversation = useCallback(() => {
    setMessages([]);
    setHasStarted(true);
    setError(null);
    setDraftContent("");
    setMenuOpen(false);
    toast.success("Nouvelle conversation");
  }, []);

  useEffect(() => {
    if (!pdfExportMessageId || !pdfExportRef.current) return;
    const msg = messages.find((m) => m.id === pdfExportMessageId);
    if (!msg?.content) {
      setPdfExportMessageId(null);
      return;
    }
    const run = async () => {
      await new Promise((r) => setTimeout(r, 100));
      const el = pdfExportRef.current;
      if (!el) {
        setPdfExportMessageId(null);
        return;
      }
      if (msg.content.length > PDF_EXPORT_MAX_CHARS) {
        toast.warning("Réponse très longue, l'export peut prendre quelques secondes.");
      }
      try {
        const canvas = await html2canvas(el, {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: "#f8fafc",
        });
        const imgData = canvas.toDataURL("image/jpeg", 0.85);
        const pdf = new jsPDF("p", "mm", "a4");
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        const margin = 15;
        const contentWidth = pageWidth - 2 * margin;
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = margin;
        pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        while (heightLeft > 0) {
          position = heightLeft - imgHeight + margin;
          pdf.addPage();
          pdf.addImage(imgData, "JPEG", margin, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        pdf.setFontSize(9);
        pdf.setTextColor(100, 100, 100);
        const footerY = pageHeight - 10;
        pdf.text(
          `Généré par Bob — ${new Date().toLocaleDateString("fr-FR", { dateStyle: "medium" })}`,
          pageWidth / 2,
          footerY,
          { align: "center" }
        );
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        if (isMobile) {
          const blob = pdf.output("blob");
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setTimeout(() => URL.revokeObjectURL(url), 5000);
        } else {
          pdf.save(`bob-reponse-${pdfExportMessageId.slice(0, 8)}.pdf`);
        }
        toast.success("PDF généré");
      } catch (e) {
        console.error(e);
        toast.error("Erreur lors de la génération du PDF");
      } finally {
        setPdfExportMessageId(null);
      }
    };
    run();
  }, [pdfExportMessageId, messages]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-950 md:px-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/commun/agents-ia" aria-label="Retour aux agents IA">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            Bob — Assistant agence Santé & Prévoyance
          </h1>
        </div>
        {hasStarted && (
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1.5"
                      onClick={handleExportConversationPdf}
                      aria-label="Exporter la conversation en PDF"
                    >
                      <FileDown className="h-4 w-4" />
                      <span className="hidden sm:inline">Exporter en PDF</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>Exporter la conversation entière en PDF</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Popover open={menuOpen} onOpenChange={setMenuOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-9 w-9"
                  aria-label="Menu options"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2" align="end">
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 font-normal"
                  size="sm"
                  onClick={() => {
                    handleExportConversationPdf();
                    setMenuOpen(false);
                  }}
                  disabled={messages.length === 0}
                >
                  <FileDown className="h-4 w-4" />
                  Exporter la conversation en PDF
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-2 font-normal"
                  size="sm"
                  onClick={handleNewConversation}
                >
                  <MessageSquarePlus className="h-4 w-4" />
                  Nouvelle conversation
                </Button>
              </PopoverContent>
            </Popover>
          </div>
        )}
      </header>

      <main className="flex flex-1 flex-col overflow-hidden">
        {!hasStarted ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
            <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-teal-500/30 shadow-md md:h-40 md:w-40">
              <Image
                src="/agents-ia/bot-sante/bob_rit.png"
                alt="Bob, votre assistant agence santé et prévoyance"
                fill
                className="object-cover object-center"
                sizes="(max-width: 768px) 128px, 160px"
                priority
              />
            </div>
            <p className="max-w-sm text-center text-slate-600 dark:text-slate-400">
              Je suis Bob, votre assistant agence santé et prévoyance. Arguments commerciaux et technique, avec sources.
            </p>
            <Button
              size="lg"
              onClick={handleBonjour}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Bonjour
            </Button>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">
            <div className="flex flex-col flex-1 min-w-0">
            <div
              ref={messagesContainerRef}
              className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6 space-y-4"
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
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-teal-500/30">
                      <Image
                        src="/agents-ia/bot-sante/bob_reflechit.png"
                        alt="Bob"
                        fill
                        className="object-cover object-center"
                        sizes="40px"
                      />
                    </div>
                  )}
                  <div
                    className={cn(
                      "relative max-w-[85%] rounded-2xl px-4 py-3",
                      msg.role === "user"
                        ? "bg-teal-600 text-white rounded-tr-sm"
                        : "bg-slate-100 dark:bg-slate-800 rounded-tl-sm"
                    )}
                  >
                    {msg.role === "assistant" && msg.content && (
                      <div className="absolute top-1 right-1 flex gap-0.5 opacity-70 hover:opacity-100">
                        <TooltipProvider delayDuration={300}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleDownloadPdf(msg.id)}
                                disabled={pdfExportMessageId !== null}
                                aria-label="Télécharger en PDF"
                              >
                                <FileDown className="h-3.5 w-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Télécharger en PDF</p>
                            </TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => handleCopy(msg.id, msg.content)}
                                aria-label="Copier la réponse"
                              >
                                {copiedMessageId === msg.id ? (
                                  <Check className="h-3.5 w-3.5 text-teal-500" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="left">
                              <p>Copier</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                    {msg.role === "user" ? (
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    ) : (
                      <div className="pr-8">
                        <MarkdownRenderer content={msg.content || ""} />
                        {msg.content.length > 80 && (
                          <div className="mt-3 flex flex-wrap gap-1.5 border-t border-slate-200/80 dark:border-slate-600/80 pt-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                              onClick={() => setDraftContent(msg.content)}
                              disabled={isLoading}
                            >
                              Mettre dans le brouillon
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                              onClick={() =>
                                sendMessage("Transforme la réponse précédente en mail professionnel prêt à envoyer.")
                              }
                              disabled={isLoading}
                            >
                              Transformer en synthèse pour mon expert
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-slate-600 dark:text-slate-400 hover:text-teal-600 dark:hover:text-teal-400"
                              onClick={() =>
                                sendMessage("Résume la réponse précédente en 3 points courts.")
                              }
                              disabled={isLoading}
                            >
                              Résumer en 3 points
                            </Button>
                          </div>
                        )}
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 border-t border-slate-200/80 dark:border-slate-600/80 pt-2">
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Sources</p>
                            <ul className="text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                              {msg.sources.map((s, i) => (
                                <li key={i}>
                                  {s.name}
                                  {s.pages != null ? ` — ${s.pages}` : " — pages non détectées"}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-teal-500/30">
                    <Image
                      src="/agents-ia/bot-sante/bob_reflechit.png"
                      alt="Bob"
                      fill
                      className="object-cover object-center"
                      sizes="40px"
                    />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl rounded-tl-sm bg-slate-100 dark:bg-slate-800 px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    <span className="text-sm text-slate-500">Bob écrit…</span>
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

            {hasStarted &&
              !isLoading &&
              messages.some((m) => m.role === "assistant" && m.content.length > 0) && (
                <div className="shrink-0 border-t border-slate-200 dark:border-slate-800 px-4 py-3">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                    Que souhaitez-vous faire ?
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTIONS_DEMARRAGE.map((s) => (
                      <Button
                        key={s.label}
                        variant="outline"
                        size="sm"
                        className="h-auto py-1.5 px-3 text-xs font-normal rounded-full border-slate-200 dark:border-slate-700 hover:bg-teal-50 hover:border-teal-200 dark:hover:bg-teal-950/50 dark:hover:border-teal-800"
                        onClick={() => sendMessage(s.message)}
                      >
                        {s.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

            <div
              className="shrink-0 border-t border-slate-200 dark:border-slate-800 p-4"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              {(selectedImages.length > 0 || selectedFiles.length > 0) && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedImages.map((img) => (
                    <div key={img.id} className="relative group">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt="Aperçu"
                        className="h-14 w-14 object-cover rounded border border-slate-200 dark:border-slate-700"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 hover:bg-red-600 text-white rounded-full opacity-90 hover:opacity-100"
                        onClick={() => removeImage(img.id)}
                        aria-label="Retirer l'image"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  {selectedFiles.map((f) => {
                    const isPdf = f.name?.toLowerCase().endsWith(".pdf");
                    return (
                      <div
                        key={f.id}
                        className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-sm"
                      >
                        <FileText
                          className={cn(
                            "h-4 w-4 shrink-0",
                            isPdf ? "text-red-600 dark:text-red-400" : "text-slate-500"
                          )}
                        />
                        <span className="truncate max-w-[120px]">{f.name}</span>
                        {isPdf && (
                          <span className="text-[10px] font-medium uppercase text-red-600 dark:text-red-400 shrink-0">
                            PDF
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 shrink-0"
                          onClick={() => removeFile(f.id)}
                          aria-label="Retirer le fichier"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  aria-hidden
                />
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,image/*"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  aria-hidden
                />
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  placeholder="Tapez votre message ou collez une image (Ctrl+V / Cmd+V)"
                  disabled={isLoading || isProcessingFiles}
                  className="min-h-[52px] max-h-[180px] resize-none flex-1"
                  rows={2}
                />
                <div className="flex flex-col gap-1 shrink-0">
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => imageInputRef.current?.click()}
                          disabled={isLoading || isProcessingFiles}
                          aria-label="Ajouter une image"
                        >
                          <ImageIcon className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Ajouter une image ou une capture d'écran</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Collez avec Ctrl+V ou Cmd+V</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isLoading || isProcessingFiles || selectedFiles.length >= MAX_FILES_PER_MESSAGE}
                          aria-label="Ajouter un fichier"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Ajouter un document (PDF, Word, Excel, TXT, CSV)</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Les images envoyées ici sont aussi analysées</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          onClick={handleSubmit}
                          disabled={
                            (!input.trim() && selectedImages.length === 0 && selectedFiles.length === 0) ||
                            isLoading ||
                            isProcessingFiles
                          }
                          size="icon"
                          className="h-9 w-9 bg-teal-600 hover:bg-teal-700"
                          aria-label="Envoyer le message"
                        >
                          {isLoading || isProcessingFiles ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        <p>Envoyer le message</p>
                        <p className="text-xs text-muted-foreground mt-0.5">Ou appuyez sur Entrée</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-1.5">
                Entrée pour envoyer · Shift+Entrée pour un saut de ligne · Ctrl+V pour coller une image
              </p>
              <p className="text-xs text-amber-600 dark:text-amber-500 mt-1" role="status">
                Évitez de coller mots de passe, RIB ou infos sensibles.
              </p>
              <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                <Checkbox
                  checked={maskBeforeCopy}
                  onCheckedChange={(v) => setMaskBeforeCopy(v === true)}
                  aria-label="Masquer données sensibles avant copie"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Masquer données sensibles avant copie
                </span>
              </label>
            </div>
            </div>

            <aside className="hidden lg:flex flex-col w-[min(400px,40vw)] shrink-0 border-l border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="shrink-0 border-b border-slate-200 dark:border-slate-800 px-4 py-2">
                <h2 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  Brouillon
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Modifiez puis copiez ou exportez en PDF
                </p>
              </div>
              <div className="flex-1 min-h-0 flex flex-col p-3">
                <Textarea
                  value={draftContent}
                  onChange={(e) => setDraftContent(e.target.value)}
                  placeholder="Le contenu déposé par Bob apparaît ici…"
                  className="flex-1 min-h-[120px] resize-none text-sm"
                />
                <div className="flex gap-2 mt-2 shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      if (!draftContent.trim()) return;
                      const toCopy = maskBeforeCopy ? maskSensitive(draftContent.trim()) : draftContent.trim();
                      try {
                        await navigator.clipboard.writeText(toCopy);
                        toast.success("Brouillon copié");
                      } catch {
                        toast.error("Erreur lors de la copie");
                      }
                    }}
                    disabled={!draftContent.trim()}
                  >
                    <Copy className="h-3.5 w-3.5 mr-1" />
                    Copier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={async () => {
                      if (!draftContent.trim()) return;
                      try {
                        const pdf = new jsPDF("p", "mm", "a4");
                        const pageWidth = pdf.internal.pageSize.getWidth();
                        const pageHeight = pdf.internal.pageSize.getHeight();
                        const margin = 15;
                        const lineHeight = 6;
                        let y = margin;
                        pdf.setFontSize(11);
                        const lines = pdf.splitTextToSize(draftContent.trim(), pageWidth - 2 * margin);
                        for (const line of lines) {
                          if (y + lineHeight > pageHeight - margin) {
                            pdf.addPage();
                            y = margin;
                          }
                          pdf.text(line, margin, y);
                          y += lineHeight;
                        }
                        pdf.setFontSize(9);
                        pdf.setTextColor(100, 100, 100);
                        pdf.text(
                          `Généré par Bob — ${new Date().toLocaleDateString("fr-FR", { dateStyle: "medium" })}`,
                          pageWidth / 2,
                          pageHeight - 10,
                          { align: "center" }
                        );
                        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
                        if (isMobile) {
                          const blob = pdf.output("blob");
                          const url = URL.createObjectURL(blob);
                          window.open(url, "_blank");
                          setTimeout(() => URL.revokeObjectURL(url), 5000);
                        } else {
                          pdf.save("bob-brouillon.pdf");
                        }
                        toast.success("PDF généré");
                      } catch (e) {
                        console.error(e);
                        toast.error("Erreur lors de la génération du PDF");
                      }
                    }}
                    disabled={!draftContent.trim()}
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                    Télécharger PDF
                  </Button>
                </div>
              </div>
            </aside>

            {pdfExportMessageId && (() => {
              const msg = messages.find((m) => m.id === pdfExportMessageId);
              if (!msg?.content) return null;
              return (
                <div
                  ref={pdfExportRef}
                  className="bob-pdf-export fixed left-[-9999px] top-0 w-[210mm] max-w-[210mm] bg-slate-50 dark:bg-slate-900 p-6 prose prose-sm dark:prose-invert"
                  aria-hidden
                >
                  <MarkdownRenderer content={msg.content} />
                </div>
              );
            })()}
          </div>
        )}
      </main>
    </div>
  );
}
