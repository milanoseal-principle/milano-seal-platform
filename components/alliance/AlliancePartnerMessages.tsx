"use client";

import { useState, useRef, useEffect } from "react";
import { Send, MessageSquare } from "lucide-react";

type Message = {
  id: string;
  from: "partner" | "milano_seal";
  content: string;
  created_at: string;
  read?: boolean;
};

type Props = {
  messages: Message[];
  onSend?: (message: string) => void;
};

export function AlliancePartnerMessages({ messages, onSend }: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  async function handleSend() {
    const trimmed = draft.trim();
    if (!trimmed || trimmed.length > 1000 || sending) return;
    setSending(true);
    try {
      await onSend?.(trimmed);
      setDraft("");
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div
      className="rounded-sm flex flex-col"
      style={{
        background: "rgba(8,5,1,0.96)",
        border: "1px solid rgba(198,165,90,0.1)",
        height: "560px",
        maxHeight: "80vh",
      }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center gap-2"
        style={{ borderColor: "rgba(198,165,90,0.08)" }}
      >
        <MessageSquare size={15} style={{ color: "rgba(198,165,90,0.55)" }} />
        <h2
          className="text-sm font-light"
          style={{
            fontFamily: "var(--font-playfair),Georgia,serif",
            color: "rgba(246,241,230,0.85)",
          }}
        >
          Partner Messages
        </h2>
      </div>

      {/* Thread */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center h-full gap-3"
            style={{ color: "rgba(255,255,255,0.25)" }}
          >
            <MessageSquare size={28} style={{ color: "rgba(198,165,90,0.15)" }} />
            <p className="text-sm text-center">
              No messages yet. Send a message to get started.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMilano = msg.from === "milano_seal";
            return (
              <div
                key={msg.id}
                className={`flex ${isMilano ? "justify-start" : "justify-end"}`}
              >
                <div
                  className="max-w-[75%] rounded-sm px-4 py-3 space-y-1.5"
                  style={{
                    background: isMilano
                      ? "rgba(198,165,90,0.12)"
                      : "rgba(198,165,90,0.06)",
                    border: isMilano
                      ? "1px solid rgba(198,165,90,0.22)"
                      : "1px solid rgba(198,165,90,0.1)",
                  }}
                >
                  <p
                    className="text-[10px] font-mono uppercase tracking-[0.12em]"
                    style={{
                      color: isMilano
                        ? "rgba(198,165,90,0.7)"
                        : "rgba(255,255,255,0.35)",
                    }}
                  >
                    {isMilano ? "Milano Seal" : "You"}
                  </p>
                  <p
                    className="text-[12px] leading-relaxed"
                    style={{ color: "rgba(246,241,230,0.8)" }}
                  >
                    {msg.content}
                  </p>
                  <p
                    className="text-[9px] font-mono"
                    style={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    {new Date(msg.created_at).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Send form */}
      {onSend && (
        <div
          className="px-5 py-4 border-t"
          style={{ borderColor: "rgba(198,165,90,0.08)" }}
        >
          <div className="flex gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message…"
              maxLength={1000}
              rows={2}
              className="flex-1 resize-none rounded-sm px-3 py-2 text-[12px] outline-none"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(198,165,90,0.15)",
                color: "rgba(246,241,230,0.85)",
              }}
            />
            <button
              onClick={handleSend}
              disabled={!draft.trim() || draft.length > 1000 || sending}
              className="flex-shrink-0 rounded-sm px-3 py-2 transition-opacity disabled:opacity-40"
              style={{
                background: "rgba(198,165,90,0.12)",
                border: "1px solid rgba(198,165,90,0.25)",
                color: "#C6A55A",
              }}
              aria-label="Send message"
            >
              <Send size={14} />
            </button>
          </div>
          <p
            className="text-[9px] font-mono mt-1.5"
            style={{ color: "rgba(255,255,255,0.2)" }}
          >
            {draft.length}/1000 — Ctrl+Enter to send
          </p>
        </div>
      )}
    </div>
  );
}
