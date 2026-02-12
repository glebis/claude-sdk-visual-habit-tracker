import { useState, useCallback, useRef, useEffect } from "react";
import { useHabits } from "@/hooks/useHabits";
import { useSettings } from "@/hooks/useSettings";
import { useAgent } from "@/hooks/useAgent";
import { HabitList } from "@/components/HabitList";
import { AddHabit } from "@/components/AddHabit";
import { SettingsPanel } from "@/components/SettingsPanel";
import { ProgressArt } from "@/components/ProgressArt";
import { AgentChat } from "@/components/AgentChat";
import { StatsBar } from "@/components/StatsBar";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ArtPreset } from "@/types";

/** Maps each art preset to UI accent colors (primary, secondary, accent). */
const PRESET_THEMES: Record<string, Record<string, string>> = {
  arntz: {
    "--primary": "#B85C38",
    "--primary-foreground": "#ffffff",
    "--secondary": "#6B7F3B",
    "--secondary-foreground": "#ffffff",
    "--accent": "#C9A84C",
    "--accent-foreground": "#1a1a1a",
  },
  bauhaus: {
    "--primary": "#DD1C1A",
    "--primary-foreground": "#ffffff",
    "--secondary": "#1E6FD9",
    "--secondary-foreground": "#ffffff",
    "--accent": "#F5C518",
    "--accent-foreground": "#1a1a1a",
  },
  constructivist: {
    "--primary": "#CC1B1B",
    "--primary-foreground": "#ffffff",
    "--secondary": "#2D2D2D",
    "--secondary-foreground": "#f2f0eb",
    "--accent": "#CC1B1B",
    "--accent-foreground": "#ffffff",
  },
  art_deco: {
    "--primary": "#C9A84C",
    "--primary-foreground": "#1a1a1a",
    "--secondary": "#2D2D2D",
    "--secondary-foreground": "#F5F0E1",
    "--accent": "#8B7536",
    "--accent-foreground": "#ffffff",
  },
  pop_art: {
    "--primary": "#FF2D6B",
    "--primary-foreground": "#ffffff",
    "--secondary": "#00C2FF",
    "--secondary-foreground": "#1a1a1a",
    "--accent": "#FFD600",
    "--accent-foreground": "#1a1a1a",
  },
  swiss: {
    "--primary": "#DD1C1A",
    "--primary-foreground": "#ffffff",
    "--secondary": "#333333",
    "--secondary-foreground": "#ffffff",
    "--accent": "#DD1C1A",
    "--accent-foreground": "#ffffff",
  },
};

type FilterOption = "all" | "due" | "done" | "streaking";
type SortOption = "streak" | "name" | "created";

