import { toneStyles, type DashboardTone } from "./dashboardTheme";

// Canonical matter / payment / release status pill. One source of truth for every
// dashboard surface so status reads identically everywhere. Labels are operator-
// facing and client-safe (no internal mechanics). Unknown statuses render neutral
// with a humanized label rather than crashing.

const STATUS_MAP: Record<string, { label: string; tone: DashboardTone }> = {
  intake_received: { label: "Intake Received", tone: "neutral" },
  under_review: { label: "Under Review", tone: "blue" },
  quoted: { label: "Quoted", tone: "blue" },
  awaiting_payment: { label: "Awaiting Payment", tone: "amber" },
  payment_observed: { label: "Payment Observed", tone: "amber" },
  payment_cleared: { label: "Payment Cleared", tone: "green" },
  scheduled: { label: "Scheduled", tone: "blue" },
  in_execution: { label: "In Execution", tone: "gold" },
  apostille_processing: { label: "Apostille Processing", tone: "gold" },
  apostille_received: { label: "Apostille Received", tone: "gold" },
  in_transit: { label: "In Transit", tone: "blue" },
  delivered: { label: "Delivered", tone: "green" },
  ready_for_release: { label: "Ready for Release", tone: "amber" },
  release_ready: { label: "Release Ready", tone: "amber" },
  release_locked: { label: "Release Locked", tone: "red" },
  released: { label: "Released", tone: "green" },
  completed: { label: "Completed", tone: "green" },
  lost: { label: "Closed", tone: "neutral" },
  mismatch_review: { label: "Mismatch Review", tone: "red" },
  // legacy DealStatus aliases
  new: { label: "Intake Received", tone: "neutral" },
  reviewing: { label: "Under Review", tone: "blue" },
  apostille: { label: "Apostille Processing", tone: "gold" },
  shipped: { label: "In Transit", tone: "blue" },
};

function humanize(s: string): string {
  return s.replace(/[_-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusPill({
  status,
  size = "md",
}: {
  status: string | null | undefined;
  size?: "sm" | "md";
}) {
  const key = (status ?? "").toLowerCase();
  const entry = STATUS_MAP[key] ?? { label: status ? humanize(key) : "—", tone: "neutral" as DashboardTone };
  const t = toneStyles[entry.tone];
  return (
    <span
      data-status={key || "none"}
      className={`inline-flex items-center gap-1.5 rounded-full font-mono uppercase tracking-[0.12em] ${
        size === "sm" ? "px-2 py-0.5 text-[8px]" : "px-2.5 py-1 text-[9px]"
      }`}
      style={{ color: t.fg, background: t.bg, border: `1px solid ${t.border}` }}
    >
      <span
        aria-hidden="true"
        className="h-1 w-1 rounded-full"
        style={{ background: t.fg }}
      />
      {entry.label}
    </span>
  );
}
