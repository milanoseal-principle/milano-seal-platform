"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, MessageCircle, Lock } from "lucide-react";
import { usePortal } from "@/components/portal/portal-context";

interface Message {
  id: string;
  deal_id: string;
  content: string;
  sender_role: string | null;
  sender_name: string | null;
  direction: "inbound" | "outbound";
  channel: string;
  created_at: string;
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function PortalMessagesPage() {
  const { deal, isLoading: dealLoading } = usePortal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMessages = async (dealId: string) => {
    try {
      const r = await fetch(`/api/portal/me/messages?deal_id=${dealId}`, {
        cache: "no-store",
      });
      if (r.ok) {
        const data = (await r.json()) as { messages: Message[] };
        setMessages(data.messages ?? []);
      }
    } catch {
      // silent poll failure
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!deal) return;
    void fetchMessages(deal.id);
    pollRef.current = setInterval(() => void fetchMessages(deal.id), 15000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [deal]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!deal || !input.trim() || sending) return;
    const content = input.trim();
    if (content.length > 2000) {
      setError("Message cannot exceed 2000 characters.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const r = await fetch(`/api/portal/me/messages?deal_id=${deal.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (r.ok) {
        setInput("");
        await fetchMessages(deal.id);
      } else {
        const body = (await r.json()) as { error?: string };
        setError(body.error ?? "Failed to send. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (dealLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-5 h-5 rounded-full border-2 border-[#C6A55A]/30 border-t-[#C6A55A] animate-spin" />
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <MessageCircle className="w-10 h-10 text-[#3A3A3A] mb-4" />
        <p className="text-[#5A5A5A] text-sm">No active matter found.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100dvh-120px)] max-h-[calc(100dvh-120px)]">
      {/* Header */}
      <div className="border-b border-[#1A1A1A] px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-white font-medium text-base">Secure Matter Communications</h1>
          <p className="text-[#5A5A5A] text-xs mt-0.5">
            All messages are logged to chain-of-custody and reviewed by your assigned operator.
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-[#4A4A4A]">
          <Lock className="w-3.5 h-3.5" />
          <span className="text-[10px] tracking-widest uppercase font-mono">Encrypted</span>
        </div>
      </div>

      {/* Message thread */}
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center pt-16">
            <div className="w-5 h-5 rounded-full border-2 border-[#C6A55A]/30 border-t-[#C6A55A] animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center pt-24 text-center"
          >
            <div className="w-12 h-12 rounded-full border border-[#2A2A2A] flex items-center justify-center mb-4">
              <MessageCircle className="w-5 h-5 text-[#3A3A3A]" />
            </div>
            <p className="text-[#5A5A5A] text-sm">No messages yet.</p>
            <p className="text-[#3A3A3A] text-xs mt-1">
              Send a message below and your operator will respond.
            </p>
          </motion.div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, i) => {
              const isClient = msg.direction === "inbound";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25, delay: i < 5 ? i * 0.04 : 0 }}
                  className={`flex ${isClient ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[75%] ${isClient ? "items-end" : "items-start"} flex flex-col gap-1`}>
                    {!isClient && (
                      <span className="text-[10px] text-[#C6A55A]/70 font-mono tracking-wide px-1">
                        {msg.sender_name ?? "Milano Seal™"}
                      </span>
                    )}
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                        isClient
                          ? "bg-[#1A1A1A] text-white rounded-br-sm border border-[#2A2A2A]"
                          : "bg-[#C6A55A]/10 text-white rounded-bl-sm border border-[#C6A55A]/20"
                      }`}
                    >
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-[#3A3A3A] px-1">
                      {formatTime(msg.created_at)}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-[#1A1A1A] px-6 py-4 flex-shrink-0">
        {error && (
          <p className="text-red-400/80 text-xs mb-3 px-1">{error}</p>
        )}
        <form onSubmit={(e) => void handleSend(e)} className="flex items-end gap-3">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void handleSend(e as unknown as FormEvent);
                }
              }}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              rows={2}
              maxLength={2000}
              className="w-full bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3 text-sm text-white placeholder-[#3A3A3A] resize-none focus:outline-none focus:border-[#C6A55A]/40 transition-colors"
            />
            {input.length > 1800 && (
              <span className="absolute bottom-2 right-3 text-[10px] text-[#5A5A5A]">
                {2000 - input.length} left
              </span>
            )}
          </div>
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#C6A55A] hover:bg-[#D4B46A] disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center"
            aria-label="Send message"
          >
            {sending ? (
              <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-black" />
            )}
          </button>
        </form>
        <p className="text-[#2A2A2A] text-[10px] mt-2 text-center">
          Messages are encrypted and reviewed only by your assigned Milano Seal™ operator.
        </p>
      </div>
    </div>
  );
}
