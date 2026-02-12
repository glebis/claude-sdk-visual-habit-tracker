import type { Habit } from "@/types";
import { HabitCard } from "./HabitCard";

type FilterOption = "all" | "due" | "done" | "streaking";
type SortOption = "streak" | "name" | "created";

interface HabitListProps {
  habits: Habit[];
  filter: FilterOption;
  sort: SortOption;
  onComplete: (habitId: string, proofImage?: string) => void;
  onUncomplete: (habitId: string) => void;
  onUpdate: (habitId: string, fields: Partial<Pick<Habit, "name" | "description">>) => Promise<void>;
  onDelete: (habitId: string) => void;
  onUploadProof: (file: File) => Promise<string>;
}

export function HabitList({
  habits,
  filter,
  sort,
  onComplete,
  onUncomplete,
  onUpdate,
  onDelete,
  onUploadProof,
}: HabitListProps) {
  let filtered = [...habits];

  if (filter === "due") filtered = filtered.filter((h) => h.due_today && !h.done_today);
  if (filter === "done") filtered = filtered.filter((h) => h.done_today);
  if (filter === "streaking") filtered = filtered.filter((h) => h.streak > 0);

  if (sort === "streak") filtered.sort((a, b) => b.streak - a.streak);
  if (sort === "name") filtered.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === "created")
    filtered.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  return (
    <div className="space-y-2">
      {filtered.length === 0 ? (
        <div className="text-center py-10 space-y-2">
          {habits.length === 0 ? (
            <>
              <p className="text-sm font-medium text-foreground">
                No habits yet
              </p>
              <p className="text-xs text-muted-foreground">
                Hit "+ New" to start building something consistent.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              No habits match this filter.
            </p>
          )}
        </div>
      ) : (
        filtered.map((habit, i) => (
          <div
            key={habit.id}
            className="animate-fade-in-up"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            <HabitCard
              habit={habit}
              onComplete={onComplete}
              onUncomplete={onUncomplete}
              onUpdate={onUpdate}
              onDelete={onDelete}
              onUploadProof={onUploadProof}
            />
          </div>
        ))
      )}
    </div>
  );
}
