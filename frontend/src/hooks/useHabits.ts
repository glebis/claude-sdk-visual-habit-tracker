import { useState, useEffect, useCallback } from "react";
import type { Habit, Stats, Regularity } from "@/types";

const API = "/api";

export function useHabits() {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    try {
      const res = await fetch(`${API}/habits`);
      if (res.ok) setHabits(await res.json());
    } catch {
      // Backend not available
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/stats`);
      if (res.ok) setStats(await res.json());
    } catch {
      // Backend not available
    }
  }, []);

  const refresh = useCallback(async () => {
    await Promise.all([fetchHabits(), fetchStats()]);
  }, [fetchHabits, fetchStats]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addHabit = useCallback(
    async (data: {
      name: string;
      regularity: Regularity;
      duration_minutes: number;
      description?: string;
      custom_days?: number[];
    }) => {
      await fetch(`${API}/habits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await refresh();
    },
    [refresh]
  );

  const completeHabit = useCallback(
    async (habitId: string, proofImage?: string) => {
      await fetch(`${API}/habits/${habitId}/complete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proof_image: proofImage }),
      });
      await refresh();
    },
    [refresh]
  );

  const updateHabit = useCallback(
    async (habitId: string, fields: Partial<Pick<Habit, "name" | "description" | "regularity" | "duration_minutes">>) => {
      await fetch(`${API}/habits/${habitId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      await refresh();
    },
    [refresh]
  );

  const uncompleteHabit = useCallback(
    async (habitId: string) => {
      await fetch(`${API}/habits/${habitId}/uncomplete`, { method: "POST" });
      await refresh();
    },
    [refresh]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      await fetch(`${API}/habits/${habitId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  const uploadProof = useCallback(async (file: File): Promise<string> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`${API}/upload`, { method: "POST", body: form });
    const data = await res.json();
    return data.path;
  }, []);

  return {
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
  };
}
