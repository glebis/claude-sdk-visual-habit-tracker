import { Flame, Snowflake } from "lucide-react";

interface StreakDisplayProps {
  streak: number;
  active: boolean;
}

export function StreakDisplay({ streak }: StreakDisplayProps) {
  if (streak === 0) {
    return (
      <div className="flex items-center gap-1 text-muted-foreground">
        <Snowflake className="h-5 w-5" />
        <span className="text-lg font-bold">0</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Flame className="h-5 w-5 text-primary" />
      <span className="text-lg font-bold text-primary">{streak}</span>
    </div>
  );
}
