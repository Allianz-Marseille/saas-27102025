/**
 * Composant de sélection d'affectation (chargé de clientèle)
 */

"use client";

import { useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getChargesClientele } from "@/lib/firebase/sinistres";
import { UserData } from "@/lib/firebase/auth";
import { UserPlus, UserX } from "lucide-react";
import { Loader2 } from "lucide-react";

interface AssigneeSelectorProps {
  value?: string; // userId
  onValueChange: (value: string | undefined) => void;
  disabled?: boolean;
}

export function AssigneeSelector({
  value,
  onValueChange,
  disabled,
}: AssigneeSelectorProps) {
  const [charges, setCharges] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCharges = async () => {
      try {
        const data = await getChargesClientele();
        setCharges(data);
      } catch (error) {
        console.error("Erreur lors du chargement des chargés de clientèle:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCharges();
  }, []);

  const selectedCharge = charges.find((c) => c.id === value);

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger>
          <SelectValue>
            <div className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Chargement...</span>
            </div>
          </SelectValue>
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select
      value={value || "none"}
      onValueChange={(val) => onValueChange(val === "none" ? undefined : val)}
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner un chargé de clientèle">
          {selectedCharge ? (
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{selectedCharge.email}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <UserX className="h-4 w-4" />
              <span>À affecter</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">À affecter</SelectItem>
        {charges.map((charge) => (
          <SelectItem key={charge.id} value={charge.id}>
            <div className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              <span>{charge.email}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

