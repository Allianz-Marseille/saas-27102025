"use client";

import { ChevronRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  onClick: () => void;
}

interface AntecedentsBreadcrumbProps {
  items: BreadcrumbItem[];
  onBack?: () => void;
}

export function AntecedentsBreadcrumb({
  items,
  onBack,
}: AntecedentsBreadcrumbProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex items-center gap-2 flex-wrap px-6 py-3 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
      {/* Bouton retour */}
      {onBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour
        </Button>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 flex-wrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <button
              onClick={item.onClick}
              className={cn(
                "text-sm transition-colors",
                index === items.length - 1
                  ? "text-orange-600 dark:text-orange-400 font-semibold"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              )}
            >
              {item.label}
            </button>
            {index < items.length - 1 && (
              <ChevronRight className="h-4 w-4 text-gray-400 dark:text-gray-600" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
