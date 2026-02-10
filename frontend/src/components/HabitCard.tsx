import { useRef, useState, useEffect } from "react";
import type { Habit, Completion } from "@/types";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Camera, Check, Trash2, Undo2 } from "lucide-react";

interface HabitCardProps {
  habit: Habit;
  onComplete: (habitId: string, proofImage?: string) => void;
  onUncomplete: (habitId: string) => void;
  onUpdate: (habitId: string, fields: Partial<Pick<Habit, "name" | "description">>) => Promise<void>;
  onDelete: (habitId: string) => void;
  onUploadProof: (file: File) => Promise<string>;
}

const REGULARITY_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  "3x_week": "3x/wk",
  weekdays: "Weekdays",
  custom: "Custom",
};

const DOT_COUNT = 10;

function proofUrl(proofImage: string): string {
  const filename = proofImage.split("/").pop() ?? "";
  return `/api/uploads/${filename}`;
}

function CompletionDot({ completion, color }: { completion: Completion | null; color: string }) {
  const [hover, setHover] = useState(false);
  const hasImage = completion?.proof_image;

  return (
    <div
      className="relative"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div
        className={`h-2 w-2 rounded-full ${
          completion ? color : "bg-muted-foreground/20"
        } ${hasImage ? "ring-1 ring-foreground/15" : ""}`}
      />
      {hasImage && hover && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none">
          <div className="bg-background border border-border rounded-sm shadow-lg p-1 w-32">
            <img
              src={proofUrl(completion!.proof_image!)}
              alt={`Proof from ${completion!.date}`}
              className="w-full h-auto rounded-sm"
            />
            <p className="text-[10px] text-muted-foreground text-center mt-1">{completion!.date}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export function HabitCard({
  habit,
  onComplete,
  onUncomplete,
  onUpdate,
  onDelete,
  onUploadProof,
}: HabitCardProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);
  const isDone = habit.done_today;
  const isRest = !habit.due_today;

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(habit.name);

  // Build dot data: last DOT_COUNT slots, filled from completions
  const completions = [...habit.completions]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-DOT_COUNT);
  const emptySlots = DOT_COUNT - completions.length;

  useEffect(() => {
    if (!editing) setEditValue(habit.name);
  }, [habit.name, editing]);

  useEffect(() => {
    if (editing) editInputRef.current?.select();
  }, [editing]);

  const commitEdit = async () => {
    const trimmed = editValue.trim();
    setEditing(false);
    if (trimmed && trimmed !== habit.name) {
      await onUpdate(habit.id, { name: trimmed });
    } else {
      setEditValue(habit.name);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
    } else if (e.key === "Escape") {
      setEditValue(habit.name);
      setEditing(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const path = await onUploadProof(file);
    onComplete(habit.id, path);
  };

  const dotColor = "bg-primary";

  return (
    <div
      className={`group flex items-center gap-3 px-4 py-3 rounded-sm border bg-card transition-colors ${
        isDone
          ? "border-secondary/30 text-muted-foreground"
          : isRest
            ? "border-border/50 text-muted-foreground/50"
            : "border-border hover:border-primary/30"
      }`}
    >
      {/* Streak number */}
      <div className="w-10 shrink-0 text-center">
        <span
          className={`text-lg font-medium tabular-nums ${
            isDone
              ? "text-secondary"
              : habit.streak > 0
                ? "text-primary"
                : "text-muted-foreground/40"
          }`}
        >
          {habit.streak}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-8 bg-border/50 shrink-0" />

      {/* Name + schedule */}
      <div className="min-w-0 flex-1">
        {editing ? (
          <input
            ref={editInputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={commitEdit}
            onKeyDown={handleKeyDown}
            className="text-sm font-normal leading-tight w-full bg-transparent border-b border-primary/40 outline-none py-0.5"
          />
        ) : (
          <h3
            className="text-sm font-normal leading-tight truncate cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {habit.name}
          </h3>
        )}
        <p className="text-xs text-muted-foreground truncate">
          {REGULARITY_LABELS[habit.regularity]} &middot; {habit.duration_minutes} min
        </p>
      </div>

      {/* Completion dots -- hidden on very small screens */}
      <div className="hidden sm:flex items-center gap-1 shrink-0">
        {completions.map((c, i) => (
          <CompletionDot key={c.date + i} completion={c} color={dotColor} />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <CompletionDot key={`empty-${i}`} completion={null} color={dotColor} />
        ))}
        <span className="text-xs text-muted-foreground ml-1 tabular-nums">
          {completions.length}/{DOT_COUNT}
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        {isDone ? (
          <Button
            variant="outline"
            size="sm"
            className="group/done h-8 text-xs text-muted-foreground hover:text-primary hover:bg-primary/10 hover:border-primary/30"
            onClick={() => onUncomplete(habit.id)}
          >
            <Check className="h-3 w-3 mr-1 group-hover/done:hidden" />
            <Undo2 className="h-3 w-3 mr-1 hidden group-hover/done:inline" />
            <span className="group-hover/done:hidden">Done</span>
            <span className="hidden group-hover/done:inline">Undo</span>
          </Button>
        ) : isRest ? (
          <Button variant="ghost" size="sm" disabled className="h-8 text-xs">
            Rest
          </Button>
        ) : (
          <Button
            variant="default"
            size="sm"
            className="h-8 text-xs"
            onClick={() => fileInputRef.current?.click()}
          >
            <Camera className="h-3.5 w-3.5 mr-1" />
            Proof
          </Button>
        )}

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground/0 group-hover:text-muted-foreground hover:!text-destructive hover:bg-transparent"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete "{habit.name}"?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently remove the habit and all its completion history.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction variant="destructive" onClick={() => onDelete(habit.id)}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleProofUpload}
        />
      </div>
    </div>
  );
}
