"use client";

import { useUnreadMessages } from "@/lib/hooks/use-unread-messages";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Bell } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Badge de notification amélioré dans la sidebar
 * Affiche le nombre de messages non lus avec animation pulsante
 */
export function MessageBadge() {
  const { count, loading } = useUnreadMessages();

  if (loading || count === 0) {
    return null;
  }

  // Couleur dynamique selon le nombre de messages
  const getBadgeColor = () => {
    if (count >= 10) return "bg-red-500";
    if (count >= 5) return "bg-orange-500";
    return "bg-blue-500";
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href="/messages" className="relative inline-flex items-center">
            <Bell className="h-5 w-5" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 15 }}
            >
              <Badge
                variant="destructive"
                className={cn(
                  "absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs",
                  getBadgeColor(),
                  // Animation pulsante si messages non lus
                  "animate-pulse"
                )}
              >
                {count > 99 ? "99+" : count}
              </Badge>
            </motion.div>
          </Link>
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {count === 1 
              ? "1 message non lu" 
              : `${count} messages non lus`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
