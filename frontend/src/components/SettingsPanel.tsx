import { useState, useEffect } from "react";
import type { Settings, ProofStrictness, StreakReset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Settings2 } from "lucide-react";

interface SettingsPanelProps {
  settings: Settings | null;
  onSave: (updates: Partial<Settings>) => Promise<Settings | null>;
  onDataPathChange?: () => void;
}

export function SettingsPanel({ settings, onSave, onDataPathChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Local form state
  const [imagePrompt, setImagePrompt] = useState("");
  const [personalPrompt, setPersonalPrompt] = useState("");
  const [proofStrictness, setProofStrictness] = useState<ProofStrictness>("normal");
  const [streakReset, setStreakReset] = useState<StreakReset>("strict");
  const [artModel, setArtModel] = useState("");
  const [dataPath, setDataPath] = useState("");

  // Sync local state when dialog opens
  useEffect(() => {
    if (open && settings) {
      setImagePrompt(settings.image_prompt);
      setPersonalPrompt(settings.personal_prompt);
      setProofStrictness(settings.proof_strictness);
      setStreakReset(settings.streak_reset);
      setArtModel(settings.art_model);
      setDataPath(settings.data_path);
    }
  }, [open, settings]);

  const handleSave = async () => {
    setSaving(true);
    const dataPathChanged = settings && dataPath !== settings.data_path;

    await onSave({
      image_prompt: imagePrompt,
      personal_prompt: personalPrompt,
      proof_strictness: proofStrictness,
      streak_reset: streakReset,
      art_model: artModel,
      data_path: dataPath,
    });

    if (dataPathChanged && onDataPathChange) {
      onDataPathChange();
    }

    setSaving(false);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          <Settings2 className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>Customize your habit tracker.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-muted-foreground">Art Style Prompt</label>
            <Textarea
              value={imagePrompt}
              onChange={(e) => setImagePrompt(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Personal Prompt</label>
            <Textarea
              value={personalPrompt}
              onChange={(e) => setPersonalPrompt(e.target.value)}
              placeholder="Extra instructions for the agent (tone, language, etc.)"
              rows={2}
              className="mt-1"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Proof Strictness</label>
              <Select
                value={proofStrictness}
                onValueChange={(v) => setProofStrictness(v as ProofStrictness)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="lenient">Lenient</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="strict">Strict</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground">Streak Reset</label>
              <Select
                value={streakReset}
                onValueChange={(v) => setStreakReset(v as StreakReset)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict</SelectItem>
                  <SelectItem value="forgiving">Forgiving</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Art Model</label>
            <Input
              value={artModel}
              onChange={(e) => setArtModel(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm text-muted-foreground">Data Path</label>
            <Input
              value={dataPath}
              onChange={(e) => setDataPath(e.target.value)}
              className="mt-1"
            />
          </div>

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
