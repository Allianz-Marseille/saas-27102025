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
    <div className="flex items-center gap-4">
      <Label className="text-base font-semibold">Mois</Label>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={handlePreviousMonth}
          className="h-9 w-9"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>

        <div className="min-w-[180px] text-center">
          <span className="text-lg font-semibold">
            {format(new Date(selectedMonth + "-01"), "MMMM yyyy", { locale: fr })}
          </span>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={handleNextMonth}
          className="h-9 w-9"
          disabled={isCurrentMonth}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}

