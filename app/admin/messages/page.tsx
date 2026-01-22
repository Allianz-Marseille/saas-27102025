"use client";

import { useState } from "react";
import { RouteGuard } from "@/components/auth/route-guard";
import { AdminMessageList } from "@/components/messages/admin-message-list";
import { MessageForm } from "@/components/messages/message-form";
import { MessageModal } from "@/components/messages/message-modal";
import { ScheduledMessagesList } from "@/components/messages/scheduled-messages-list";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, Inbox, Clock } from "lucide-react";
import { AdminMessage } from "@/types/message";
import { useMessages } from "@/lib/hooks/use-messages";

/**
 * Journal admin (ADMIN uniquement, version basique)
 */
export default function AdminMessagesPage() {
  const { messages, refetch } = useMessages();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMessageClick = (message: AdminMessage) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };

  const handleFormSuccess = () => {
    refetch();
  };

  return (
    <RouteGuard allowedRoles={["ADMINISTRATEUR"]}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Messages</h1>
            <p className="text-muted-foreground mt-1">
              Gérez les messages envoyés aux commerciaux
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau message
          </Button>
        </div>

        {/* Onglets : Messages envoyés / Messages programmés */}
        <Tabs defaultValue="sent" className="space-y-4">
          <TabsList>
            <TabsTrigger value="sent" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Messages envoyés
            </TabsTrigger>
            <TabsTrigger value="scheduled" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Messages programmés
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sent">
            <AdminMessageList onMessageClick={handleMessageClick} />
          </TabsContent>

          <TabsContent value="scheduled">
            <ScheduledMessagesList />
          </TabsContent>
        </Tabs>

        {/* Formulaire de création */}
        <MessageForm
          open={isFormOpen}
          onClose={() => setIsFormOpen(false)}
          onSuccess={handleFormSuccess}
        />

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
