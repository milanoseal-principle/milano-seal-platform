import type { ReactNode } from "react";
import { toneStyles, type DashboardTone } from "./dashboardTheme";

// Premium stat card. No fake metrics: when value is null/undefined it shows "—";
// when loading it shows a skeleton. Tone tints the value + accent only.

export function MetricCard({
  label,
  value,
  detail,
  tone = "neutral",
  trend,
  loading = false,
}: {
  label: string;
  value: string | number | null | undefined;
  detail?: string;
  tone?: DashboardTone;
  trend?: string;
  loading?: boolean;
}) {
  const t = toneStyles[tone];
  const display = value === null || value === undefined || value === "" ? "—" : value;
  return (
    <div
      data-critical-card=""
      className="relative overflow-hidden rounded-xl border p-4"
      style={{ background: "rgba(11,11,11,0.9)", borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-4 top-0 h-px"
        style={{ background: `linear-gradient(90deg, transparent, ${t.border}, transparent)` }}
      />
      <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </p>
      {loading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-white/10" />
      ) : (
        <p className="mt-1.5 text-2xl font-light tabular-nums" style={{ color: t.fg }}>
          {display}
        </p>
      )}
      {(detail || trend) && !loading && (
        <p className="mt-1 text-[11px] text-muted-foreground">
          {trend ? <span style={{ color: t.fg }}>{trend} </span> : null}
          {detail}
        </p>
      )}
    </div>
  );
}

export function DashboardMetricGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
      {children}
    </div>
  );
}
