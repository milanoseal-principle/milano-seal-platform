
import { Activity, Circle } from "lucide-react";
import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { loadOperationalHealth } from "@/lib/operator-intelligence/read-model";

export const dynamic = "force-dynamic";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Types ──────────────────────────────────────────────────────────────────────
type HealthState = "Operational" | "Unknown" | "Degraded" | "Offline";

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

export default async function MonitoringPage() {
  const actor = await requireDashboardAccess();
  const monitors = await loadOperationalHealth(actor.role);
  const unknown = monitors.filter((m) => m.state === "Unknown").length;
  const degraded = monitors.filter(m => m.state === "Degraded").length;
  const operational = monitors.filter((m) => m.state === "Operational").length;

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
          Read-only observations from canonical records. Each observation is timestamped.
          External provider availability, backup recovery and deployment identity remain NOT VERIFIED until separately evidenced.
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
        <div>
          <div style={{ fontSize: 18, color: "rgba(239,68,68,0.75)", lineHeight: 1 }}>{degraded}</div>
          <div style={{ fontSize: 8, letterSpacing: "0.2em", marginTop: 2 }}>RECORDED EXCEPTIONS</div>
        </div>
        <div style={{ marginLeft: "auto" }}>
          <span style={{ fontSize: 8, color: "rgba(255,255,255,0.18)", letterSpacing: "0.15em" }}>
            READ-ONLY · NO UPTIME CLAIMS · CONFIRM BEFORE RELEASE
          </span>
        </div>
      </div>

      {/* Monitor targets */}
      <div className="flex flex-col gap-2">
        {monitors.map((m) => (
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
                {m.observedAt ? ` Observed ${m.observedAt}` : ""}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {monitors.length} CANONICAL CHECKS · LATEST SERVER OBSERVATION · NO UPTIME CLAIMS
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
