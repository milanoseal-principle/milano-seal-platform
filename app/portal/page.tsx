"use client";

import { useEffect, useState, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { usePortal } from "@/components/portal/portal-context";
import { PortalEntryRitual } from "@/components/portal/portal-entry-ritual";
import { PortalStatusRail } from "@/components/portal/portal-status-rail";
import { CustodyTimeline } from "@/components/portal/CustodyTimeline";
import { MatterJourneyCard } from "@/components/portal/MatterJourneyCard";
import { CoordinatorCard } from "@/components/portal/CoordinatorCard";
import { PreFlightReview } from "@/components/portal/PreFlightReview";
import { ReadinessSummaryCard } from "@/components/portal/ReadinessSummaryCard";
import { PortalCourierCustody } from "@/components/portal/PortalCourierCustody";
import { createClient } from "@/lib/supabase/client";

// ─── Portal Assistant ────────────────────────────────────────────────────────

const ASSISTANT_CHIPS = [
  "What is apostille?",
  "What happens next?",
  "How do I prepare for my session?",
  "What documents do I need?",
  "How long does this take?",
  "What is the Hague Convention?",
];

interface AssistantMsg {
  id: string;
  role: "user" | "assistant";
  text: string;
}

function PortalAssistant() {
  const [msgs, setMsgs] = useState<AssistantMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [msgs, loading]);

  async function ask(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt || loading) return;
    setInput("");
    setMsgs((m) => [
      ...m,
      { id: `u${Date.now()}`, role: "user", text: prompt },
    ]);
    setLoading(true);
    try {
      const r = await fetch("/api/portal/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = (await r.json()) as { text?: string; error?: string };
      const reply =
        data.text ??
        "Your coordinator will be in touch with more information.";
      setMsgs((m) => [
        ...m,
        { id: `a${Date.now()}`, role: "assistant", text: reply },
      ]);
    } catch {
      setMsgs((m) => [
        ...m,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          text: "We're unable to answer right now. Please reach out to your coordinator directly.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pp-card pa-card">
      <div className="pp-card-h">Questions about your matter</div>

      {/* Thread */}
      <div className="pa-thread" ref={threadRef}>
        {msgs.length === 0 && !loading && (
          <div className="pa-welcome">
            Ask anything about your document journey — apostille, what to
            expect, how to prepare, or what happens next.
          </div>
        )}
        <AnimatePresence initial={false}>
          {msgs.map((m) =>
            m.role === "user" ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="pa-user-bubble"
              >
                {m.text}
              </motion.div>
            ) : (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className="pa-ai-bubble"
              >
                <span className="pa-ai-mark">✦</span>
                {m.text}
              </motion.div>
            ),
          )}
        </AnimatePresence>
        {loading && (
          <div className="pa-thinking">
            {[0, 140, 280].map((d) => (
              <span
                key={d}
                className="pa-dot"
                style={{ animationDelay: `${d}ms` }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Quick prompts */}
      {msgs.length === 0 && (
        <div className="pa-chips">
          {ASSISTANT_CHIPS.map((c) => (
            <button
              key={c}
              className="pa-chip"
              disabled={loading}
              onClick={() => void ask(c)}
            >
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Composer */}
      <div className="pa-composer">
        <input
          className="pa-input"
          placeholder="Ask a question…"
          value={input}
          disabled={loading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") void ask();
          }}
        />
        <button
          className="pa-send"
          disabled={loading || !input.trim()}
          onClick={() => void ask()}
        >
          {loading ? "…" : "Ask"}
        </button>
      </div>
    </div>
  );
}

const EVENT_LABELS: Record<string, string> = {
  // State transitions
  intake_received: "Matter received and secured",
  under_review: "Document under procedural review",
  compliance_review: "Compliance review initiated",
  quoted: "Execution proposal issued",
  awaiting_payment: "Payment required before scheduling",
  payment_confirmed: "Payment confirmed — scheduling unlocked",
  scheduled: "Execution session scheduled",
  in_execution: "Execution in progress",
  apostille_processing: "Apostille processing initiated",
  courier_ready: "Document packaged for release",
  shipped: "Released to courier",
  delivered: "Delivery confirmed",
  completed: "Matter closed",
  // Custody ledger events
  DOC_SIGNED: "Notarization completed",
  DOC_APOSTILLED: "Apostille issued",
  DOC_SHIPPED: "Released to courier",
  DOC_DELIVERED: "Delivery confirmed",
  DOC_RELEASED: "Document released",
  PAYMENT_RECEIVED: "Payment received",
  REVIEW_STARTED: "Procedural review initiated",
  OPERATOR_ASSIGNED: "Execution coordinator assigned",
  MATTER_CREATED: "Matter created",
  MATTER_UPDATED: "Status updated",
};

function formatEventLabel(raw: string): string {
  if (EVENT_LABELS[raw]) return EVENT_LABELS[raw];
  return raw
    .replace(/^DOC_/, "")
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Payment Confirmed",
  confirmed: "Payment Confirmed",
  pending: "Payment Pending",
  awaiting: "Payment Required",
  unpaid: "Payment Required",
  failed: "Payment Failed",
};

interface Message {
  id: string;
  direction: "inbound" | "outbound";
  channel: string;
  content: string;
  status: string | null;
  created_at: string;
}


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
    return true;
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

  if (isLoading) {
    return (
      <div style={{ paddingTop: 8 }}>
        {[55, 36, 80, 55].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 0 ? 28 : i === 1 ? 18 : 52,
              borderRadius: 2,
              marginBottom: 12,
              background: "rgba(198,165,90,0.05)",
              border: "1px solid rgba(198,165,90,0.08)",
              animation: "ppSkeleton 2s ease-in-out infinite",
              animationDelay: `${i * 0.15}s`,
              width: `${w}%`,
            }}
          />
        ))}
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="pp-no-deal">
        <div className="pp-no-deal-title">No matter linked yet</div>
        <div className="pp-no-deal-body">
          {message ??
            "We couldn't find a matter associated with this account. Please contact your coordinator."}
        </div>
      </div>
    );
  }

  const paymentConfirmed =
    deal.payment_status === "paid" ||
    deal.payment_status === "confirmed" ||
    deal.matter_status === "payment_confirmed";

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
        <div className="pp-sub" style={{ marginBottom: 20 }}>
          {deal.document_type ?? "Document execution"} · <em>{deal.destination_country ?? "—"}</em>
        </div>

        {/* PORTAL-01: Matter Intelligence Hero */}
        <MatterJourneyCard deal={deal} />

        {/* PORTAL-03: Execution Readiness (client-safe) */}
        <ReadinessSummaryCard />

        {/* Paid & Released banner */}
        <AnimatePresence>
          {deal.is_paid_and_released && (
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

        {/* Payment confirmed reveal */}
        <AnimatePresence>
          {paymentConfirmed && !deal.is_paid_and_released && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.28 }}
              className="mb-4 border rounded-sm px-4 py-3 flex items-center gap-3"
              style={{
                background: "rgba(198,165,90,0.05)",
                borderColor: "rgba(198,165,90,0.18)",
              }}
            >
              <span style={{ color: "#C6A55A", fontSize: 13 }}>✓</span>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>
                Payment confirmed — scheduling is now unlocked.
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
            {/* Premium status rail — PORTAL-MOTION-01 */}
            <div className="pp-card">
              <div className="pp-card-h">Execution Progress</div>
              <PortalStatusRail
                matterStatus={deal.matter_status}
                paymentStatus={deal.payment_status}
              />
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

            {/* Client matter guide assistant */}
            <PortalAssistant />
          </motion.div>

          {/* Right column */}
          <motion.div
            initial={{ opacity: 0.3, filter: "blur(2px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ duration: 0.4, ease: "easeInOut", delay: 0.2 }}
          >
            {/* Coordinator card */}
            <div className="pp-card">
              <CoordinatorCard />
            </div>

            <div className="pp-card">
              <div className="pp-card-h">Matter Details</div>
              <div className="pp-kv">
                <span className="pp-kv-k">Matter ID</span>
                <span className="pp-kv-v pp-kv-v mono">
                  {(deal.display_id ?? deal.id).slice(0, 8).toUpperCase()}…
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Document</span>
                <span className="pp-kv-v">{deal.document_type ?? "—"}</span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Destination</span>
                <span className="pp-kv-v">
                  {deal.destination_country ?? "—"}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Status</span>
                <span className="pp-kv-v pp-kv-v gold">
                  {deal.client_facing_status ??
                    (deal.matter_status ?? "").replace(/_/g, " ")}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Payment</span>
                <span
                  className={`pp-kv-v ${paymentConfirmed ? "pp-kv-v paid" : "pp-kv-v pending"}`}
                >
                  {paymentConfirmed ? "Paid" : "Pending"}
                </span>
              </div>
              {deal.payment_amount_due != null && !paymentConfirmed && (
                <div className="pp-kv">
                  <span className="pp-kv-k">Amount Due</span>
                  <span className="pp-kv-v gold">
                    ${deal.payment_amount_due.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            <PreFlightReview deal={deal} />

            {ledger.length > 0 && (
              <div className="pp-card">
                <div className="pp-card-h">Execution Timeline</div>
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
                          {formatEventLabel(l.event)}
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

            {/* Courier & Delivery */}
            <PortalCourierCustody />

            {/* Chain of Custody Timeline */}
            <CustodyTimeline />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
