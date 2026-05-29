"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  text: string;
}

const QUICK_PROMPTS = [
  "Apostille process for Italy?",
  "How does RON work internationally?",
  "Translation requirements for Spain?",
  "Hague Convention country checklist?",
];

export function AllianceAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages]);

  async function send(prompt: string) {
    const text = prompt.trim();
    if (!text || loading) return;

    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/alliance/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt: text }),
      });
      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: data.reply ?? "Service unavailable." },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Unable to reach the assistant. Contact your Milano Seal coordinator.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <div
          className="w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(212,175,55,0.12) 0%, rgba(212,175,55,0.03) 100%)",
            border: "1px solid rgba(212,175,55,0.28)",
          }}
        >
          <Bot className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
        </div>
        <div>
          <div
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "#d4af37" }}
          >
            Alliance Assistant™
          </div>
          <div className="text-[9px] uppercase tracking-[0.12em] text-neutral-700">
            Operational Guidance
          </div>
        </div>
      </div>

      {/* Thread */}
      <div
        ref={threadRef}
        className="space-y-2.5 overflow-y-auto mb-3"
        style={{
          maxHeight: 200,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {messages.length === 0 && (
          <div className="py-5 text-center">
            <p className="text-[10px] text-neutral-700 leading-relaxed">
              Ask about apostille procedures, destination requirements,
              <br />
              or international execution coordination.
            </p>
          </div>
        )}
        <AnimatePresence initial={false}>
          {messages.map((m, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }}
              className="text-xs leading-relaxed rounded-sm px-3 py-2"
              style={{
                marginLeft: m.role === "user" ? "1rem" : undefined,
                marginRight: m.role === "assistant" ? "1rem" : undefined,
                background:
                  m.role === "user"
                    ? "rgba(212,175,55,0.06)"
                    : "rgba(255,255,255,0.025)",
                border: `1px solid ${
                  m.role === "user"
                    ? "rgba(212,175,55,0.15)"
                    : "rgba(255,255,255,0.05)"
                }`,
                color: m.role === "user" ? "#d4c5a0" : "#9ca3af",
              }}
            >
              {m.text}
            </motion.div>
          ))}
        </AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1.5 px-3 py-2"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: "rgba(212,175,55,0.5)" }}
                animate={{ opacity: [0.25, 1, 0.25] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.18,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Quick prompts — only when thread is empty */}
      {messages.length === 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {QUICK_PROMPTS.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={loading}
              className="text-[9px] px-2 py-1 rounded-sm font-mono transition-opacity hover:opacity-70 disabled:opacity-30"
              style={{
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.38)",
              }}
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div
        className="flex items-center gap-2 rounded-sm px-3 py-2.5"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) =>
            e.key === "Enter" && !e.shiftKey && send(input)
          }
          placeholder="Ask about procedures, apostille, destinations..."
          disabled={loading}
          className="flex-1 bg-transparent text-[11px] outline-none placeholder-neutral-800"
          style={{ color: "#d4c5a0" }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          className="flex-shrink-0 transition-opacity hover:opacity-70 disabled:opacity-25"
          style={{ color: "#d4af37" }}
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
