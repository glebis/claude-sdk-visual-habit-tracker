import { useState, useRef, useEffect } from "react";
import Markdown from "react-markdown";
import type { ChatMessage } from "@/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { SendHorizontal, X } from "lucide-react";

const THINKING_MESSAGES = [
  "Thinking...",
  "Checking your streaks...",
  "Consulting the habit oracle...",
  "Crunching the numbers...",
  "Looking at the big picture...",
  "Processing...",
];

const PROMPT_SUGGESTIONS = [
  "how am I doing?",
  "add a new habit",
  "generate progress art",
  "show my stats",
];

interface AgentChatProps {
  messages: ChatMessage[];
  isConnected: boolean;
  isThinking: boolean;
  onSend: (message: string) => void;
}

export function AgentChat({
  messages,
  isConnected,
  isThinking,
  onSend,
}: AgentChatProps) {
  const [input, setInput] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isThinking]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput("");
  };

  return (
    <Card className="flex flex-col bg-card border-border h-full min-h-0 py-0 gap-0">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <h2 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          Agent Chat
        </h2>
        <span className="text-xs text-muted-foreground font-light">
          {isConnected ? "Connected" : "Offline"}
        </span>
      </div>

      <ScrollArea className="flex-1 min-h-0 p-4">
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">
                Your habit companion is ready. Try:
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {PROMPT_SUGGESTIONS.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSend(prompt)}
                    className="text-xs px-3 py-1.5 rounded-sm border border-border bg-background hover:bg-muted hover:border-primary/30 transition-colors text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`text-sm ${
                msg.role === "user" ? "text-right" : "text-left"
              }`}
            >
              <div
                className={`inline-block max-w-[85%] rounded-sm px-3 py-2 ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                } ${msg.image ? "!max-w-[90%]" : ""}`}
              >
                {msg.image ? (
                  <div className="grid grid-cols-[3rem_1fr] gap-2 items-center">
                    <button
                      type="button"
                      onClick={() => setLightbox(msg.image!)}
                      className="cursor-zoom-in"
                    >
                      <img
                        src={msg.image}
                        alt="Proof"
                        className="w-12 h-12 object-cover rounded-sm hover:opacity-80 transition-opacity"
                      />
                    </button>
                    <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                  </div>
                ) : msg.role === "assistant" ? (
                  <div className="max-w-none text-sm [&>*:first-child]:mt-0 [&>*:last-child]:mb-0 [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:ml-4 [&_strong]:font-semibold [&_code]:bg-background/30 [&_code]:px-1 [&_code]:rounded-sm [&_code]:text-xs [&_h1]:text-base [&_h1]:font-bold [&_h1]:mb-2 [&_h2]:text-sm [&_h2]:font-bold [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mb-1 [&_ul]:list-disc [&_ol]:list-decimal">
                    <Markdown>{msg.content}</Markdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))}

          {isThinking && (
            <ThinkingIndicator />
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSubmit} className="p-4 border-t border-border flex gap-2 shrink-0">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={!isConnected}
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!isConnected || !input.trim()}>
          <SendHorizontal className="h-4 w-4" />
        </Button>
      </form>
      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-zoom-out"
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            onClick={() => setLightbox(null)}
            className="absolute top-4 right-4 text-white/70 hover:text-white"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={lightbox}
            alt="Proof full"
            className="max-w-[90vw] max-h-[90vh] object-contain rounded-sm"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </Card>
  );
}

function ThinkingIndicator() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % THINKING_MESSAGES.length);
    }, 2500);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-sm text-left">
      <div className="inline-block bg-secondary text-secondary-foreground rounded-sm px-3 py-2">
        <span className="animate-pulse">{THINKING_MESSAGES[index]}</span>
      </div>
    </div>
  );
}
