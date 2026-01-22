/**
 * Composant de gestion des notes pour un sinistre
 */

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare,
  Plus,
  Pencil,
  Trash2,
  User,
} from "lucide-react";
import { SinistreNote } from "@/types/sinistre";
import { getSinistreNotes } from "@/lib/firebase/sinistres";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/lib/firebase/use-auth";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { SinistreHistory } from "@/types/sinistre";

interface SinistreNotesProps {
  sinistreId: string;
}

export function SinistreNotes({ sinistreId }: SinistreNotesProps) {
  const { userData } = useAuth();
  const [notes, setNotes] = useState<SinistreNote[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState("");

  useEffect(() => {
    loadNotes();
  }, [sinistreId]);

  const loadNotes = async () => {
    setIsLoading(true);
    try {
      const data = await getSinistreNotes(sinistreId);
      setNotes(data);
    } catch (error) {
      console.error("Erreur lors du chargement des notes:", error);
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !userData || !db) return;

    setIsAdding(true);
    try {
      const notesRef = collection(db, "sinistres", sinistreId, "notes");
      const noteDoc = await addDoc(notesRef, {
        sinistreId,
        content: newNote.trim(),
        authorId: userData.id,
        authorEmail: userData.email || "",
        createdAt: Timestamp.now(),
      });

      // Enregistrer dans l'historique
      const historyRef = collection(db, "sinistres", sinistreId, "history");
      await addDoc(historyRef, {
        sinistreId,
        type: "note_added",
        field: "notes",
        description: `Note ajoutée: "${newNote.trim().substring(0, 50)}${newNote.trim().length > 50 ? "..." : ""}"`,
        authorId: userData.id,
        authorEmail: userData.email || "",
        timestamp: Timestamp.now(),
      });

      setNewNote("");
      toast.success("Note ajoutée avec succès");
      loadNotes();
    } catch (error) {
      console.error("Erreur lors de l'ajout de la note:", error);
      toast.error("Erreur lors de l'ajout de la note");
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim() || !db || !userData) return;

    try {
      const noteRef = doc(db, "sinistres", sinistreId, "notes", noteId);
      const note = notes.find((n) => n.id === noteId);
      
      await updateDoc(noteRef, {
        content: editingContent.trim(),
        updatedAt: Timestamp.now(),
      });

      // Enregistrer dans l'historique
      const historyRef = collection(db, "sinistres", sinistreId, "history");
      await addDoc(historyRef, {
        sinistreId,
        type: "note_updated",
        field: "notes",
        oldValue: note?.content.substring(0, 50),
        newValue: editingContent.trim().substring(0, 50),
        description: `Note modifiée`,
        authorId: userData.id,
        authorEmail: userData.email || "",
        timestamp: Timestamp.now(),
      });

      setEditingId(null);
      setEditingContent("");
      toast.success("Note modifiée avec succès");
      loadNotes();
    } catch (error) {
      console.error("Erreur lors de la modification de la note:", error);
      toast.error("Erreur lors de la modification de la note");
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!db || !userData) return;

    if (!confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) {
      return;
    }

    try {
      const note = notes.find((n) => n.id === noteId);
      const noteRef = doc(db, "sinistres", sinistreId, "notes", noteId);
      await deleteDoc(noteRef);

      // Enregistrer dans l'historique
      const historyRef = collection(db, "sinistres", sinistreId, "history");
      await addDoc(historyRef, {
        sinistreId,
        type: "note_deleted",
        field: "notes",
        oldValue: note?.content.substring(0, 50),
        description: `Note supprimée`,
        authorId: userData.id,
        authorEmail: userData.email || "",
        timestamp: Timestamp.now(),
      });

      toast.success("Note supprimée avec succès");
      loadNotes();
    } catch (error) {
      console.error("Erreur lors de la suppression de la note:", error);
      toast.error("Erreur lors de la suppression de la note");
    }
  };

  const canEditNote = (note: SinistreNote) => {
    if (!userData) return false;
    return userData.role === "ADMINISTRATEUR" || note.authorId === userData.id;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Notes ({notes.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Formulaire d'ajout */}
        <div className="space-y-2">
          <Textarea
            placeholder="Ajouter une note..."
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleAddNote}
            disabled={!newNote.trim() || isAdding}
            size="sm"
          >
            <Plus className="h-4 w-4 mr-2" />
            Ajouter une note
          </Button>
        </div>

        {/* Liste des notes */}
        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aucune note pour ce sinistre
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border rounded-lg p-4 space-y-2 bg-muted/50"
              >
                {editingId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingContent}
                      onChange={(e) => setEditingContent(e.target.value)}
                      rows={3}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleEditNote(note.id!)}
                        disabled={!editingContent.trim()}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingId(null);
                          setEditingContent("");
                        }}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>
                      {canEditNote(note) && (
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingId(note.id!);
                              setEditingContent(note.content);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteNote(note.id!)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <User className="h-3 w-3" />
                      <span>{note.authorEmail}</span>
                      <span>•</span>
                      <span>
                        {format(
                          note.createdAt instanceof Timestamp
                            ? note.createdAt.toDate()
                            : note.createdAt,
                          "dd/MM/yyyy à HH:mm"
                        )}
                      </span>
                      {note.updatedAt && (
                        <>
                          <span>•</span>
                          <span className="italic">
                            Modifié le{" "}
                            {format(
                              note.updatedAt instanceof Timestamp
                                ? note.updatedAt.toDate()
                                : note.updatedAt,
                              "dd/MM/yyyy à HH:mm"
                            )}
                          </span>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

