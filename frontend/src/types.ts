export type Regularity = "daily" | "weekly" | "3x_week" | "weekdays" | "custom";

export interface Completion {
  date: string;
  proof_image?: string;
  verified: boolean;
  duration_actual?: number;
}

export interface Habit {
  id: string;
  name: string;
  description: string;
  regularity: Regularity;
  custom_days?: number[];
  duration_minutes: number;
  streak: number;
  best_streak: number;
  completions: Completion[];
  created_at: string;
  due_today: boolean;
  done_today: boolean;
}

export interface Stats {
  total_habits: number;
  on_streak: number;
  due_today: number;
  done_today: number;
  completion_rate: number;
  needs_attention: number;
}

export interface AgentMessage {
  type: "text" | "tool_use" | "result" | "error" | "image";
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  cost?: number;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  image?: string;
  timestamp: number;
}

export type ProofStrictness = "lenient" | "normal" | "strict" | "off";
export type StreakReset = "strict" | "forgiving";

export interface Settings {
  image_prompt: string;
  personal_prompt: string;
  proof_strictness: ProofStrictness;
  data_path: string;
  art_model: string;
  streak_reset: StreakReset;
}
