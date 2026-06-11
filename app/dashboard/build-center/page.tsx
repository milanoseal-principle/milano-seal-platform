"use client";

import { CheckCircle2, AlertCircle, Radio } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Types ──────────────────────────────────────────────────────────────────────
type ReadinessState = "Nominal" | "Unknown" | "Degraded" | "Not Configured";

interface ServiceCard {
  id: string;
  label: string;
  category: string;
  state: ReadinessState;
  note: string;
}

// ── Safe default data — no live polling, no fake uptime claims ─────────────────
const SERVICES: ServiceCard[] = [
  {
    id: "frontend-build",
    label: "Frontend Build",
    category: "Deployment",
    state: "Nominal",
    note: "Next.js build pipeline — confirm before each production push",
  },
  {
    id: "api-health",
    label: "API Health",
    category: "Deployment",
    state: "Unknown",
    note: "Render API endpoint — operator review required to confirm",
  },
  {
    id: "wise-webhook",
    label: "Wise Webhook",
    category: "Payment",
    state: "Unknown",
    note: "Payment confirmation webhook — authority-dependent routing",
  },
  {
    id: "supabase-rls",
    label: "Supabase RLS",
    category: "Database",
    state: "Nominal",
    note: "Row-level security policies — confirm before release operations",
  },
  {
    id: "shippo",
    label: "Shippo",
    category: "Courier",
    state: "Unknown",
    note: "Label generation + tracking — confirm before courier release",
  },
  {
    id: "twilio",
    label: "Twilio",
    category: "Communication",
    state: "Unknown",
    note: "SMS + notification delivery — confirm before scheduling",
  },
  {
    id: "bluenotary-ron",
    label: "BlueNotary / RON",
    category: "Execution",
    state: "Unknown",
    note: "Remote Online Notarization provider — authority-dependent eligibility",
  },
  {
    id: "document-vault",
    label: "The Vault",
    category: "Storage",
    state: "Nominal",
    note: "Secure document storage — operator access only, no public exposure",
  },
  {
    id: "seo-registry",
    label: "SEO Registry",
    category: "Marketing",
    state: "Unknown",
    note: "Sitemap + metadata registry — confirm before domain changes",
  },
  {
    id: "ritual-status",
    label: "Ritual Status",
    category: "System",
    state: "Nominal",
    note: "Core execution ritual layer — do not modify without operator review",
  },
];

const STATE_COLOR: Record<ReadinessState, string> = {
  Nominal: "rgba(34,197,94,0.75)",
  Unknown: "rgba(212,175,55,0.6)",
  Degraded: "rgba(239,68,68,0.75)",
  "Not Configured": "rgba(255,255,255,0.2)",
};

const STATE_BG: Record<ReadinessState, string> = {
  Nominal: "rgba(34,197,94,0.06)",
  Unknown: "rgba(212,175,55,0.05)",
  Degraded: "rgba(239,68,68,0.06)",
  "Not Configured": "rgba(255,255,255,0.02)",
};

function StateIndicator({ state }: { state: ReadinessState }) {
  const color = STATE_COLOR[state];
  const isNominal = state === "Nominal";
  return (
    <div className="flex items-center gap-1.5">
      {isNominal
        ? <CheckCircle2 size={11} style={{ color }} />
        : <AlertCircle size={11} style={{ color }} />}
      <span style={{ fontSize: 9, color, letterSpacing: "0.12em", fontFamily: "monospace" }}>
        {state.toUpperCase()}
      </span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────
export default function BuildCenterPage() {
  const nominalCount = SERVICES.filter((s) => s.state === "Nominal").length;
  const unknownCount = SERVICES.filter((s) => s.state === "Unknown").length;

  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <div className="flex items-center gap-3 mb-2">
          <Radio size={16} style={{ color: GOLD }} />
          <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8" }}>
            Deployment Readiness Center
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Service integration status. All states require operator verification before execution.
          These indicators reflect last known configuration — not live telemetry.
        </p>
      </div>

      {/* Summary bar */}
      <div
        className="flex flex-wrap items-center gap-6 px-4 py-3 rounded-sm mb-6"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <div>
          <div style={{ fontSize: 18, color: "rgba(34,197,94,0.8)", fontFamily: "monospace", lineHeight: 1 }}>
            {nominalCount}
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: "rgba(34,197,94,0.5)", marginTop: 2 }}>NOMINAL</div>
        </div>
        <div style={{ width: 1, height: 28, background: BORDER }} />
        <div>
          <div style={{ fontSize: 18, color: "rgba(212,175,55,0.7)", fontFamily: "monospace", lineHeight: 1 }}>
            {unknownCount}
          </div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", color: GOLD_DIM, marginTop: 2 }}>REQUIRE VERIFICATION</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}>
            CONFIRM BEFORE RELEASE · OPERATOR REVIEW ONLY
          </span>
        </div>
      </div>

      {/* Service cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {SERVICES.map((svc) => (
          <div
            key={svc.id}
            className="rounded-sm p-4"
            style={{
              border: `1px solid ${BORDER}`,
              background: STATE_BG[svc.state],
            }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div>
                <div style={{ fontSize: 11, color: "#f4e5b8", letterSpacing: "0.06em", marginBottom: 2 }}>
                  {svc.label}
                </div>
                <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em" }}>
                  {svc.category.toUpperCase()}
                </div>
              </div>
              <StateIndicator state={svc.state} />
            </div>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
              {svc.note}
            </p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {SERVICES.length} SERVICES REGISTERED · READ-ONLY DISPLAY · NO LIVE TELEMETRY
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
