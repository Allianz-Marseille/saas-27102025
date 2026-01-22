"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { UserMessageList } from "@/components/messages/user-message-list";
import { MessageModal } from "@/components/messages/message-modal";
import { AdminMessage } from "@/types/message";
import { useAuth } from "@/lib/firebase/use-auth";
import { isAdmin } from "@/lib/utils/roles";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Journal utilisateur (tous rôles sauf admin, version basique)
 */
export default function MessagesPage() {
  const { userData } = useAuth();
  const router = useRouter();
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Rediriger les admins vers la page admin
  useEffect(() => {
    if (userData && isAdmin(userData)) {
      router.push("/admin/messages");
    }
  }, [userData, router]);

  const handleMessageClick = (message: AdminMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  // Ne pas afficher si admin (sera redirigé)
  if (userData && isAdmin(userData)) {
    return null;
  }

  return (
    <RouteGuard requireAuth={true}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold">Mes messages</h1>
          <p className="text-muted-foreground mt-1">
            Consultez les messages qui vous ont été envoyés
          </p>
        </div>

        {/* Liste des messages */}
        <UserMessageList onMessageClick={handleMessageClick} />

        {/* Modale de détail */}
        <MessageModal
          message={selectedMessage}
          open={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedMessage(null);
          }}
        />
      </div>
    </RouteGuard>
  );
}
