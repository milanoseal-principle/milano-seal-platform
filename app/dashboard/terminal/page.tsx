"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ──────────────────────────────────────────────────────────────────

interface HealthData {
  total_deals: number;
  open: number;
  closed: number;
  revenue_closed: number;
  revenue_pipeline: number;
  awaiting_payment: number;
  intake_today: number;
}

interface PipelineStage {
  stage: string;
  count: number;
  total_value: number;
}

interface PipelineData {
  total_open: number;
  total_value_open: number;
  total_value_closed: number;
  stages: PipelineStage[];
}

interface AlertItem {
  deal_id: string;
  client_name: string;
  deal_status: string;
  hours_in_stage: number;
  severity: "low" | "medium" | "high";
}

interface CustodyRow {
  event: string;
  actor_type: string;
  location: string | null;
  created_at: string;
}

interface CustodyData {
  ledger: CustodyRow[];
  verdict: { valid: boolean; total: number; reason?: string };
}

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type LeftTab = "health" | "alerts" | "pipeline" | "custody";

// ─── Constants ──────────────────────────────────────────────────────────────

const QUICK_PROMPTS = [
  "What is blocking this matter?",
  "Is apostille required?",
  "Is translation review likely?",
  "What documents are missing?",
  "Can scheduling proceed?",
  "Generate a client-safe update.",
  "Summarize this matter.",
  "Show release blockers.",
  "Explain destination routing.",
];

const EVENT_LABELS: Record<string, string> = {
  DOC_CREATED: "Document Created",
  DOC_RECEIVED: "Document Received",
  DOC_IN_POSSESSION: "Document In Possession",
  DOC_HANDOFF: "Document Handoff",
  DOC_NOTARIZED: "Document Notarized",
  DOC_APOSTILLE_SUBMITTED: "Apostille Submitted",
  DOC_APOSTILLE_RECEIVED: "Apostille Received",
  DOC_LABEL_CREATED: "Courier Label Created",
  DOC_SHIPPED: "Document Dispatched",
  DOC_IN_TRANSIT: "In Transit",
  DOC_OUT_FOR_DELIVERY: "Out for Delivery",
  DOC_DELIVERED: "Document Delivered",
  DOC_SIGNED: "Document Signed",
  DOC_RELEASE_CONFIRMED: "Release Confirmed",
};

const STAGE_LABELS: Record<string, string> = {
  new: "Intake",
  intake_received: "Intake Received",
  under_review: "Under Review",
  compliance_review: "Compliance Review",
  quoted: "Quoted",
  awaiting_payment: "Awaiting Payment",
  payment_confirmed: "Payment Confirmed",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille Processing",
  courier_ready: "Courier Ready",
  shipped: "Shipped",
  delivered: "Delivered",
  completed: "Completed",
  closed: "Closed",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return `$${n.toLocaleString()}`;
}

