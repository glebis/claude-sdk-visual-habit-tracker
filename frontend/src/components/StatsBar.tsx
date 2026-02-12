import { useEffect, useRef, useState } from "react";
import type { Stats } from "@/types";

interface StatsBarProps {
  stats: Stats | null;
}

function completionVibe(rate: number, doneToday: number, dueToday: number): string {
  if (dueToday === 0) return "Nothing due today. Enjoy the break.";
  if (rate === 100) return "All done. Clean sweep.";
  if (rate >= 75) return "Almost there. Finish strong.";
  if (rate >= 50) return "Halfway. Keep the momentum.";
  if (rate > 0) return "Good start. More to go.";
  return "Fresh day. Let's get moving.";
}

export function StatsBar({ stats }: StatsBarProps) {
  const [pulse, setPulse] = useState(false);
  const prevDoneRef = useRef<number | null>(null);

  useEffect(() => {
    if (stats === null) return;
    if (prevDoneRef.current !== null && prevDoneRef.current !== stats.done_today) {
      setPulse(true);
      const timeout = setTimeout(() => setPulse(false), 700);
      prevDoneRef.current = stats.done_today;
      return () => clearTimeout(timeout);
    }
    prevDoneRef.current = stats.done_today;
  }, [stats?.done_today]);

  // Set initial ref without triggering pulse
  useEffect(() => {
    if (stats !== null && prevDoneRef.current === null) {
      prevDoneRef.current = stats.done_today;
    }
  }, [stats]);

  if (!stats) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span
          className={`text-sm font-medium transition-transform duration-700 ease-in-out inline-block ${
            pulse ? "scale-110" : "scale-100"
          }`}
        >
          Today: {stats.done_today}/{stats.due_today}
        </span>
        <span className="text-sm text-muted-foreground">
          {stats.on_streak} on streak &middot; {stats.needs_attention} need
          attention
        </span>
      </div>

      {/* Custom progress bar */}
      <div className="h-3 w-full rounded-sm bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-primary rounded-sm transition-all duration-700 ease-in-out"
          style={{ width: `${stats.completion_rate}%` }}
        />
      </div>

      <p className="text-xs text-muted-foreground mt-1">
        {completionVibe(stats.completion_rate, stats.done_today, stats.due_today)}
      </p>
    </div>
  );
}
