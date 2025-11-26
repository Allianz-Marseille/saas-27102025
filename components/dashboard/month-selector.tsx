"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

interface MonthSelectorProps {
  selectedMonth: string;
  onMonthChange: (month: string) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const handlePreviousMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1);
    newDate.setMonth(newDate.getMonth() - 1);
    onMonthChange(format(newDate, "yyyy-MM"));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const newDate = new Date(year, month - 1);
    newDate.setMonth(newDate.getMonth() + 1);
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    if (newDate <= currentMonth) {
      onMonthChange(format(newDate, "yyyy-MM"));
    }
  };

  const isCurrentMonth = selectedMonth >= format(new Date(), "yyyy-MM");

  return (
    <div className="flex items-center gap-3">
      <Button
        variant="outline"
        size="icon"
        onClick={handlePreviousMonth}
        className="h-10 w-10 rounded-full border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
      >
        <ChevronLeft className="h-5 w-5" />
      </Button>

      <div className="min-w-[200px] px-6 py-2.5 rounded-full bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-blue-500/10 border border-blue-200/50 dark:border-blue-800/50 text-center">
        <span className="text-base font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
        </span>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={handleNextMonth}
        className="h-10 w-10 rounded-full border-2 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 dark:hover:from-blue-950/30 dark:hover:to-purple-950/30 hover:border-blue-300 dark:hover:border-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={isCurrentMonth}
      >
        <ChevronRight className="h-5 w-5" />
      </Button>
    </div>
  );
}

