"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePortal } from "@/components/portal/portal-context";
import { PortalEntryRitual } from "@/components/portal/portal-entry-ritual";
import { createClient } from "@/lib/supabase/client";

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  content: string;
  status: string | null;
  created_at: string;
}

const TRACK_STEPS = [
  {
    keys: ["new", "reviewing"],
    label: "Intake Received",
    desc: "Your matter has been received and is under review by our team.",
  },
  {
    keys: ["quoted", "awaiting_payment"],
    label: "Reviewed · Invoice Issued",
    desc: "Your matter has been structured and a quote prepared. Payment unlocks scheduling.",
  },
  {
    keys: ["scheduled"],
    label: "Payment Confirmed",
    desc: "Retainer received. Matter scheduled for execution.",
  },
  {
    keys: ["in_execution"],
    label: "In Execution",
    desc: "Active notarization session in progress.",
  },
  {
    keys: ["apostille"],
    label: "Apostille Coordination",
    desc: "Documents submitted to the Florida Department of State.",
  },
  {
    keys: ["shipped"],
    label: "Delivery",
    desc: "Authenticated documents shipped to your destination.",
  },
  {
    keys: ["completed"],
    label: "Matter Closed",
    desc: "Documents delivered and matter closed. Paid & released.",
  },
];

function stageIndex(status: string | null | undefined): number {
  if (!status) return -1;
  return TRACK_STEPS.findIndex((s) => s.keys.includes(status));
}

const CHECKLIST_ITEMS = [
  "Government-issued photo ID (passport or driver's license)",
  "Signed engagement letter",
  "Document(s) to be notarized — uploaded as PDF or photo",
  "Quiet, well-lit space for the video session",
  "Working webcam + microphone",
];

