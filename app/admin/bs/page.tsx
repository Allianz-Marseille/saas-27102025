"use client";

import { HardHat, UsersRound } from "lucide-react";
import Link from "next/link";

export default function BsPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center justify-center py-12 gap-6 text-center">
        <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <HardHat className="w-10 h-10 text-amber-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">En construction</h1>
          <p className="text-muted-foreground text-lg">
            Cette section est en cours de développement.
          </p>
        </div>
      </div>

      {/* Raccourcis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/admin/collaborateurs">
          <div className="group rounded-xl border bg-card p-5 flex items-center gap-4 hover:shadow-md hover:border-violet-500/40 transition-all cursor-pointer">
            <div className="w-11 h-11 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-500/20 transition-colors shrink-0">
              <UsersRound className="w-5 h-5 text-violet-400" />
            </div>
            <div>
              <p className="font-semibold text-sm">Collaborateurs</p>
              <p className="text-xs text-muted-foreground">Gérer les effectifs</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
