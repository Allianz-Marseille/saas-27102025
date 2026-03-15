"use client";

import { HardHat } from "lucide-react";

export default function BsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
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
  );
}
