import type { Stats } from "@/types";
import { Progress } from "@/components/ui/progress";

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
  if (!stats) return null;

  return (
    <div className="rounded-sm border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium">
          Today: {stats.done_today}/{stats.due_today}
        </span>
        <span className="text-sm text-muted-foreground">
          {stats.on_streak} on streak &middot; {stats.needs_attention} need
          attention
        </span>
      </div>
      <Progress value={stats.completion_rate} className="h-2" />
      <p className="text-xs text-muted-foreground mt-1">
        {completionVibe(stats.completion_rate, stats.done_today, stats.due_today)}
      </p>
    </div>
  );
}
