"use client";

import { UsersRound } from "lucide-react";
import { GestionSalaries } from "@/components/admin/bs/GestionSalaries";

export default function CollaborateursPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
          <UsersRound className="w-5 h-5 text-violet-400" />
        </div>
        <h1 className="text-xl font-semibold">Collaborateurs</h1>
      </div>
      <GestionSalaries />
    </div>
  );
}