function buildSystemPrompt(
  health: HealthData | null,
  alerts: AlertItem[],
): string {
  const ctx: string[] = [];
  if (health) {
    ctx.push(`Open matters: ${health.open}.`);
    ctx.push(`Awaiting payment: ${health.awaiting_payment}.`);
    ctx.push(`New intake today: ${health.intake_today}.`);
    ctx.push(`Pipeline value: ${fmt(health.revenue_pipeline)}.`);
  }
  if (alerts.length > 0) {
    const high = alerts.filter((a) => a.severity === "high").length;
    ctx.push(
      `SLA alerts: ${alerts.length} active${high > 0 ? `, ${high} high severity` : ""}.`,
    );
  }

  return `You are the Execution Assistant™ for The Milano Seal™ — a luxury international document execution platform specializing in Remote Online Notarization, apostille coordination, and cross-border document support.

Your role: provide calm, procedural, authoritative guidance to operators managing international document matters.

${ctx.length ? `Operational context:\n${ctx.join("\n")}` : ""}

Response format:
- Open every response with a category label in ALL CAPS on its own line. Use one of: DESTINATION INTELLIGENCE / APOSTILLE GUIDANCE / TRANSLATION REVIEW / SCHEDULING STATUS / PAYMENT LOCK / COURIER READINESS / RELEASE BLOCKERS / MATTER SUMMARY / CLIENT SAFE UPDATE / COORDINATOR RECOMMENDATION / MISSING DOCUMENTS
- Follow with 2–4 sentences of calm, procedural guidance
- Maximum 120 words total

Tone rules:
- Never use: "Approved", "Guaranteed", "Confirmed by government", "Embassy verified", "Legal requirement confirmed", "Executing protocol"
- Use: "appears to require", "is likely recommended", "based on destination routing", "review is advised", "standard practice for Hague destinations"
- Never fabricate tracking numbers, case IDs, or data not provided
- Refer to Hague Convention membership, not government approval
- Procedural guidance only — not legal advice`;
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatRow({
  label,
  value,
  gold,
}: {
  label: string;
  value: string;
  gold?: boolean;
}) {
  return (
    <div className="ea-stat-row">
      <span className="ea-stat-label">{label}</span>
      <span className={`ea-stat-value${gold ? " ea-stat-gold" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function SkeletonRows() {
  return (
    <>
      {[72, 48, 88, 55, 76].map((w, i) => (
        <div
          key={i}
          className="ea-skeleton"
          style={{ width: `${w}%`, animationDelay: `${i * 0.14}s` }}
        />
      ))}
    </>
  );
}

function EmptyState({ text, ok }: { text: string; ok?: boolean }) {
  return (
    <div className="ea-empty">
      {ok && <span className="ea-empty-ok">✓</span>}
      <span className="ea-empty-text">{text}</span>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ExecutionAssistantPage() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [pipeline, setPipeline] = useState<PipelineData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [custody, setCustody] = useState<CustodyData | null>(null);
  const [custodyId, setCustodyId] = useState("");
  const [custodyLoading, setCustodyLoading] = useState(false);
  const [leftTab, setLeftTab] = useState<LeftTab>("health");
  const [dataLoading, setDataLoading] = useState(true);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const threadRef = useRef<HTMLDivElement>(null);

  // Auto-load all passive data on mount
  useEffect(() => {
    void (async () => {
      setDataLoading(true);
      try {
        const [h, p, a] = await Promise.all([
          fetch("/api/dashboard/summary").then((r) => r.json()),
          fetch("/api/admin/pipeline").then((r) => r.json()),
          fetch("/api/admin/sla-alerts").then((r) => r.json()),
        ]);
        setHealth(h as HealthData);
        setPipeline(p as PipelineData);
        setAlerts((a as AlertItem[]) ?? []);
      } catch {
        // Left panel shows graceful empty state
      } finally {
        setDataLoading(false);
      }
    })();
  }, []);

  // Scroll thread to latest
  useEffect(() => {
    threadRef.current?.scrollTo({
      top: threadRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, aiLoading]);

  async function loadCustody() {
    const id = custodyId.trim();
    if (!id || custodyLoading) return;
    setCustodyLoading(true);
    setCustody(null);
    try {
      const r = await fetch(`/api/deals/${id}/custody`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setCustody((await r.json()) as CustodyData);
      setLeftTab("custody");
    } catch {
      // Custody search shows empty state
    } finally {
      setCustodyLoading(false);
    }
  }

  async function send(text?: string) {
    const prompt = (text ?? input).trim();
    if (!prompt || aiLoading) return;
    setInput("");
    const userMsg: ChatMessage = {
      id: `u${Date.now()}`,
      role: "user",
      content: prompt,
    };
    setMessages((m) => [...m, userMsg]);
    setAiLoading(true);
    try {
      const r = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          system: buildSystemPrompt(health, alerts),
        }),
      });
      const data = (await r.json()) as { text?: string; error?: string };
      const content =
        data.text ??
        (data.error
          ? `SERVICE UNAVAILABLE\n\n${data.error}`
          : "No response.");
      setMessages((m) => [
        ...m,
        { id: `a${Date.now()}`, role: "assistant", content },
      ]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: `a${Date.now()}`,
          role: "assistant",
          content:
            "SERVICE UNAVAILABLE\n\nThe execution assistant is temporarily unreachable. Confirm ANTHROPIC_API_KEY is set in Vercel environment variables.",
        },
      ]);
    } finally {
      setAiLoading(false);
    }
  }

  function parseResponse(content: string): { header: string; body: string } {
    const lines = content.trim().split("\n");
    const first = lines[0].trim();
    if (/^[A-Z][A-Z\s/]+$/.test(first) && first.length < 64) {
      return { header: first, body: lines.slice(1).join("\n").trim() };
    }
    return { header: "", body: content.trim() };
  }

  const highAlerts = alerts.filter((a) => a.severity === "high").length;

  return (
    <>
      <style>{`
        @keyframes ea-shimmer { 0%,100%{opacity:.35} 50%{opacity:.65} }
        @keyframes ea-dot { 0%,80%,100%{opacity:.25;transform:scale(.8)} 40%{opacity:1;transform:scale(1)} }
      `}</style>

      {/* Page header */}
      <div className="ea-header">
        <div>
          <div className="ea-eyebrow">Execution Assistant™</div>
          <h1 className="ea-h1">Operational Ledger + Matter Intelligence</h1>
        </div>
        <div className="ea-live">
          <span className="ea-live-dot" />
          <span className="ea-live-label">Live</span>
        </div>
      </div>

      {/* Dual-panel workspace */}
      <div className="ea-workspace">

        {/* ── Left Wing: Passive Operational Ledger ───────────────────── */}
        <div className="ea-left">
          {/* Tab bar */}
          <div className="ea-tabs">
            {(["health", "alerts", "pipeline", "custody"] as LeftTab[]).map(
              (t) => (
                <button
                  key={t}
                  className={`ea-tab${leftTab === t ? " ea-tab-on" : ""}`}
                  onClick={() => setLeftTab(t)}
                >
                  {t === "alerts" && highAlerts > 0 && (
                    <span className="ea-tab-badge">{highAlerts}</span>
                  )}
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ),
            )}
          </div>

          <div className="ea-left-body">

            {/* Health */}
            {leftTab === "health" && (
              <div key="health">
                {dataLoading ? (
                  <SkeletonRows />
                ) : health ? (
                  <>
                    <StatRow label="Open Matters" value={String(health.open)} />
                    <StatRow
                      label="Awaiting Payment"
                      value={String(health.awaiting_payment)}
                    />
                    <StatRow
                      label="New Intake Today"
                      value={String(health.intake_today)}
                    />
                    <StatRow
                      label="Pipeline Value"
                      value={fmt(health.revenue_pipeline)}
                      gold
                    />
                    <StatRow
                      label="Closed Revenue"
                      value={fmt(health.revenue_closed)}
                    />
                    <StatRow
                      label="Total Matters"
                      value={String(health.total_deals)}
                    />
                  </>
                ) : (
                  <EmptyState text="Health data unavailable." />
                )}
              </div>
            )}

            {/* Alerts */}
            {leftTab === "alerts" && (
              <div key="alerts">
                {dataLoading ? (
                  <SkeletonRows />
                ) : alerts.length === 0 ? (
                  <EmptyState
                    text="No SLA alerts. All matters within threshold."
                    ok
                  />
                ) : (
                  alerts.map((a, i) => (
                    <div key={i} className={`ea-alert ea-alert-${a.severity}`}>
                      <div className="ea-alert-top">
                        <span
                          className={`ea-sev ea-sev-${a.severity}`}
                        >
                          {a.severity.toUpperCase()}
                        </span>
                        <span className="ea-alert-name">
                          {a.client_name ?? a.deal_id.slice(0, 8).toUpperCase()}
                        </span>
                      </div>
                      <div className="ea-alert-meta">
                        {STAGE_LABELS[a.deal_status] ?? a.deal_status} ·{" "}
                        {a.hours_in_stage}h in stage
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Pipeline */}
            {leftTab === "pipeline" && (
              <div key="pipeline">
                {dataLoading ? (
                  <SkeletonRows />
                ) : pipeline ? (
                  <>
                    <StatRow
                      label="Open Matters"
                      value={String(pipeline.total_open)}
                    />
                    <StatRow
                      label="Pipeline Value"
                      value={fmt(pipeline.total_value_open)}
                      gold
                    />
                    <StatRow
                      label="Closed Revenue"
                      value={fmt(pipeline.total_value_closed)}
                    />
                    <div className="ea-stage-divider">Stage Breakdown</div>
                    {pipeline.stages
                      .filter((s) => s.count > 0)
                      .map((s) => (
                        <div key={s.stage} className="ea-stage-row">
                          <span className="ea-stage-name">
                            {STAGE_LABELS[s.stage] ?? s.stage}
                          </span>
                          <span className="ea-stage-count">{s.count}</span>
                        </div>
                      ))}
                  </>
                ) : (
                  <EmptyState text="Pipeline data unavailable." />
                )}
              </div>
            )}

            {/* Custody */}
            {leftTab === "custody" && (
              <div key="custody">
                <div className="ea-custody-search">
                  <input
                    className="ea-custody-input"
                    placeholder="Matter ID"
                    value={custodyId}
                    onChange={(e) => setCustodyId(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void loadCustody();
                    }}
                  />
                  <button
                    className="ea-custody-btn"
                    onClick={() => void loadCustody()}
                    disabled={custodyLoading || !custodyId.trim()}
                  >
                    {custodyLoading ? "…" : "Load"}
                  </button>
                </div>
                {custody ? (
                  <>
                    <div
                      className={`ea-chain-verdict ea-chain-${
                        custody.verdict.valid ? "ok" : "err"
                      }`}
                    >
                      {custody.verdict.valid ? "✓ Chain Verified" : "✕ Chain Issue"}
                      <span className="ea-chain-count">
                        {" "}— {custody.verdict.total} entries
                      </span>
                    </div>
                    {custody.ledger
                      .slice(-12)
                      .reverse()
                      .map((row, i) => (
                        <div key={i} className="ea-custody-row">
                          <div className="ea-custody-event">
                            {EVENT_LABELS[row.event] ??
                              row.event.replace(/_/g, " ")}
                          </div>
                          <div className="ea-custody-meta">
                            {row.actor_type}
                            {row.location ? ` · ${row.location}` : ""}
                          </div>
                          <div className="ea-custody-time">
                            {new Date(row.created_at).toLocaleString()}
                          </div>
                        </div>
                      ))}
                  </>
                ) : (
                  <EmptyState text="Enter a Matter ID to load the custody chain." />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Right Wing: Execution Assistant ─────────────────────────── */}
        <div className="ea-right">
          {/* Message thread */}
          <div className="ea-thread" ref={threadRef}>
            {messages.length === 0 && !aiLoading && (
              <div className="ea-welcome">
                <div className="ea-welcome-mark">✦</div>
                <div className="ea-welcome-title">Execution Assistant™</div>
                <div className="ea-welcome-sub">
                  Ask about destination routing, apostille requirements,
                  scheduling readiness, missing documents, or generate a
                  client-safe update.
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((msg) => {
                if (msg.role === "user") {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
                      className="ea-user-msg"
                    >
                      {msg.content}
                    </motion.div>
                  );
                }
                const { header, body } = parseResponse(msg.content);
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
                    className="ea-response-card"
                  >
                    {header && (
                      <div className="ea-card-header">
                        <span className="ea-card-mark">✦</span>
                        {header}
                      </div>
                    )}
                    <div className="ea-card-body">{body}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>

            {aiLoading && (
              <div className="ea-thinking">
                {[0, 160, 320].map((d) => (
                  <span
                    key={d}
                    className="ea-dot"
                    style={{ animationDelay: `${d}ms` }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Quick action chips */}
          <div className="ea-chips">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                className="ea-chip"
                disabled={aiLoading}
                onClick={() => void send(p)}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Input composer */}
          <div className="ea-composer">
            <textarea
              className="ea-composer-input"
              placeholder="Ask about this matter…"
              value={input}
              rows={2}
              disabled={aiLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
            />
            <button
              className="ea-send-btn"
              disabled={aiLoading || !input.trim()}
              onClick={() => void send()}
              aria-label="Send"
            >
              <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M14 8L2 2l2.5 6L2 14l12-6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
