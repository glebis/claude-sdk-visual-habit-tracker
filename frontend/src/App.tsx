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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Zap } from "lucide-react";

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

  const [filter, setFilter] = useState<FilterOption>("all");
  const [sort, setSort] = useState<SortOption>("streak");
  const [latestImage, setLatestImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

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
    <div className="min-h-screen p-6 md:p-8 lg:p-10 max-w-7xl mx-auto lg:h-screen lg:flex lg:flex-col lg:overflow-hidden">
      {/* Main layout -- viewport-locked on desktop, scrollable on mobile */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:grid-rows-[minmax(0,1fr)] lg:gap-8 lg:flex-1 lg:min-h-0">
        {/* Left column: Header + Habits + Stats + Art */}
        <div className="flex flex-col gap-5 lg:min-h-0 lg:overflow-y-auto lg:pr-3">
          <header className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Zap className="h-5 w-5 text-primary" />
              <h1 className="text-2xl font-semibold tracking-tight">
                Habits
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Select value={filter} onValueChange={(v) => setFilter(v as FilterOption)}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="due">Due today</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                  <SelectItem value="streaking">On streak</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                <SelectTrigger className="w-[100px] h-8 text-xs">
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
          <div className="shrink-0">
            <ProgressArt
              latestImage={latestImage}
              onRequestArt={handleRequestArt}
              isGenerating={isGenerating}
            />
          </div>
        </div>

        {/* Right column: Chat (full height) */}
        <div className="min-h-[400px] lg:min-h-0 lg:flex lg:flex-col">
          <AgentChat
            messages={messages}
            isConnected={isConnected}
            isThinking={isThinking}
            onSend={sendMessage}
          />
        </div>
      </div>
    </div>
  );
}

export default App;
