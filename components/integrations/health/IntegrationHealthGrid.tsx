"use client";

/**
 * IntegrationHealthGrid — normalized Wise / BlueNotary / Shippo health cards.
 * Evidence-based (configured ≠ live); reduced-motion friendly (state conveyed by
 * text + icon + colour, never colour alone); responsive; no raw payloads/secrets.
 */

import type { IntegrationHealthRecord, IntegrationHealth } from "@/lib/integration-command/integrationReadModel";

const DOT: Record<IntegrationHealth, string> = {
  healthy: "bg-emerald-400",
  configured: "bg-[var(--ms-gold)]",
  degraded: "bg-amber-400",
  action_required: "bg-[#E0876E]",
  unavailable: "bg-white/30",
  unknown: "bg-white/30",
};

const STATE_LABEL: Record<IntegrationHealth, string> = {
  healthy: "Healthy",
  configured: "Configured · verify live",
  degraded: "Degraded",
  action_required: "Action required",
  unavailable: "Unavailable",
  unknown: "Unknown",
};

export function IntegrationHealthGrid({ records }: { records: IntegrationHealthRecord[] }) {
  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
      {records.map((r) => (
        <div key={r.provider} className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-3">
          <div className="mb-1 flex items-center gap-2">
            <span className={`h-2 w-2 flex-shrink-0 rounded-full ${DOT[r.health]}`} aria-hidden="true" />
            <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-white/60">{r.label}</span>
          </div>
          <p className="text-[12px] text-white/75">{STATE_LABEL[r.health]}</p>
          <p className="mt-1 text-[10px] leading-snug text-white/40">{r.operatorMessage}</p>
        </div>
      ))}
    </div>
  );
}
