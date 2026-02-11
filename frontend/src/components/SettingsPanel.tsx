import { useState, useEffect } from "react";
import type { Settings, ProofStrictness, StreakReset, ArtPreset } from "@/types";
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
import { Settings2, ChevronRight, ImagePlus } from "lucide-react";

/** Color palette swatches per art preset -- displayed in the selector grid. */
const PRESET_META: Record<
  Exclude<ArtPreset, "custom">,
  { label: string; colors: string[] }
> = {
  arntz: {
    label: "Gerd Arntz Isotype",
    colors: ["#B85C38", "#6B7F3B", "#1B2A4A", "#C9A84C"],
  },
  bauhaus: {
    label: "Bauhaus",
    colors: ["#DD1C1A", "#1E6FD9", "#F5C518", "#FFFFFF"],
  },
  constructivist: {
    label: "Soviet Constructivism",
    colors: ["#CC1B1B", "#1A1A1A", "#F2F0EB", "#CC1B1B"],
  },
  art_deco: {
    label: "Art Deco",
    colors: ["#C9A84C", "#1A1A1A", "#F5F0E1", "#8B7536"],
  },
  pop_art: {
    label: "Pop Art",
    colors: ["#FF2D6B", "#FFD600", "#00C2FF", "#FF5722"],
  },
  swiss: {
    label: "Swiss International",
    colors: ["#1A1A1A", "#FFFFFF", "#DD1C1A", "#E8E8E8"],
  },
};

interface SettingsPanelProps {
  settings: Settings | null;
  onSave: (updates: Partial<Settings>) => Promise<Settings | null>;
  onDataPathChange?: () => void;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-medium tracking-widest uppercase text-muted-foreground/70 select-none">
      {children}
    </p>
  );
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
  const [artPreset, setArtPreset] = useState<ArtPreset>("arntz");
  const [includeProofImages, setIncludeProofImages] = useState(false);

  // Sync local state when dialog opens
  useEffect(() => {
    if (open && settings) {
      setImagePrompt(settings.image_prompt);
      setPersonalPrompt(settings.personal_prompt);
      setProofStrictness(settings.proof_strictness);
      setStreakReset(settings.streak_reset);
      setArtModel(settings.art_model);
      setDataPath(settings.data_path);
      setArtPreset(settings.art_preset ?? "arntz");
      setIncludeProofImages(settings.include_proof_images ?? false);
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
      art_preset: artPreset,
      include_proof_images: includeProofImages,
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

        <div className="space-y-5">
          {/* ── RULES ─────────────────────────── */}
          <div className="space-y-3">
            <SectionLabel>Rules</SectionLabel>
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
              </div>
            </div>
          </div>

          {/* ── ART STYLE ────────────────────── */}
          <div className="space-y-3">
            <SectionLabel>Art Style</SectionLabel>
            <div className="grid grid-cols-3 gap-2">
              {(Object.entries(PRESET_META) as [Exclude<ArtPreset, "custom">, typeof PRESET_META["arntz"]][]).map(
                ([key, meta]) => {
                  const selected = artPreset === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setArtPreset(key)}
                      className={`group/card relative flex flex-col items-start gap-1.5 p-2 border text-left transition-colors ${
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/30 bg-transparent"
                      }`}
                    >
                      {/* Color palette swatch row */}
                      <div className="flex gap-px w-full h-3 overflow-hidden">
                        {meta.colors.map((color, i) => (
                          <div
                            key={i}
                            className="flex-1 first:rounded-l-[1px] last:rounded-r-[1px]"
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] leading-tight font-medium truncate w-full">
                        {meta.label}
                      </span>
                      {/* Selection tick */}
                      {selected && (
                        <div className="absolute top-1 right-1 h-3 w-3 bg-primary rounded-full flex items-center justify-center">
                          <svg viewBox="0 0 12 12" className="h-2 w-2 text-primary-foreground" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M2.5 6.5L5 9L9.5 3.5" />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                }
              )}
              {/* Custom option */}
              <button
                type="button"
                onClick={() => setArtPreset("custom")}
                className={`flex flex-col items-start gap-1.5 p-2 border text-left transition-colors ${
                  artPreset === "custom"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30 bg-transparent"
                }`}
              >
                <div className="flex gap-px w-full h-3 overflow-hidden bg-muted-foreground/10 items-center justify-center">
                  <span className="text-[8px] text-muted-foreground/50 tracking-wider uppercase">Custom</span>
                </div>
                <span className="text-[11px] leading-tight font-medium">Custom prompt</span>
              </button>
            </div>

            {artPreset === "custom" && (
              <Textarea
                value={imagePrompt}
                onChange={(e) => setImagePrompt(e.target.value)}
                placeholder="Describe your desired art style..."
                rows={3}
                className="text-xs"
              />
            )}
          </div>

          {/* ── GENERATION ───────────────────── */}
          <div className="space-y-3">
            <SectionLabel>Generation</SectionLabel>
            <button
              type="button"
              onClick={() => setIncludeProofImages(!includeProofImages)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 border transition-colors ${
                includeProofImages
                  ? "border-secondary/40 bg-secondary/5"
                  : "border-border hover:border-primary/20"
              }`}
            >
              <ImagePlus className={`h-4 w-4 shrink-0 ${includeProofImages ? "text-secondary" : "text-muted-foreground/50"}`} />
              <div className="flex-1 text-left">
                <span className="text-sm font-medium block leading-tight">Use proof photos in art</span>
                <span className="text-[11px] text-muted-foreground leading-tight">
                  Generated art references your uploaded proofs
                </span>
              </div>
              {/* Retro toggle track */}
              <div
                className={`relative h-5 w-9 shrink-0 border transition-colors ${
                  includeProofImages
                    ? "bg-secondary border-secondary/60"
                    : "bg-muted-foreground/15 border-border"
                }`}
              >
                <div
                  className={`absolute top-0.5 h-3.5 w-3.5 bg-card border transition-all ${
                    includeProofImages
                      ? "left-[17px] border-secondary/60"
                      : "left-0.5 border-border"
                  }`}
                />
              </div>
            </button>
          </div>

          {/* ── PERSONALITY ───────────────────── */}
          <div className="space-y-2">
            <SectionLabel>Personality</SectionLabel>
            <Textarea
              value={personalPrompt}
              onChange={(e) => setPersonalPrompt(e.target.value)}
              placeholder="e.g. Be sarcastic, speak in Spanish, use sports metaphors..."
              rows={2}
            />
          </div>

          {/* ── ADVANCED ─────────────────────── */}
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