export default function MyMatterPage() {
  const { deal, ledger, isLoading, message } = usePortal();
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const threadEndRef = useRef<HTMLDivElement | null>(null);

  const [entryDone, setEntryDone] = useState(() => {
    if (typeof window !== "undefined") {
      return !!sessionStorage.getItem("ms-portal-entry");
    }
    return true; // SSR: skip ritual
  });

  function handleEntryDone() {
    sessionStorage.setItem("ms-portal-entry", "1");
    setEntryDone(true);
  }

  useEffect(() => {
    if (!deal) return;

    void (async () => {
      try {
        const r = await fetch(`/api/portal/me/messages?deal_id=${deal.id}`, {
          cache: "no-store",
        });
        if (r.ok) {
          const body = (await r.json()) as { messages: Message[] };
          setMessages(body.messages ?? []);
        }
      } catch {
        /* ignore */
      }
    })();

    const supabase = createClient();
    const channel = supabase
      .channel(`portal-messages-${deal.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `deal_id=eq.${deal.id}`,
        },
        (payload) => {
          setMessages((prev) => {
            const incoming = payload.new as Message;
            if (prev.find((m) => m.id === incoming.id)) return prev;
            return [...prev, incoming];
          });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [deal?.id]);

  useEffect(() => {
    threadEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  const send = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    setSendError(null);
    try {
      const r = await fetch(`/api/portal/me/messages?deal_id=${deal!.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: draft.trim() }),
      });
      const body = (await r.json()) as { message?: Message; error?: string };
      if (!r.ok) {
        setSendError(body.error ?? `HTTP ${r.status}`);
      } else if (body.message) {
        setMessages((m) => [...m, body.message!]);
        setDraft("");
      }
    } catch (err) {
      setSendError(err instanceof Error ? err.message : String(err));
    } finally {
      setSending(false);
    }
  };

  const currentIdx = stageIndex(deal?.status);

  if (isLoading) {
    return (
      <div style={{ color: "rgba(255,255,255,.4)" }}>Loading your matter…</div>
    );
  }

  if (!deal) {
    return (
      <div className="pp-no-deal">
        <div className="pp-no-deal-title">No matter linked yet</div>
        <div className="pp-no-deal-body">
          {message ??
            "We couldn't find a matter associated with this email. Please contact your coordinator."}
        </div>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        {!entryDone && (
          <PortalEntryRitual key="ritual" onComplete={handleEntryDone} />
        )}
      </AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: entryDone ? 1 : 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="pp-eyebrow">Your Matter</div>
        <h1 className="pp-h1">
          Welcome back, {deal.client_name?.split(" ")[0] ?? "Client"}
        </h1>
        <div className="pp-sub">
          {deal.document_type ?? "Document execution"} ·{" "}
          <em>{deal.destination_country ?? deal.country ?? "—"}</em>
        </div>

        {/* Paid & Released banner — only when completed + paid */}
        <AnimatePresence>
          {deal.status === "completed" && deal.payment_status === "paid" && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5 border rounded-sm px-5 py-4 flex items-center gap-3"
              style={{
                background:
                  "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(212,175,55,0.05) 100%)",
                borderColor: "rgba(212,175,55,0.2)",
                boxShadow: "0 0 12px rgba(212,175,55,0.05)",
              }}
            >
              <span className="text-emerald-400 text-base">✓</span>
              <div>
                <div className="text-[#D4AF37] font-semibold text-sm font-serif">
                  Paid &amp; Released
                </div>
                <div className="text-gray-400 text-xs mt-0.5">
                  Your matter is complete. All obligations fulfilled and
                  documents released.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pp-grid">
          {/* Left column */}
          <motion.div
            initial={{ opacity: 0.3, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 0.1 }}
          >
            {/* Progress tracker */}
            <div className="pp-card">
              <div className="pp-card-h">Progress</div>
              {TRACK_STEPS.map((s, i) => {
                const done = currentIdx > i;
                const act = currentIdx === i;
                const dotClass = done ? "done" : act ? "act" : "pend";
                const nameClass = done ? "done" : act ? "act" : "pend";
                return (
                  <div key={s.label} className="pp-track-step">
                    {i < TRACK_STEPS.length - 1 && (
                      <div
                        className="pp-track-line"
                        style={{
                          background: done
                            ? "#C6A55A"
                            : "rgba(198,165,90,.18)",
                        }}
                      />
                    )}
                    <div className={`pp-track-dot ${dotClass}`}>
                      {done ? "✓" : act ? "●" : i + 1}
                    </div>
                    <div>
                      <div className={`pp-track-name ${nameClass}`}>
                        {s.label}
                      </div>
                      {(done || act) && (
                        <div className="pp-track-desc">{s.desc}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Messages */}
            <div className="pp-card">
              <div className="pp-card-h">Messages with your coordinator</div>
              <div className="pp-msgs">
                {messages.length === 0 ? (
                  <div className="pp-msg-empty">
                    No messages yet. Send the first one below.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`pp-msg ${m.direction === "inbound" ? "cl" : "op"}`}
                    >
                      <div className="pp-msg-txt">{m.content}</div>
                      <div className="pp-msg-meta">
                        {m.direction === "inbound" ? "You" : "Nicholas Milano"}
                        {" · "}
                        {new Date(m.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))
                )}
                <div ref={threadEndRef} />
              </div>
              {sendError && <div className="pp-msg-error">{sendError}</div>}
              <div className="pp-input-row">
                <input
                  className="pp-input"
                  placeholder="Type a message…"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && send()}
                  disabled={sending}
                />
                <button
                  className="pp-send-btn"
                  onClick={send}
                  disabled={sending || !draft.trim()}
                >
                  {sending ? "…" : "Send"}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0.3, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
          >
            <div className="pp-card">
              <div className="pp-card-h">Matter Details</div>
              <div className="pp-kv">
                <span className="pp-kv-k">Matter ID</span>
                <span className="pp-kv-v pp-kv-v mono">
                  {deal.id.slice(0, 8)}…
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Document</span>
                <span className="pp-kv-v">{deal.document_type ?? "—"}</span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Destination</span>
                <span className="pp-kv-v">
                  {deal.destination_country ?? deal.country ?? "—"}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Status</span>
                <span className="pp-kv-v pp-kv-v gold">
                  {(deal.status ?? "").replace(/_/g, " ")}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Payment</span>
                <span
                  className={`pp-kv-v ${deal.payment_status === "paid" ? "pp-kv-v paid" : "pp-kv-v pending"}`}
                >
                  {deal.payment_status === "paid" ? "Paid" : "Pending"}
                </span>
              </div>
            </div>

            <div className="pp-card">
              <div className="pp-card-h">Pre-flight checklist</div>
              {CHECKLIST_ITEMS.map((item, i) => {
                const done = currentIdx >= 2 && i < 2;
                return (
                  <div key={item} className="pp-check-row">
                    <span className={`pp-check-box ${done ? "done" : "todo"}`}>
                      {done && <span className="pp-check-icon">✓</span>}
                    </span>
                    <span
                      className={`pp-check-text ${done ? "done" : "todo"}`}
                    >
                      {item}
                    </span>
                  </div>
                );
              })}
            </div>

            {ledger.length > 0 && (
              <div className="pp-card">
                <div className="pp-card-h">Recent Activity</div>
                {(() => {
                  const items = ledger.slice(-5).reverse();
                  return items.map((l, i) => (
                    <motion.div
                      key={l.id}
                      className="pp-timeline-item"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.07, ease: "easeOut" }}
                    >
                      <div className="pp-timeline-col">
                        <div className="pp-timeline-dot" />
                        {i < items.length - 1 && (
                          <motion.div
                            className="pp-timeline-line"
                            initial={{ scaleY: 0 }}
                            animate={{ scaleY: 1 }}
                            transition={{ duration: 0.3, delay: i * 0.07 + 0.15 }}
                          />
                        )}
                      </div>
                      <div className="pp-timeline-content">
                        <div className="pp-activity-event">
                          {l.event.replace("DOC_", "").replace(/_/g, " ")}
                        </div>
                        {l.location && (
                          <div className="pp-activity-location">{l.location}</div>
                        )}
                        <div className="pp-activity-time">
                          {new Date(l.created_at).toLocaleString()}
                        </div>
                      </div>
                    </motion.div>
                  ));
                })()}
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