function App() {
  const {
    habits,
    stats,
    loading,
    addHabit,
    updateHabit,
    completeHabit,
    deleteHabit,
    uncompleteHabit,
    uploadProof,
    refresh,
  } = useHabits();

  const { settings, updateSettings } = useSettings();

  // Apply preset color theme to :root CSS variables
  useEffect(() => {
    const el = document.documentElement;
    const preset = settings?.art_preset as ArtPreset | undefined;
    const theme = preset ? PRESET_THEMES[preset] : null;

    // CSS vars managed by this effect
    const MANAGED_VARS = [
      "--primary", "--primary-foreground",
      "--secondary", "--secondary-foreground",
      "--accent", "--accent-foreground",
    ];

    if (theme) {
      for (const [key, value] of Object.entries(theme)) {
        el.style.setProperty(key, value);
      }
      // Keep ring and destructive in sync with primary
      el.style.setProperty("--ring", theme["--primary"]);
      el.style.setProperty("--destructive", theme["--primary"]);
      el.style.setProperty("--destructive-foreground", theme["--primary-foreground"]);
    } else {
      // "custom" or unknown -- reset to CSS defaults
      for (const key of MANAGED_VARS) {
        el.style.removeProperty(key);
      }
      el.style.removeProperty("--ring");
      el.style.removeProperty("--destructive");
      el.style.removeProperty("--destructive-foreground");
    }

    return () => {
      for (const key of MANAGED_VARS) el.style.removeProperty(key);
      el.style.removeProperty("--ring");
      el.style.removeProperty("--destructive");
      el.style.removeProperty("--destructive-foreground");
    };
  }, [settings?.art_preset]);

  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("streak");
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const welcomeSent = useRef(false);

  const handleImage = useCallback((name: string) => {
    setLatestImage(name);
    setIsGenerating(false);
  }, []);

  const { messages, isConnected, isThinking, sendMessage } = useAgent(handleImage, refresh);

  const artTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return () => clearTimeout(artTimeoutRef.current);
  }, []);

  const handleRequestArt = () => {
    setIsGenerating(true);
    sendMessage("generate progress art");
    clearTimeout(artTimeoutRef.current);
    artTimeoutRef.current = setTimeout(() => setIsGenerating(false), 60000);
  };

  /** Called by ProgressArt when gallery is empty on first mount. */
  const handleRequestWelcomeArt = useCallback(() => {
    if (welcomeSent.current) return;
    welcomeSent.current = true;
    setIsGenerating(true);
    sendMessage(
      "This is a brand new user opening the app for the first time. " +
      "Generate a welcome progress art image. Before generating, " +
      "pick a short, famous motivational quote about starting or beginning " +
      "(attribute it to the author) and use it as the theme for the image. " +
      "The image should feel like a fresh start -- hopeful and energetic."
    );
    clearTimeout(artTimeoutRef.current);
    artTimeoutRef.current = setTimeout(() => setIsGenerating(false), 90000);
  }, [sendMessage]);

  const handleComplete = async (habitId: string, proofImage?: string) => {
    setIsGenerating(true);
    const habit = habits.find((h) => h.id === habitId);
    const name = habit?.name ?? "a habit";
    if (proofImage) {
      // Don't complete yet -- let agent verify first
      const filename = proofImage.split("/").pop() ?? "";
      sendMessage(
        `I uploaded proof for "${name}" (habit_id: ${habitId}). The proof image is at: ${proofImage}. Please verify the photo -- if it looks legit, mark the habit complete and generate progress art. If not, tell me why.`,
        { displayText: `Uploaded proof for "${name}"`, image: `/api/uploads/${filename}` },
      );
    } else {
      await completeHabit(habitId);
      sendMessage(
        `I just completed "${name}". Generate new progress art to celebrate.`
      );
    }
    clearTimeout(artTimeoutRef.current);
    artTimeoutRef.current = setTimeout(() => setIsGenerating(false), 60000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-sm text-muted-foreground animate-pulse">
          Waking up the habit engine...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 md:p-8 lg:p-6 max-w-[1600px] mx-auto lg:h-screen lg:flex lg:flex-col lg:overflow-hidden">
      {/* ── Unified header row ──────────────────────────── */}
      <header className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.6fr)] lg:gap-6 shrink-0 pb-4 border-b border-border mb-4">
        {/* Col 1 header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Progress Art
          </h2>
          <Button
            variant="default"
            size="sm"
            onClick={handleRequestArt}
            disabled={isGenerating}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isGenerating ? "animate-spin" : ""}`} />
            {isGenerating ? "Generating..." : "Generate"}
          </Button>
        </div>
        {/* Col 2 header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Habits
          </h2>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
              <SelectTrigger className="w-[90px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="due">Due</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="streaking">Streak</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
              <SelectTrigger className="w-[90px] h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="streak">Streak</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="created">Newest</SelectItem>
              </SelectContent>
            </Select>
            <AddHabit onAdd={addHabit} />
            <SettingsPanel
              settings={settings}
              onSave={updateSettings}
              onDataPathChange={refresh}
            />
          </div>
        </div>
        {/* Col 3 header */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
            Agent Chat
          </h2>
          <span className="text-xs text-muted-foreground font-light">
            {isConnected ? "Connected" : "Offline"}
          </span>
        </div>
      </header>

      {/* ── Content grid ───────────────────────────────── */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)_minmax(0,1.6fr)] lg:grid-rows-[minmax(0,1fr)] lg:gap-6 lg:flex-1 lg:min-h-0">
        {/* Column 1: Progress Art (tall portrait, no header on desktop) */}
        <div className="order-3 lg:order-1 lg:min-h-0 lg:flex lg:flex-col">
          <ProgressArt
            latestImage={latestImage}
            onRequestArt={handleRequestArt}
            onRequestWelcomeArt={handleRequestWelcomeArt}
            isGenerating={isGenerating}
            hideHeader
          />
        </div>

        {/* Column 2: Habits + Stats (no header on desktop) */}
        <div className="order-1 lg:order-2 flex flex-col gap-4 lg:min-h-0 lg:overflow-y-auto lg:pr-2">
          {/* Mobile-only header */}
          <header className="flex items-center justify-between shrink-0 lg:hidden">
            <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Habits
            </h2>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
                <SelectTrigger className="w-[90px] h-7 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="due">Due</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="streaking">Streak</SelectItem>
                </SelectContent>
              </Select>
              <AddHabit onAdd={addHabit} />
              <SettingsPanel
                settings={settings}
                onSave={updateSettings}
                onDataPathChange={refresh}
              />
            </div>
          </header>
          <div className="flex flex-col">
            <HabitList
              habits={habits}
              filter={filter}
              sort={sort}
              onComplete={handleComplete}
              onUncomplete={uncompleteHabit}
              onUpdate={updateHabit}
              onDelete={deleteHabit}
              onUploadProof={uploadProof}
            />
          </div>
          <div className="shrink-0">
            <StatsBar stats={stats} />
          </div>
        </div>

        {/* Column 3: Chat (no header on desktop) */}
        <div className="order-2 lg:order-3 min-h-[400px] lg:min-h-0 lg:flex lg:flex-col">
          <AgentChat
            messages={messages}
            isConnected={isConnected}
            isThinking={isThinking}
            onSend={sendMessage}
            hideHeader
          />
        </div>
      </div>
    </div>
  );
}

export default App;
