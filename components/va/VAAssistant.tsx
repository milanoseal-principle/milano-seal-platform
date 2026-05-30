"use client";

import { FormEvent, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, User } from "lucide-react";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

function MessageRow({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE }}
      className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
    >
      <div
        className="h-6 w-6 rounded-sm flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser
            ? "rgba(212,175,55,0.1)"
            : "rgba(255,255,255,0.04)",
        }}
      >
        {isUser ? (
          <User size={11} style={{ color: "rgba(212,175,55,0.7)" }} />
        ) : (
          <Bot size={11} style={{ color: "rgba(255,255,255,0.4)" }} />
        )}
      </div>
      <div
        className="rounded-sm px-3 py-2 text-xs font-light max-w-[80%] leading-relaxed"
        style={{
          background: isUser
            ? "rgba(212,175,55,0.06)"
            : "rgba(255,255,255,0.03)",
          border: isUser
            ? "1px solid rgba(212,175,55,0.1)"
            : "1px solid rgba(255,255,255,0.05)",
          color: isUser
            ? "rgba(255,255,255,0.75)"
            : "rgba(255,255,255,0.6)",
          whiteSpace: "pre-wrap",
        }}
      >
        {msg.content}
      </div>
    </motion.div>
  );
}

export function VAAssistant() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const text = input.trim();
    if (!text || isThinking) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsThinking(true);

    setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 50);

    try {
      const res = await fetch("/api/va/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "No response received.";
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "Connection error. Please try again.",
        },
      ]);
    } finally {
      setIsThinking(false);
      setTimeout(() => {
        endRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }

  return (
    <div
      className="rounded-sm flex flex-col"
      style={{
        background: "rgba(8,5,1,0.99)",
        border: "1px solid rgba(255,255,255,0.05)",
        minHeight: 440,
      }}
    >
      {/* Header */}
      <div
        className="px-5 pt-5 pb-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div>
          <span
            className="text-[9px] font-mono tracking-[0.3em] block mb-0.5"
            style={{ color: "rgba(212,175,55,0.45)" }}
          >
            OPERATIONS INTELLIGENCE
          </span>
          <h2
            className="text-sm font-light"
            style={{
              color: "rgba(255,255,255,0.65)",
              fontFamily: "var(--font-playfair),Georgia,serif",
            }}
          >
            VA Assistant
          </h2>
        </div>
        <motion.div
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
        >
          <Bot size={14} style={{ color: "rgba(212,175,55,0.45)" }} />
        </motion.div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        style={{ maxHeight: 340, scrollbarWidth: "none" }}
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-8">
            <Bot size={24} style={{ color: "rgba(212,175,55,0.15)" }} />
            <p
              className="text-[10px] font-mono tracking-widest text-center"
              style={{ color: "rgba(255,255,255,0.18)" }}
            >
              ASK ABOUT TASKS, WORKFLOWS, OR ESCALATION
            </p>
          </div>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          {messages.map((msg) => (
            <MessageRow key={msg.id} msg={msg} />
          ))}
        </AnimatePresence>
        {isThinking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-2 pl-8"
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "rgba(212,175,55,0.4)" }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut",
                }}
              />
            ))}
          </motion.div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="p-4 flex gap-2 flex-shrink-0"
        style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your tasks or workflows..."
          disabled={isThinking}
          className="flex-1 bg-transparent text-xs font-light px-3 py-2 rounded-sm outline-none transition-colors disabled:opacity-40"
          style={{
            border: "1px solid rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.7)",
          }}
        />
        <button
          type="submit"
          disabled={!input.trim() || isThinking}
          className="px-3 py-2 rounded-sm transition-opacity disabled:opacity-30"
          style={{
            background: "rgba(212,175,55,0.1)",
            border: "1px solid rgba(212,175,55,0.15)",
            color: "rgba(212,175,55,0.8)",
          }}
        >
          <Send size={13} />
        </button>
      </form>
    </div>
  );
}
