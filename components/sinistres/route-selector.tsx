/**
 * Composant de sélection de route pour un sinistre
 */

"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SinistreRoute } from "@/types/sinistre";
import { Wrench, Search, Car, Heart, Building, Scale } from "lucide-react";

interface RouteSelectorProps {
  value?: SinistreRoute;
  onValueChange: (value: SinistreRoute | undefined) => void;
  disabled?: boolean;
}

const ROUTE_OPTIONS: Array<{
  value: SinistreRoute;
  label: string;
  icon: React.ElementType;
  description: string;
}> = [
  {
    value: SinistreRoute.ROUTE_A,
    label: "Route A - Réparation pilotée / réseau d'artisans",
    icon: Wrench,
    description: "Petits/moyens dommages réparables vite",
  },
  {
    value: SinistreRoute.ROUTE_B,
    label: "Route B - Expertise dommages",
    icon: Search,
    description: "Dommage important, besoin d'un rapport opposable",
  },
  {
    value: SinistreRoute.ROUTE_C,
    label: "Route C - Auto matériel conventionnel (IRSA)",
    icon: Car,
    description: "Accident matériel avec tiers, gestion inter-assureurs",
  },
  {
    value: SinistreRoute.ROUTE_D,
    label: "Route D - Auto corporel (IRCA)",
    icon: Heart,
    description: "Blessés, ITT, préjudices corporels",
  },
  {
    value: SinistreRoute.ROUTE_E,
    label: "Route E - Immeuble / dégât des eaux / incendie (IRSI)",
    icon: Building,
    description: "Dégâts des eaux/incendie dans immeuble",
  },
  {
    value: SinistreRoute.ROUTE_F,
    label: "Route F - Responsabilité / litige / protection juridique",
    icon: Scale,
    description: "Réclamation d'un tiers, mise en cause, litige",
  },
];

export function RouteSelector({
  value,
  onValueChange,
  disabled,
}: RouteSelectorProps) {
  const selectedRoute = ROUTE_OPTIONS.find((r) => r.value === value);

  return (
    <Select
      value={value || "none"}
      onValueChange={(val) =>
        onValueChange(val === "none" ? undefined : (val as SinistreRoute))
      }
      disabled={disabled}
    >
      <SelectTrigger>
        <SelectValue placeholder="Sélectionner une route">
          {selectedRoute && (
            <div className="flex items-center gap-2">
              <selectedRoute.icon className="h-4 w-4" />
              <span>{selectedRoute.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">Aucune route</SelectItem>
        {ROUTE_OPTIONS.map((route) => {
          const Icon = route.icon;
          return (
            <SelectItem key={route.value} value={route.value}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <div className="flex flex-col">
                  <span>{route.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {route.description}
                  </span>
                </div>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

