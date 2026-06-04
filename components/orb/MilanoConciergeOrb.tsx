"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, Send } from "lucide-react";
import { OrbMessageBubble, OrbMessage, OrbAction } from "./OrbMessageBubble";

export interface MilanoConciergeOrbProps {
  role: "founder_admin" | "operator" | "client" | "va";
  activeMatterId?: string | null;
  activeMatterStatus?: string | null;
  userName?: string | null;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function getRoleBadgeLabel(role: MilanoConciergeOrbProps["role"]): string {
  switch (role) {
    case "founder_admin":
      return "Founder Admin";
    case "operator":
      return "Operator";
    case "client":
      return "Client";
    case "va":
      return "Virtual Assistant";
  }
}

function getWelcomeMessage(
  role: MilanoConciergeOrbProps["role"],
  userName?: string | null,
  activeMatterStatus?: string | null
): string {
  const name = userName ? `, ${userName.split(" ")[0]}` : "";
  switch (role) {
    case "founder_admin":
      return `Welcome back${name}. All systems nominal. What do you need?`;
    case "operator":
      return "Concierge ready. Active matters and courier routes are live.";
    case "client":
      return activeMatterStatus
        ? `Welcome${name}. Your matter is being handled with care. Current status: ${activeMatterStatus.replace(/_/g, " ")}.`
        : `Welcome${name}. Your matter is being handled with care.`;
    case "va":
      return "VA mode active. Compliance checks and follow-up queues are ready.";
  }
}

let msgCounter = 0;
function genId() {
  return `orb-msg-${Date.now()}-${++msgCounter}`;
}

export function MilanoConciergeOrb({
  role,
  activeMatterId,
  activeMatterStatus,
  userName,
}: MilanoConciergeOrbProps) {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<OrbMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [panelVisible, setPanelVisible] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mount: show welcome message
  useEffect(() => {
    const welcome: OrbMessage = {
      id: genId(),
      role: "orb",
      content: getWelcomeMessage(role, userName, activeMatterStatus),
      timestamp: new Date(),
    };
    setMessages([welcome]);
    setHasUnread(true);
  }, [role, userName, activeMatterStatus]);

  // Panel open/close animation
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setPanelVisible(true));
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    } else {
      setPanelVisible(false);
    }
  }, [open]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isTyping) return;

    const userMsg: OrbMessage = {
      id: genId(),
      role: "user",
      content: text,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/dashboard/orb/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          role,
          matter_id: activeMatterId ?? null,
        }),
      });

      const data = await res.json();
      const orbActions: OrbAction[] | undefined = data.actions?.map(
        (a: { label: string; href?: string; variant: "primary" | "ghost" }) => ({
          label: a.label,
          href: a.href,
          variant: a.variant,
        })
      );

      const orbMsg: OrbMessage = {
        id: genId(),
        role: "orb",
        content: data.reply ?? "I encountered an issue. Please try again.",
        timestamp: new Date(),
        actions: orbActions,
      };

      setMessages((prev) => [...prev, orbMsg]);
      if (!open) setHasUnread(true);
    } catch {
      const errMsg: OrbMessage = {
        id: genId(),
        role: "orb",
        content: "Connection issue. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, isTyping, role, activeMatterId, open]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const pulseAnimation = reduced
    ? {}
    : {
        animation: hasUnread && !open
          ? "orb-unread-pulse 1.5s ease-in-out infinite"
          : "orb-breathe 4s ease-in-out infinite",
      };

  return (
    <>
      {/* Keyframes injected once */}
      <style>{`
        @keyframes orb-breathe {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(198,165,90,0.3); }
          50% { transform: scale(1.04); box-shadow: 0 0 16px 4px rgba(198,165,90,0.18); }
        }
        @keyframes orb-unread-pulse {
          0%, 100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(198,165,90,0.6); }
          50% { transform: scale(1.08); box-shadow: 0 0 0 8px rgba(198,165,90,0); }
        }
        @keyframes orb-typing-dot {
          0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
          40% { opacity: 1; transform: translateY(-3px); }
        }
      `}</style>

      <div
        style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 12,
        }}
      >
        {/* Expanded panel */}
        {open && (
          <div
            role="dialog"
            aria-label="Milano Seal Concierge"
            aria-modal="true"
            style={{
              width: 360,
              height: 480,
              background: "#0A0A0A",
              border: "1px solid rgba(198,165,90,0.3)",
              borderRadius: 16,
              boxShadow: "0 24px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(198,165,90,0.08)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              opacity: panelVisible ? 1 : 0,
              transform: panelVisible ? "translateY(0)" : "translateY(16px)",
              transition: reduced
                ? "none"
                : "opacity 280ms cubic-bezier(0.16,1,0.3,1), transform 280ms cubic-bezier(0.16,1,0.3,1)",
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: "14px 16px 10px",
                borderBottom: "1px solid rgba(198,165,90,0.12)",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: "'Inter', sans-serif",
                    fontWeight: 600,
                    color: "#C6A55A",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  Milano Seal Concierge
                </span>
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close concierge"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "rgba(198,165,90,0.6)",
                    display: "flex",
                    alignItems: "center",
                    padding: 2,
                  }}
                >
                  <X size={15} />
                </button>
              </div>

              {/* Role badge */}
              <div style={{ marginTop: 6 }}>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: 10,
                    fontFamily: "'Inter', sans-serif",
                    color: "rgba(198,165,90,0.6)",
                    background: "rgba(198,165,90,0.08)",
                    border: "1px solid rgba(198,165,90,0.2)",
                    borderRadius: 4,
                    padding: "2px 7px",
                    letterSpacing: "0.06em",
                    textTransform: "uppercase",
                  }}
                >
                  {getRoleBadgeLabel(role)}
                </span>
              </div>
            </div>

            {/* Message thread */}
            <div
              ref={scrollRef}
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "12px 14px",
                display: "flex",
                flexDirection: "column",
                gap: 10,
                scrollbarWidth: "thin",
                scrollbarColor: "rgba(198,165,90,0.2) transparent",
              }}
            >
              {messages.map((msg) => (
                <OrbMessageBubble key={msg.id} message={msg} />
              ))}

              {/* Typing indicator */}
              {isTyping && (
                <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
                  <div
                    style={{
                      padding: "8px 12px",
                      borderRadius: "2px 12px 12px 12px",
                      background: "rgba(198,165,90,0.08)",
                      border: "1px solid rgba(198,165,90,0.18)",
                      display: "flex",
                      gap: 4,
                      alignItems: "center",
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          background: "#C6A55A",
                          display: "inline-block",
                          animation: reduced
                            ? "none"
                            : `orb-typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                          opacity: reduced ? 0.6 : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Input bar */}
            <div
              style={{
                padding: "10px 12px",
                borderTop: "1px solid rgba(198,165,90,0.12)",
                display: "flex",
                gap: 8,
                alignItems: "center",
                flexShrink: 0,
              }}
            >
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                maxLength={500}
                style={{
                  flex: 1,
                  background: "rgba(198,165,90,0.06)",
                  border: "1px solid rgba(198,165,90,0.2)",
                  borderRadius: 8,
                  padding: "8px 10px",
                  fontSize: 13,
                  color: "#FFFFFF",
                  fontFamily: "'Inter', sans-serif",
                  outline: "none",
                }}
              />
              <button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isTyping}
                aria-label="Send message"
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 8,
                  background:
                    inputValue.trim() && !isTyping
                      ? "rgba(198,165,90,0.85)"
                      : "rgba(198,165,90,0.15)",
                  border: "1px solid rgba(198,165,90,0.3)",
                  cursor: inputValue.trim() && !isTyping ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: inputValue.trim() && !isTyping ? "#0A0A0A" : "rgba(198,165,90,0.4)",
                  transition: "background 150ms",
                  flexShrink: 0,
                }}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        )}

        {/* Orb button */}
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label="Milano Seal Concierge"
          aria-expanded={open}
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            border: "none",
            padding: 0,
            cursor: "pointer",
            position: "relative",
            ...pulseAnimation,
          }}
        >
          <svg
            width={56}
            height={56}
            viewBox="0 0 56 56"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ display: "block" }}
          >
            <defs>
              <radialGradient id="orb-gold-grad" cx="40%" cy="35%" r="65%">
                <stop offset="0%" stopColor="#E8C97A" />
                <stop offset="60%" stopColor="#C6A55A" />
                <stop offset="100%" stopColor="#8B6C2E" />
              </radialGradient>
            </defs>
            <circle cx="28" cy="28" r="27" fill="url(#orb-gold-grad)" />
            <circle
              cx="28"
              cy="28"
              r="26"
              stroke="rgba(255,255,255,0.15)"
              strokeWidth="1"
              fill="none"
            />
            {/* Subtle M monogram */}
            <text
              x="28"
              y="33"
              textAnchor="middle"
              fontSize="18"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight={700}
              fill="rgba(10,10,10,0.85)"
            >
              M
            </text>
          </svg>

          {/* Unread badge */}
          {hasUnread && !open && (
            <span
              style={{
                position: "absolute",
                top: 1,
                right: 1,
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: "#C6A55A",
                border: "2px solid #0A0A0A",
              }}
            />
          )}
        </button>
      </div>
    </>
  );
}
