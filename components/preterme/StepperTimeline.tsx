"use client";

import { Fragment } from "react";
import { CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep<T extends string> {
  id: T;
  label: string;
  icon: React.ElementType;
}

interface StepperTimelineProps<T extends string> {
  steps: TimelineStep<T>[];
  currentStep: T;
  completedSteps: Partial<Record<T, boolean>>;
  derivedDone?: Partial<Record<T, boolean>>;
  canAccess: (step: T) => boolean;
  onStepClick: (step: T) => void;
}

export function StepperTimeline<T extends string>({
  steps,
  currentStep,
  completedSteps,
  derivedDone = {},
  canAccess,
  onStepClick,
}: StepperTimelineProps<T>) {
  const isDone = (id: T) => !!(completedSteps[id] || derivedDone[id]);

  return (
    <div className="overflow-x-auto pb-1 -mx-1 px-1">
      <div className="flex items-start min-w-max w-full">
        {steps.map((s, i) => {
          const active     = currentStep === s.id;
          const done       = isDone(s.id);
          const accessible = canAccess(s.id);
          const isLast     = i === steps.length - 1;
          const Icon       = s.icon;
          const nextDone   = !isLast && isDone(steps[i + 1].id);

          return (
            <Fragment key={s.id}>
              {/* ── Nœud ── */}
              <button
                onClick={() => accessible && onStepClick(s.id)}
                disabled={!accessible}
                title={!accessible ? "Étape non encore disponible" : s.label}
                className={cn(
                  "flex flex-col items-center gap-1.5 shrink-0 group w-[72px]",
                  accessible ? "cursor-pointer" : "cursor-default"
                )}
              >
                {/* Cercle */}
                <div className={cn(
                  "h-8 w-8 rounded-full flex items-center justify-center transition-all duration-200",
                  done
                    ? "bg-emerald-500 text-white shadow-sm"
                    : active
                    ? "bg-sky-500 text-white ring-4 ring-sky-500/25"
                    : accessible
                    ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300 group-hover:bg-slate-300 dark:group-hover:bg-slate-600"
                    : "bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-600"
                )}>
                  {done
                    ? <CheckCircle2 className="h-4 w-4" />
                    : active
                    ? <Icon className="h-3.5 w-3.5" />
                    : <span className="text-[11px] font-bold">{i + 1}</span>
                  }
                </div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-medium leading-tight text-center w-full",
                  done
                    ? "text-emerald-600 dark:text-emerald-400"
                    : active
                    ? "text-sky-600 dark:text-sky-300"
                    : accessible
                    ? "text-slate-600 dark:text-slate-400"
                    : "text-slate-400 dark:text-slate-600"
                )}>
                  {s.label}
                </span>
              </button>

              {/* ── Connecteur ── */}
              {!isLast && (
                <div className="flex-1 min-w-3 flex items-start pt-[15px]">
                  <div className={cn(
                    "h-0.5 w-full transition-colors duration-300",
                    done && nextDone
                      ? "bg-emerald-400 dark:bg-emerald-600"
                      : done
                      ? "bg-gradient-to-r from-emerald-400 to-slate-300 dark:from-emerald-600 dark:to-slate-700"
                      : "bg-slate-200 dark:bg-slate-700"
                  )} />
                </div>
              )}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
}
