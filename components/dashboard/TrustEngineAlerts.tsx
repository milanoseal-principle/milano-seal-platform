"use client";

import Link from "next/link";
import { AlertTriangle, Info, Crown, ChevronRight } from "lucide-react";
import { useApi } from "@/hooks/useApi";

interface TrustAlert {
  label: string;
  count: number;
  severity: "warning" | "info" | "critical";
}

function SeverityIcon({ severity }: { severity: TrustAlert["severity"] }) {
  if (severity === "critical")
    return <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />;
  if (severity === "warning")
    return <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />;
  return <Info className="w-3.5 h-3.5 text-[#C6A55A] flex-shrink-0" />;
}

function severityColor(severity: TrustAlert["severity"]) {
  if (severity === "critical") return "text-red-400 border-red-400/30 bg-red-400/10";
  if (severity === "warning") return "text-amber-400 border-amber-400/30 bg-amber-400/10";
  return "text-[#C6A55A] border-[#C6A55A]/30 bg-[#C6A55A]/10";
}

export function TrustEngineAlerts() {
  const { data, isLoading } = useApi<TrustAlert[]>("/api/dashboard/trust-alerts");

  return (
    <div
      className="rounded-lg border border-white/[0.06] p-5 flex flex-col gap-4"
      style={{ background: "rgba(3,3,5,0.90)" }}
    >
      <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#C6A55A]/50">
        Trust Engine Alerts
      </p>

      <div className="flex flex-col gap-2">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-8 rounded bg-white/[0.03] animate-pulse" />
            ))
          : (data ?? []).map((alert) => (
              <div
                key={alert.label}
                className="flex items-center gap-3 py-1.5"
              >
                <SeverityIcon severity={alert.severity} />
                <span className="flex-1 text-[12px] text-[#9A9A9A]">{alert.label}</span>
                <span
                  className={`font-mono text-[11px] font-semibold px-2 py-0.5 rounded border ${severityColor(alert.severity)}`}
                >
                  {alert.count}
                </span>
                <ChevronRight className="w-3 h-3 text-white/20" />
              </div>
            ))}
      </div>

      <Link
        href="/dashboard/deals"
        className="font-mono text-[9px] tracking-[0.18em] uppercase text-[#C6A55A]/50 hover:text-[#C6A55A] transition-colors mt-auto"
      >
        View all alerts →
      </Link>
    </div>
  );
}
