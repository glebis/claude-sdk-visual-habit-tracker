import { useState } from "react";
import type { Regularity } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";

interface AddHabitProps {
  onAdd: (data: {
    name: string;
    regularity: Regularity;
    duration_minutes: number;
    description?: string;
  }) => Promise<void>;
}

export function AddHabit({ onAdd }: AddHabitProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [regularity, setRegularity] = useState<Regularity>("daily");
  const [duration, setDuration] = useState("15");
  const [description, setDescription] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    await onAdd({
      name: name.trim(),
      regularity,
      duration_minutes: parseInt(duration) || 15,
      description: description.trim() || undefined,
    });

    setName("");
    setRegularity("daily");
    setDuration("15");
    setDescription("");
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          New
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Habit</DialogTitle>
          <DialogDescription>Set up a new habit to track.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Meditate"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Description</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">
                Regularity
              </label>
              <Select
                value={regularity}
                onValueChange={(v) => setRegularity(v as Regularity)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekdays">Weekdays</SelectItem>
                  <SelectItem value="3x_week">3x/week</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-24">
              <label className="text-sm text-muted-foreground">Minutes</label>
              <Input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                min="1"
                max="480"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={!name.trim()}>
            Add Habit
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
