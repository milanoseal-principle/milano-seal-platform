"use client";

import { Activity, Circle } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Types ──────────────────────────────────────────────────────────────────────
type HealthState = "Operational" | "Unknown" | "Degraded" | "Offline";

interface MonitorTarget {
  id: string;
  label: string;
  category: string;
  state: HealthState;
  note: string;
}

// ── Safe default data — read-only indicators, no fake uptime percentages ───────
const MONITORS: MonitorTarget[] = [
  {
    id: "vercel",
    label: "Vercel",
    category: "Frontend Hosting",
    state: "Unknown",
    note: "Frontend deployment platform — operator review required to confirm current state",
  },
  {
    id: "render-api",
    label: "Render API",
    category: "Backend Hosting",
    state: "Unknown",
    note: "Render-hosted API service — confirm endpoint health before execution runs",
  },
  {
    id: "supabase",
    label: "Supabase",
    category: "Database",
    state: "Unknown",
    note: "Database + auth provider — confirm connectivity before scheduling or matter creation",
  },
  {
    id: "wise-webhook",
    label: "Wise Webhook",
    category: "Payment",
    state: "Unknown",
    note: "Payment confirmation webhook — payment_confirmed must be verified before release",
  },
  {
    id: "shippo-webhook",
    label: "Shippo Webhook",
    category: "Courier",
    state: "Unknown",
    note: "Courier tracking events — confirm before courier release operations",
  },
  {
    id: "twilio-webhook",
    label: "Twilio Webhook",
    category: "Communication",
    state: "Unknown",
    note: "Inbound SMS + notification callbacks — confirm before scheduling notifications",
  },
  {
    id: "document-vault",
    label: "Document Vault",
    category: "Storage",
    state: "Unknown",
    note: "Secure document storage endpoint — operator access only",
  },
  {
    id: "email-delivery",
    label: "Email Delivery",
    category: "Communication",
    state: "Unknown",
    note: "Transactional email provider — confirm delivery before client-facing sends",
  },
  {
    id: "ron-provider",
    label: "RON Provider",
    category: "Execution",
    state: "Unknown",
    note: "Remote Online Notarization infrastructure — authority-dependent eligibility, confirm before scheduling",
  },
];

const STATE_COLOR: Record<HealthState, string> = {
  Operational: "rgba(34,197,94,0.75)",
  Unknown: "rgba(212,175,55,0.65)",
  Degraded: "rgba(239,68,68,0.75)",
  Offline: "rgba(239,68,68,0.5)",
};

const STATE_DOT: Record<HealthState, string> = {
  Operational: "rgba(34,197,94,0.6)",
  Unknown: "rgba(212,175,55,0.45)",
  Degraded: "rgba(239,68,68,0.65)",
  Offline: "rgba(239,68,68,0.35)",
};

function HealthDot({ state }: { state: HealthState }) {
  const color = STATE_COLOR[state];
  const dot = STATE_DOT[state];
  return (
    <div className="flex items-center gap-1.5">
      <Circle size={7} style={{ color: dot, fill: dot }} />
      <span style={{ fontSize: 9, color, letterSpacing: "0.12em", fontFamily: "monospace" }}>
        {state.toUpperCase()}
      </span>
    </div>
  );
}

export default function MonitoringPage() {
  const unknown = MONITORS.filter((m) => m.state === "Unknown").length;
  const operational = MONITORS.filter((m) => m.state === "Operational").length;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <div className="flex items-center gap-3 mb-2">
          <Activity size={16} style={{ color: GOLD }} />
          <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8" }}>
            System Health Monitor
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Read-only integration health indicators. States reflect last known configuration.
          No live telemetry — operator verification required before execution.
        </p>
      </div>

      {/* Summary bar */}
      <div
        className="flex flex-wrap items-center gap-6 px-4 py-3 rounded-sm mb-6"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <div>
          <div style={{ fontSize: 18, color: "rgba(34,197,94,0.75)", fontFamily: "monospace", lineHeight: 1 }}>
            {operational}
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(34,197,94,0.45)", marginTop: 2 }}>OPERATIONAL</div>
        </div>
        <div style={{ width: 1, height: 28, background: BORDER }} />
        <div>
          <div style={{ fontSize: 18, color: "rgba(212,175,55,0.7)", fontFamily: "monospace", lineHeight: 1 }}>
            {unknown}
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: GOLD_DIM, marginTop: 2 }}>UNVERIFIED</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}>
            READ-ONLY · NO UPTIME CLAIMS · CONFIRM BEFORE RELEASE
          </span>
        </div>
      </div>

      {/* Monitor targets */}
      <div className="flex flex-col gap-2">
        {MONITORS.map((m) => (
          <div
            key={m.id}
            className="flex items-start gap-4 px-4 py-3 rounded-sm"
            style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
          >
            <HealthDot state={m.state} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-0.5">
                <span style={{ fontSize: 11, color: "#f4e5b8", letterSpacing: "0.06em" }}>
                  {m.label}
                </span>
                <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em" }}>
                  {m.category.toUpperCase()}
                </span>
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
                {m.note}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {MONITORS.length} TARGETS REGISTERED · READ-ONLY DISPLAY · NO LIVE POLLING
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
