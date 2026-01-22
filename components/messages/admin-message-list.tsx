"use client";

import { useState, useMemo } from "react";
import { useMessages } from "@/lib/hooks/use-messages";
import { MessageCard } from "./message-card";
import { AdminMessage, MessagePriority, MessageCategory, MessageStatus } from "@/types/message";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LayoutGrid,
  List,
  Search,
  Filter,
  X,
  ArrowUpDown,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toDate } from "@/lib/utils/date-helpers";
import { togglePinMessage } from "@/lib/firebase/messages";
import { toast } from "sonner";
import { SavedFiltersManager } from "./saved-filters-manager";
import { SavedFilter } from "@/types/message";

interface AdminMessageListProps {
  onMessageClick?: (message: AdminMessage) => void;
}

type ViewMode = "grid" | "list";
type SortBy = "date" | "readRate" | "recipients" | "priority";
type SortOrder = "asc" | "desc";

interface MessageFilters {
  search: string;
  priority?: MessagePriority;
  category?: MessageCategory;
  status?: MessageStatus;
}

const ITEMS_PER_PAGE = 20;

/**
 * Liste améliorée des messages pour admin avec filtres, tri, recherche et pagination
 */
export function AdminMessageList({ onMessageClick }: AdminMessageListProps) {
  const { messages, loading, error, refetch } = useMessages();
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [sortBy, setSortBy] = useState<SortBy>("date");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filters, setFilters] = useState<MessageFilters>({ search: "" });
  const [currentPage, setCurrentPage] = useState(1);
  const [pinningMessageId, setPinningMessageId] = useState<string | null>(null);

  const handlePinToggle = async (messageId: string, pin: boolean) => {
    setPinningMessageId(messageId);
    try {
      await togglePinMessage(messageId, pin);
      toast.success(pin ? "Message épinglé" : "Message désépinglé");
      await refetch();
    } catch (error: any) {
      console.error("Erreur lors de l'épinglage:", error);
      toast.error(error.message || "Erreur lors de l'épinglage du message");
    } finally {
      setPinningMessageId(null);
    }
  };

  const handleApplySavedFilter = (filter: SavedFilter) => {
    // Appliquer les filtres
    const newFilters: MessageFilters = { search: "" };
    if (filter.status && filter.status.length > 0) {
      newFilters.status = filter.status[0];
    }
    if (filter.priority && filter.priority.length > 0) {
      newFilters.priority = filter.priority[0];
    }
    if (filter.category && filter.category.length > 0) {
      newFilters.category = filter.category[0];
    }
    setFilters(newFilters);

    // Appliquer le tri
    if (filter.sortBy) {
      const sortByMap: Record<string, SortBy> = {
        createdAt: "date",
        readCount: "readRate",
        recipients: "recipients",
        priority: "priority",
      };
      setSortBy(sortByMap[filter.sortBy] || "date");
    }
    if (filter.sortOrder) {
      setSortOrder(filter.sortOrder);
    }

    toast.success(`Filtre "${filter.name}" appliqué`);
  };

  // Filtrer les messages
  const filteredMessages = useMemo(() => {
    let result = [...messages];

    // Recherche full-text (titre + contenu)
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      result = result.filter(
        (msg) =>
          msg.title.toLowerCase().includes(searchLower) ||
          msg.content.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par priorité
    if (filters.priority) {
      result = result.filter((msg) => msg.priority === filters.priority);
    }

    // Filtre par catégorie
    if (filters.category) {
      result = result.filter((msg) => msg.category === filters.category);
    }

    // Filtre par statut
    if (filters.status) {
      result = result.filter((msg) => msg.status === filters.status);
    }

    return result;
  }, [messages, filters]);

  // Trier les messages (messages épinglés toujours en haut)
  const sortedMessages = useMemo(() => {
    const sorted = [...filteredMessages];

    sorted.sort((a, b) => {
      // Messages épinglés toujours en premier
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      
      // Si les deux sont épinglés ou non épinglés, appliquer le tri normal
      let comparison = 0;

      switch (sortBy) {
        case "date":
          const dateA = toDate(a.createdAt).getTime();
          const dateB = toDate(b.createdAt).getTime();
          comparison = dateA - dateB;
          break;
        case "readRate":
          const rateA = a.totalRecipients > 0 ? (a.readCount / a.totalRecipients) : 0;
          const rateB = b.totalRecipients > 0 ? (b.readCount / b.totalRecipients) : 0;
          comparison = rateA - rateB;
          break;
        case "recipients":
          comparison = a.totalRecipients - b.totalRecipients;
          break;
        case "priority":
          const priorityOrder: Record<MessagePriority, number> = {
            urgent: 4,
            high: 3,
            normal: 2,
            low: 1,
          };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return sorted;
  }, [filteredMessages, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(sortedMessages.length / ITEMS_PER_PAGE);
  const paginatedMessages = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return sortedMessages.slice(start, end);
  }, [sortedMessages, currentPage]);

  // Compter les filtres actifs
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.priority) count++;
    if (filters.category) count++;
    if (filters.status) count++;
    if (filters.search.trim()) count++;
    return count;
  }, [filters]);

  const updateFilter = (key: keyof MessageFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset à la première page
  };

  const clearFilter = (key: keyof MessageFilters) => {
    setFilters((prev) => ({ ...prev, [key]: key === "search" ? "" : undefined }));
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setFilters({ search: "" });
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-muted-foreground">Chargement des messages...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-destructive">Erreur : {error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Barre de recherche et filtres */}
      <div className="space-y-3">
        {/* Recherche */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher dans les messages (titre, contenu)..."
            value={filters.search}
            onChange={(e) => updateFilter("search", e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtres et contrôles */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Filtre par priorité */}
          <Select
            value={filters.priority || "all"}
            onValueChange={(value) =>
              updateFilter("priority", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes priorités</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
              <SelectItem value="high">Haute</SelectItem>
              <SelectItem value="normal">Normale</SelectItem>
              <SelectItem value="low">Basse</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre par catégorie */}
          <Select
            value={filters.category || "all"}
            onValueChange={(value) =>
              updateFilter("category", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="formation">Formation</SelectItem>
              <SelectItem value="commission">Commission</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
              <SelectItem value="information">Information</SelectItem>
              <SelectItem value="urgence">Urgence</SelectItem>
              <SelectItem value="autre">Autre</SelectItem>
            </SelectContent>
          </Select>

          {/* Filtre par statut */}
          <Select
            value={filters.status || "all"}
            onValueChange={(value) =>
              updateFilter("status", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="sent">Envoyé</SelectItem>
              <SelectItem value="scheduled">Programmé</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>

          {/* Tri */}
          <Select
            value={`${sortBy}-${sortOrder}`}
            onValueChange={(value) => {
              const [by, order] = value.split("-") as [SortBy, SortOrder];
              setSortBy(by);
              setSortOrder(order);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date (récent)
                </div>
              </SelectItem>
              <SelectItem value="date-asc">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Date (ancien)
                </div>
              </SelectItem>
              <SelectItem value="readRate-desc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taux de lecture (haut)
                </div>
              </SelectItem>
              <SelectItem value="readRate-asc">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Taux de lecture (bas)
                </div>
              </SelectItem>
              <SelectItem value="recipients-desc">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinataires (plus)
                </div>
              </SelectItem>
              <SelectItem value="recipients-asc">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinataires (moins)
                </div>
              </SelectItem>
              <SelectItem value="priority-desc">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Priorité (haute)
                </div>
              </SelectItem>
              <SelectItem value="priority-asc">
                <div className="flex items-center gap-2">
                  <ArrowUpDown className="h-4 w-4" />
                  Priorité (basse)
                </div>
              </SelectItem>
            </SelectContent>
          </Select>

          {/* Toggle vue */}
          <div className="flex items-center gap-1 border rounded-lg p-1 ml-auto">
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="h-8"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Gestionnaire de filtres sauvegardés */}
        <div className="border rounded-lg p-4 bg-muted/30">
          <SavedFiltersManager
            currentFilters={filters}
            currentSort={{ sortBy, sortOrder }}
            onApplyFilter={handleApplySavedFilter}
          />
        </div>

        {/* Badges de filtres actifs */}
        {activeFiltersCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Filtres actifs :</span>
            {filters.search.trim() && (
              <Badge variant="secondary" className="gap-1">
                Recherche: {filters.search}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("search")}
                />
              </Badge>
            )}
            {filters.priority && (
              <Badge variant="secondary" className="gap-1">
                Priorité: {filters.priority}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("priority")}
                />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="gap-1">
                Catégorie: {filters.category}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("category")}
                />
              </Badge>
            )}
            {filters.status && (
              <Badge variant="secondary" className="gap-1">
                Statut: {filters.status}
                <X
                  className="h-3 w-3 cursor-pointer"
                  onClick={() => clearFilter("status")}
                />
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-6 text-xs"
            >
              Tout effacer
            </Button>
          </div>
        )}

        {/* Résultats */}
        <div className="text-sm text-muted-foreground">
          {sortedMessages.length} message{sortedMessages.length > 1 ? "s" : ""} trouvé
          {sortedMessages.length !== messages.length && ` (sur ${messages.length} total)`}
        </div>
      </div>

      {/* Liste ou grille */}
      {paginatedMessages.length === 0 ? (
        <div className="flex items-center justify-center p-8">
          <p className="text-muted-foreground">Aucun message trouvé</p>
        </div>
      ) : (
        <>
          <div
            className={cn(
              viewMode === "grid"
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                : "space-y-4"
            )}
          >
            {paginatedMessages.map((message) => (
              <MessageCard
                key={message.id}
                message={message}
                onClick={() => onMessageClick?.(message)}
                onPinToggle={handlePinToggle}
                showAdminActions={true}
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
