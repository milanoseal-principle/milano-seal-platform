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
import type { ClientMatterIntelligence } from "@/lib/matterIntelligence";
import { PortalTrustOrbit } from "@/components/orbit/PortalTrustOrbit";
import type { OrbitState } from "@/lib/orbit/orbitStateMap";
import { StatusTransitionPill } from "@/components/animations/StatusTransitionPill";
import { TrustConfirmSeal } from "@/components/animations/TrustConfirmSeal";

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

// ─── Concierge copy helper ───────────────────────────────────────────────────

function getConciergeCopy(status: string): string {
  switch (status) {
    case "awaiting_payment":
      return "Complete payment to unlock scheduling. Estimated review: 1–2 business days after payment confirmation.";
    case "payment_confirmed":
      return "Payment confirmed. Your coordinator is preparing your execution session.";
    case "scheduled":
      return "Your execution session is scheduled. Your coordinator will reach out with final preparation steps.";
    case "in_execution":
      return "Your documents are being executed. You'll be notified when apostille processing begins.";
    case "apostille_processing":
      return "Apostille processing is underway with the Florida Department of State.";
    case "courier_ready":
      return "Documents are prepared for release to your international courier.";
    case "shipped":
      return "Your documents are in transit via international courier.";
    case "delivered":
    case "completed":
      return "Your documents have been delivered. Review The Vault for release records.";
    default:
      return "";
  }
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


// ─── Matter Intelligence Card ────────────────────────────────────────────────

const GOLD_MI = "#C6A55A";
const EMERALD_MI = "#4a9e6b";

function MatterIntelligenceCard() {
  const [intel, setIntel] = useState<ClientMatterIntelligence | null>(null);

  useEffect(() => {
    fetch("/api/portal/me/matter-intelligence-v2")
      .then((r) => r.ok ? r.json() as Promise<{ intelligence: ClientMatterIntelligence | null }> : Promise.resolve({ intelligence: null }))
      .then((d) => setIntel(d.intelligence ?? null))
      .catch(() => setIntel(null));
  }, []);

  if (!intel) return null;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.01)",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 6,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "monospace", color: "rgba(198,165,90,0.55)", marginBottom: 16 }}>
        Matter Intelligence
      </div>

      {/* Execution Path */}
      {intel.execution_path.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Execution Path</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {intel.execution_path.map((step, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.04em",
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: "rgba(198,165,90,0.07)",
                  border: "1px solid rgba(198,165,90,0.18)",
                  color: GOLD_MI,
                }}
              >
                {i + 1}. {step}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Flags row */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 24px", marginBottom: intel.timeline_note ? 14 : 0 }}>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Translation</div>
          <span style={{ fontSize: 11, color: intel.translation_required ? GOLD_MI : EMERALD_MI }}>
            {intel.translation_required
              ? `Required${intel.translation_language ? ` — ${intel.translation_language}` : ""}${intel.translation_certified ? " (Certified)" : ""}`
              : "Not required"}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Witnesses</div>
          <span style={{ fontSize: 11, color: intel.witnesses_required ? GOLD_MI : "rgba(255,255,255,0.45)" }}>
            {intel.witnesses_required ? "Required" : "Not required"}
          </span>
        </div>
        <div>
          <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Apostille</div>
          <span style={{ fontSize: 11, color: intel.apostille_required ? GOLD_MI : "rgba(255,255,255,0.45)" }}>
            {intel.apostille_required ? "Required" : "Not required"}
          </span>
        </div>
        {intel.timeline_note && (
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>Est. Timeline</div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{intel.timeline_note}</span>
          </div>
        )}
      </div>
    </div>
  );
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
      <div style={{ paddingTop: 8 }} role="status" aria-label="Verifying matter state…">
        <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(198,165,90,0.45)", marginBottom: 16, letterSpacing: "0.1em" }}>
          Verifying matter state…
        </div>
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

        {/* Trust Orbit — visual trust state */}
        <PortalTrustOrbit
          state={(deal.matter_status ?? "idle") as OrbitState}
          clientName={deal.client_name ?? undefined}
        />

        {/* PORTAL-01: Matter Intelligence Hero */}
        <MatterJourneyCard deal={deal} />

        {/* PORTAL-03: Execution Readiness (client-safe) */}
        <ReadinessSummaryCard />

        {/* PORTAL-02: Matter Intelligence Card */}
        <MatterIntelligenceCard />

        {/* Paid & Released banner */}
        <AnimatePresence>
          {deal.is_paid_and_released && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="mb-5"
              style={{
                background: "linear-gradient(135deg, rgba(16,185,129,0.06) 0%, rgba(198,165,90,0.06) 100%)",
                border: "1px solid rgba(198,165,90,0.35)",
                borderRadius: 6,
                padding: "16px 20px",
                boxShadow: "0 0 20px rgba(198,165,90,0.07), inset 0 1px 0 rgba(198,165,90,0.1)",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ color: "#4a9e6b", fontSize: 18, lineHeight: 1 }}>✓</span>
                  <div>
                    <div style={{ fontFamily: "var(--font-playfair, Georgia, serif)", fontWeight: 600, fontSize: 15, color: "#C6A55A", letterSpacing: "0.02em" }}>
                      PAID &amp; RELEASED
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginTop: 3 }}>
                      Your documents have been released. Review The Vault for records.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <a
                    href="/portal/documents"
                    style={{
                      fontSize: 11,
                      fontFamily: "monospace",
                      letterSpacing: "0.06em",
                      color: "#C6A55A",
                      border: "1px solid rgba(198,165,90,0.35)",
                      borderRadius: 3,
                      padding: "5px 12px",
                      textDecoration: "none",
                      background: "rgba(198,165,90,0.06)",
                    }}
                  >
                    View Vault
                  </a>
                  <a
                    href="/api/portal/me/certificate"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      fontSize: 10,
                      fontFamily: "monospace",
                      letterSpacing: "0.05em",
                      color: "#C6A55A",
                      border: "1px solid rgba(198,165,90,0.35)",
                      borderRadius: 3,
                      padding: "5px 12px",
                      background: "rgba(198,165,90,0.06)",
                      textDecoration: "none",
                    }}
                    onClick={async (e) => {
                      e.preventDefault();
                      const res = await fetch("/api/portal/me/certificate");
                      const data = await res.json();
                      if (data.certificate?.verification_url) {
                        window.open(data.certificate.verification_url, "_blank");
                      } else {
                        alert("Certificate not yet available. Please contact your coordinator.");
                      }
                    }}
                  >
                    Certificate of Custody
                  </a>
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
              <TrustConfirmSeal event="payment_confirmed" size="sm" />
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
                <span className="pp-kv-k">Execution Lane</span>
                <span className="pp-kv-v">
                  {deal.assigned_lane
                    ? deal.assigned_lane === "signature"
                      ? "Signature Lane"
                      : deal.assigned_lane === "priority"
                      ? "Priority Lane"
                      : deal.assigned_lane === "executive"
                      ? "Executive Lane"
                      : deal.assigned_lane.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
                    : "To Be Confirmed"}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Destination</span>
                <span className="pp-kv-v">
                  {deal.destination_country ?? "—"}
                </span>
              </div>
              <div className="pp-kv">
                <span className="pp-kv-k">Status</span>
                <span className="pp-kv-v">
                  <StatusTransitionPill status={deal.matter_status ?? "new"} size="sm" />
                </span>
              </div>
              {deal.matter_status && getConciergeCopy(deal.matter_status) && (
                <div className="pp-kv" style={{ flexDirection: "column", alignItems: "flex-start", gap: 4 }}>
                  <span className="pp-kv-k">Concierge Note</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55 }}>
                    {getConciergeCopy(deal.matter_status)}
                  </span>
                </div>
              )}
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
            <CustodyTimeline deal={deal} />
          </motion.div>
        </div>
      </motion.div>
    </>
  );
}
