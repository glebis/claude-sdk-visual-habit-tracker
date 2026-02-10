import { useState, useRef, useCallback, useEffect } from "react";
import type { ChatMessage, AgentMessage } from "@/types";

const STORAGE_KEY = "habit-tracker-chat";

function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(messages: ChatMessage[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch { /* storage full or unavailable */ }
}

export function useAgent(onImage?: (name: string) => void, onAgentDone?: () => void) {
  const [messages, setMessages] = useState<ChatMessage[]>(loadMessages);
  const [isConnected, setIsConnected] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const mountedRef = useRef(true);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>();
  const onImageRef = useRef(onImage);
  onImageRef.current = onImage;
  const onAgentDoneRef = useRef(onAgentDone);
  onAgentDoneRef.current = onAgentDone;

  // Persist messages on change
  useEffect(() => {
    saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    mountedRef.current = true;

    function connect() {
      if (!mountedRef.current) return;

      // Clean up previous connection
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws/chat`);

      ws.onopen = () => {
        if (mountedRef.current) setIsConnected(true);
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        setIsConnected(false);
        reconnectTimer.current = setTimeout(connect, 2000);
      };

      ws.onmessage = (event) => {
        if (!mountedRef.current) return;
        const data: AgentMessage = JSON.parse(event.data);

        if (data.type === "text" && data.text) {
          setMessages((prev) => {
            const last = prev[prev.length - 1];
            if (last?.role === "assistant") {
              return [
                ...prev.slice(0, -1),
                { ...last, content: last.content + data.text },
              ];
            }
            return [
              ...prev,
              { role: "assistant", content: data.text!, timestamp: Date.now() },
            ];
          });
        }

        if (data.type === "result") {
          setIsThinking(false);
          onAgentDoneRef.current?.();
        }

        if (data.type === "image" && data.name) {
          onImageRef.current?.(data.name);
        }

        if (data.type === "error") {
          setMessages((prev) => [
            ...prev,
            {
              role: "assistant",
              content: `Error: ${data.text}`,
              timestamp: Date.now(),
            },
          ]);
          setIsThinking(false);
        }
      };

      wsRef.current = ws;
    }

    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, []);

  const sendMessage = useCallback((text: string, opts?: { image?: string; displayText?: string }) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

    setMessages((prev) => [
      ...prev,
      { role: "user", content: opts?.displayText ?? text, image: opts?.image, timestamp: Date.now() },
    ]);
    setIsThinking(true);

    wsRef.current.send(JSON.stringify({ message: text }));
  }, []);

  return { messages, isConnected, isThinking, sendMessage };
}
