"use client";

import { useState } from "react";
import { Users, HelpCircle, BarChart3, LayoutDashboard } from "lucide-react";
import { GestionSalaries } from "@/components/admin/bs/GestionSalaries";

type Tab = "dashboard" | "salaries" | "faq";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "salaries", label: "Gestion salarié", icon: Users },
  { id: "faq", label: "FAQ", icon: HelpCircle },
];

export default function BsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
          <BarChart3 className="w-5 h-5 text-amber-500" />
        </div>
        <div>
          <h1 className="text-xl font-semibold">Bilan Social</h1>
          <p className="text-sm text-muted-foreground">Gestion RH et informations agence</p>
        </div>
      </div>

      {/* Menu tabs */}
      <div className="flex gap-2 border-b pb-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors -mb-px ${
              activeTab === id
                ? "border-primary text-primary bg-primary/5"
                : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Contenu */}
      <div>
        {activeTab === "dashboard" && (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground space-y-2">
            <LayoutDashboard className="w-10 h-10 mx-auto opacity-30" />
            <p className="font-medium">Dashboard à venir</p>
            <p className="text-sm">Les indicateurs du Bilan Social seront affichés ici.</p>
          </div>
        )}
        {activeTab === "salaries" && <GestionSalaries />}
        {activeTab === "faq" && (
          <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground space-y-2">
            <HelpCircle className="w-10 h-10 mx-auto opacity-30" />
            <p className="font-medium">FAQ à venir</p>
            <p className="text-sm">Les explications sur le fonctionnement du Bilan Social seront disponibles ici.</p>
          </div>
        )}
      </div>
    </div>
  );
}
