"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { MarkdownRenderer } from "@/components/assistant/MarkdownRenderer";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Link,
  Eye,
  Edit,
  Save,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getRelativeTime } from "@/lib/utils/date-helpers";

interface MessageEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSave?: (value: string) => Promise<void> | void;
  placeholder?: string;
  className?: string;
}

/**
 * Éditeur de contenu avec toolbar markdown et onglets Édition/Aperçu
 * - Toolbar markdown (gras, italique, listes, liens)
 * - Onglets "Édition" / "Aperçu" avec rendu markdown
 * - Sauvegarde automatique toutes les 30 secondes (brouillon)
 * - Indicateur de sauvegarde
 */
export function MessageEditor({
  value,
  onChange,
  onSave,
  placeholder = "Contenu du message (support markdown)",
  className,
}: MessageEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastValueRef = useRef<string>(value);

  // Sauvegarder automatiquement toutes les 30 secondes
  const autoSave = useCallback(async () => {
    if (!onSave || value === lastValueRef.current || value.trim().length === 0) {
      return;
    }

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      await onSave(value);
      lastValueRef.current = value;
      setLastSaved(new Date());
      setSaveStatus("saved");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde automatique:", error);
      setSaveStatus("error");
    } finally {
      setIsSaving(false);
    }
  }, [value, onSave]);

  // Démarrer l'auto-sauvegarde
  useEffect(() => {
    if (onSave) {
      // Sauvegarder immédiatement au premier changement
      const timer = setTimeout(() => {
        if (value !== lastValueRef.current && value.trim().length > 0) {
          autoSave();
        }
      }, 2000); // Délai de 2 secondes après le dernier changement

      // Puis sauvegarder toutes les 30 secondes
      saveIntervalRef.current = setInterval(() => {
        if (value !== lastValueRef.current && value.trim().length > 0) {
          autoSave();
        }
      }, 30000);

      return () => {
        clearTimeout(timer);
        if (saveIntervalRef.current) {
          clearInterval(saveIntervalRef.current);
        }
      };
    }
  }, [value, autoSave, onSave]);

  // Insérer du texte à la position du curseur
  const insertText = (before: string, after: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const newText =
      value.substring(0, start) +
      before +
      selectedText +
      after +
      value.substring(end);

    onChange(newText);

    // Restaurer le focus et la position du curseur
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + before.length + selectedText.length + after.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Actions de la toolbar
  const handleBold = () => insertText("**", "**");
  const handleItalic = () => insertText("*", "*");
  const handleUnorderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const newLine = line.trim().startsWith("- ") ? line : `- ${line}`;
    const newText =
      value.substring(0, lineStart) + newLine + value.substring(lineEnd === -1 ? value.length : lineEnd);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = lineStart + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const handleOrderedList = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const lineEnd = value.indexOf("\n", start);
    const line = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
    const newLine = /^\d+\.\s/.test(line.trim()) ? line : `1. ${line}`;
    const newText =
      value.substring(0, lineStart) + newLine + value.substring(lineEnd === -1 ? value.length : lineEnd);

    onChange(newText);
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = lineStart + newLine.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };
  const handleLink = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);

    if (selectedText) {
      insertText("[", `](url)`);
    } else {
      insertText("[texte du lien](url)");
    }
  };

  return (
    <div className={cn("space-y-2", className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between border rounded-lg p-2 bg-muted/50">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleBold}
            className="h-8 w-8 p-0"
            title="Gras (Ctrl+B)"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleItalic}
            className="h-8 w-8 p-0"
            title="Italique (Ctrl+I)"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleUnorderedList}
            className="h-8 w-8 p-0"
            title="Liste à puces"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleOrderedList}
            className="h-8 w-8 p-0"
            title="Liste numérotée"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-border mx-1" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLink}
            className="h-8 w-8 p-0"
            title="Lien"
          >
            <Link className="h-4 w-4" />
          </Button>
        </div>

        {/* Indicateur de sauvegarde */}
        {onSave && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            {saveStatus === "saving" && (
              <>
                <Save className="h-3 w-3 animate-spin" />
                <span>Sauvegarde...</span>
              </>
            )}
            {saveStatus === "saved" && lastSaved && (
              <>
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>Sauvegardé {getRelativeTime(lastSaved)}</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <span className="text-red-500">Erreur de sauvegarde</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Onglets Édition / Aperçu */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="edit" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Édition
          </TabsTrigger>
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Aperçu
          </TabsTrigger>
        </TabsList>

        <TabsContent value="edit" className="mt-2">
          <Textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            rows={12}
            className="font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="mt-2">
          <div className="min-h-[200px] p-4 border rounded-lg bg-background">
            {value.trim() ? (
              <MarkdownRenderer content={value} />
            ) : (
              <p className="text-muted-foreground text-sm italic">
                Aucun contenu à prévisualiser. Commencez à écrire dans l'onglet Édition.
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
