import { useState, useEffect, useCallback } from "react";
import type { Settings } from "@/types";

const API = "/api";

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`${API}/settings`);
      if (res.ok) setSettings(await res.json());
    } catch {
      // Backend not available
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const updateSettings = useCallback(
    async (updates: Partial<Settings>) => {
      const res = await fetch(`${API}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        return updated as Settings;
      }
      return null;
    },
    []
  );

  return { settings, loading, updateSettings, refresh: fetchSettings };
}
