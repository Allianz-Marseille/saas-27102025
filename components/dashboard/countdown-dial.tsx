"use client";

import { cn } from "@/lib/utils";

interface CountdownDialProps {
  secondsRemaining: number;
  totalSeconds: number;
  /** "sm" pour la sidebar (compact), "default" pour usage standard */
  size?: "default" | "sm";
}

const sizeConfig = {
  default: { box: 56, viewBox: 60, radius: 22, strokeWidth: 4, textClass: "text-[10px]" },
  sm: { box: 36, viewBox: 40, radius: 14, strokeWidth: 3, textClass: "text-[9px]" },
};

export function CountdownDial({ secondsRemaining, totalSeconds, size = "default" }: CountdownDialProps) {
  const config = sizeConfig[size];
  const { radius, viewBox, strokeWidth } = config;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const dashoffset = circumference * (1 - progress);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const strokeColor =
    progress > 0.4 ? "#22c55e" : progress > 0.15 ? "#f59e0b" : "#ef4444";

  const cx = viewBox / 2;
  const cy = viewBox / 2;

  return (
    <div
      className="relative flex items-center justify-center shrink-0"
      style={{ width: config.box, height: config.box }}
    >
      <svg
        width={config.box}
        height={config.box}
        viewBox={`0 0 ${viewBox} ${viewBox}`}
        className="-rotate-90 absolute inset-0"
      >
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          stroke={strokeColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      <span
        className={cn("relative z-10 font-mono font-bold tabular-nums leading-none", config.textClass)}
        style={{ color: strokeColor }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
