"use client";

interface CountdownDialProps {
  secondsRemaining: number;
  totalSeconds: number;
}

export function CountdownDial({ secondsRemaining, totalSeconds }: CountdownDialProps) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, secondsRemaining / totalSeconds));
  const dashoffset = circumference * (1 - progress);

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeLabel = `${minutes}:${String(seconds).padStart(2, "0")}`;

  const strokeColor =
    progress > 0.4 ? "#22c55e" : progress > 0.15 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex items-center justify-center w-[56px] h-[56px]">
      <svg
        width="56"
        height="56"
        viewBox="0 0 60 60"
        className="-rotate-90 absolute inset-0"
      >
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-slate-200 dark:stroke-slate-700"
        />
        <circle
          cx="30"
          cy="30"
          r={radius}
          fill="none"
          strokeWidth="4"
          stroke={strokeColor}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          style={{ transition: "stroke-dashoffset 1s linear, stroke 0.5s ease" }}
        />
      </svg>
      <span
        className="relative z-10 text-[10px] font-mono font-bold tabular-nums leading-none"
        style={{ color: strokeColor }}
      >
        {timeLabel}
      </span>
    </div>
  );
}
