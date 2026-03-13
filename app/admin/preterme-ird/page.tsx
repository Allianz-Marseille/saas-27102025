"use client";

import { Shield, Construction } from "lucide-react";

export default function PretermeIrdPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <div className="h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
        <Shield className="h-8 w-8 text-slate-400" />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-slate-800 dark:text-white flex items-center justify-center gap-2">
          <Construction className="h-5 w-5 text-amber-500" />
          Prétermes IARD — en construction
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Ce module est en cours de refonte. Revenez bientôt.
        </p>
      </div>
    </div>
  );
}
