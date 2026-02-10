import { useState, useEffect } from "react";
import type { Settings, ProofStrictness, StreakReset } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
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
import { Settings2, ChevronRight } from "lucide-react";

interface SettingsPanelProps {
  settings: Settings | null;
  onSave: (updates: Partial<Settings>) => Promise<Settings | null>;
  onDataPathChange?: () => void;
}

export function SettingsPanel({ settings, onSave, onDataPathChange }: SettingsPanelProps) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    if (!open) setShowAdvanced(false);
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
      <DialogContent className="bg-card border-border max-h-[85vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-sm font-medium">Photo Proof</label>
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
              <p className="text-xs text-muted-foreground mt-1">How strictly the agent checks proof photos</p>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium">Streaks</label>
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
              <p className="text-xs text-muted-foreground mt-1">Forgiving allows 1 missed day</p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Agent Personality</label>
            <Textarea
              value={personalPrompt}
              onChange={(e) => setPersonalPrompt(e.target.value)}
              placeholder="e.g. Be sarcastic, speak in Spanish, use sports metaphors..."
              rows={2}
              className="mt-1"
            />
          </div>

          {/* Advanced section */}
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight className={`h-3 w-3 transition-transform ${showAdvanced ? "rotate-90" : ""}`} />
            Advanced
          </button>

          {showAdvanced && (
            <div className="space-y-3 pl-4 border-l-2 border-border">
              <div>
                <label className="text-sm text-muted-foreground">Art Style Prompt</label>
                <Textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  rows={3}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Art Model</label>
                <Input
                  value={artModel}
                  onChange={(e) => setArtModel(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
              <div>
                <label className="text-sm text-muted-foreground">Data Path</label>
                <Input
                  value={dataPath}
                  onChange={(e) => setDataPath(e.target.value)}
                  className="mt-1 text-xs"
                />
              </div>
            </div>
          )}

          <Button onClick={handleSave} className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
