"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { MessageTemplate, MessageCategory } from "@/types/message";
import {
  getAllTemplates,
  getTemplatesByCategory,
  replaceTemplateVariables,
} from "@/lib/firebase/message-templates";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { FileText, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TemplateSelectorProps {
  onSelect: (template: MessageTemplate) => void;
  onApply: (title: string, content: string) => void;
  className?: string;
}

/**
 * Sélecteur de templates avec boutons rapides et variables dynamiques
 */
export function TemplateSelector({
  onSelect,
  onApply,
  className,
}: TemplateSelectorProps) {
  const { user, userData } = useAuth();
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<MessageCategory | "all">("all");
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [showVariables, setShowVariables] = useState(false);

  // Variables disponibles par défaut
  const defaultVariables: Record<string, string> = {
    nom_commercial: userData?.email?.split("@")[0] || "Commercial",
    date: format(new Date(), "dd/MM/yyyy"),
    date_complete: format(new Date(), "dd MMMM yyyy"),
    annee: new Date().getFullYear().toString(),
  };

  useEffect(() => {
    if (userData && isAdmin(userData)) {
      loadTemplates();
    }
  }, [userData, selectedCategory]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      let loadedTemplates: MessageTemplate[];
      if (selectedCategory === "all") {
        loadedTemplates = await getAllTemplates();
      } else {
        loadedTemplates = await getTemplatesByCategory(selectedCategory);
      }
      setTemplates(loadedTemplates);
    } catch (error) {
      console.error("Erreur lors du chargement des templates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplate(template);
      onSelect(template);
      setShowVariables(true);
    }
  };

  const handleApply = () => {
    if (!selectedTemplate) return;

    // Remplacer les variables
    const { title, content } = replaceTemplateVariables(
      selectedTemplate,
      defaultVariables
    );

    onApply(title, content);
    setSelectedTemplate(null);
    setShowVariables(false);
  };

  // Ne pas afficher pour les non-admins
  if (!userData || !isAdmin(userData)) {
    return null;
  }

  // Templates récurrents (les 3 plus récents)
  const recentTemplates = templates.slice(0, 3);

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Templates</span>
        </div>
        <Select
          value={selectedCategory}
          onValueChange={(value) =>
            setSelectedCategory(value as MessageCategory | "all")
          }
        >
          <SelectTrigger className="h-8 w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes</SelectItem>
            <SelectItem value="formation">Formation</SelectItem>
            <SelectItem value="commission">Commission</SelectItem>
            <SelectItem value="maintenance">Maintenance</SelectItem>
            <SelectItem value="information">Information</SelectItem>
            <SelectItem value="urgence">Urgence</SelectItem>
            <SelectItem value="autre">Autre</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Boutons rapides pour templates récurrents */}
      {recentTemplates.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {recentTemplates.map((template) => (
            <Button
              key={template.id}
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedTemplate(template);
                onSelect(template);
                setShowVariables(true);
              }}
              className="text-xs"
            >
              <FileText className="h-3 w-3 mr-1" />
              {template.name}
            </Button>
          ))}
        </div>
      )}

      {/* Sélecteur de template complet */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="w-full">
            <FileText className="h-4 w-4 mr-2" />
            {loading ? "Chargement..." : "Choisir un template"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-0" align="start">
          <div className="p-2 border-b">
            <p className="text-sm font-medium">Sélectionner un template</p>
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {loading ? (
              <div className="p-4 text-center">
                <Loader2 className="h-4 w-4 animate-spin mx-auto" />
              </div>
            ) : templates.length === 0 ? (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Aucun template disponible
              </div>
            ) : (
              <div className="p-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => {
                      handleTemplateSelect(template.id);
                      setShowVariables(true);
                    }}
                    className={cn(
                      "p-2 rounded cursor-pointer hover:bg-muted transition-colors",
                      selectedTemplate?.id === template.id && "bg-muted"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{template.name}</p>
                        {template.description && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {template.category && (
                        <Badge variant="secondary" className="text-xs">
                          {template.category}
                        </Badge>
                      )}
                    </div>
                    {template.variables && template.variables.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.variables.map((variable, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {variable}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      {/* Modal de variables si template sélectionné */}
      {selectedTemplate && showVariables && (
        <div className="p-3 border rounded-lg bg-muted/50 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Variables disponibles</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowVariables(false)}
            >
              ×
            </Button>
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {selectedTemplate.variables && selectedTemplate.variables.length > 0 ? (
              selectedTemplate.variables.map((variable, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <code className="bg-background px-1 rounded">{variable}</code>
                  <span>→</span>
                  <span>{defaultVariables[variable.replace(/[{}]/g, "")] || "N/A"}</span>
                </div>
              ))
            ) : (
              <p>Aucune variable dans ce template</p>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleApply}
            className="w-full mt-2"
          >
            Appliquer le template
          </Button>
        </div>
      )}
    </div>
  );
}
