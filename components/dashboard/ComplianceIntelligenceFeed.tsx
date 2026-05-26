"use client";

import { useApi } from "@/hooks/useApi";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldAlert, CheckCircle2, ArrowRight } from "lucide-react";
import { stageLabel } from "@/lib/format";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

interface ComplianceAlert {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  document_type: string;
  destination_country: string;
  deal_status: string;
  flags: string[];
  severity: "high" | "medium" | "low";
}

interface ComplianceData {
  alerts: ComplianceAlert[];
  total: number;
}

const FLAG_LABELS: Record<string, string> = {
  apostille: "Apostille Required",
  translation: "Translation Required",
  multi_country: "Multi-Country",
};

const SEVERITY_CONFIG = {
  high: { label: "HIGH RISK", color: "#f87171", bg: "rgba(248,113,113,0.06)", border: "rgba(248,113,113,0.18)" },
  medium: { label: "REVIEW", color: "#f59e0b", bg: "rgba(245,158,11,0.04)", border: "rgba(245,158,11,0.14)" },
  low: { label: "FLAG", color: "rgba(212,175,55,0.7)", bg: "rgba(212,175,55,0.03)", border: "rgba(212,175,55,0.1)" },
};

export function ComplianceIntelligenceFeed() {
  const { data, isLoading } = useApi<ComplianceData>("/api/compliance/intelligence");

  return (
    <div
      className="rounded-sm"
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
    >
      {/* Header */}
      <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Compliance Intelligence Feed
            </div>
            <div className="text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Apostille · Translation · Multi-Country · Embassy Dependency
            </div>
          </div>
        </div>
        {data && data.total > 0 && (
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#f59e0b" }}
            />
            <span className="text-[9px] font-mono" style={{ color: "rgba(245,158,11,0.7)" }}>
              {data.total} ACTIVE ALERTS
            </span>
          </div>
        )}
      </div>

      {/* Feed */}
      <div className="overflow-y-auto" style={{ maxHeight: 380, scrollbarWidth: "none" }}>
        {isLoading ? (
          <div className="px-5 py-6 space-y-2.5">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-16 rounded-sm animate-pulse" style={{ background: "rgba(255,255,255,0.02)" }} />
            ))}
          </div>
        ) : !data || data.alerts.length === 0 ? (
          <div className="px-5 py-10 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="w-5 h-5" style={{ color: "rgba(52,211,153,0.4)" }} />
            <div className="text-[10px] font-mono tracking-[0.18em]" style={{ color: "rgba(255,255,255,0.18)" }}>
              NO ACTIVE COMPLIANCE ALERTS.
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {data.alerts.map((alert, idx) => {
              const cfg = SEVERITY_CONFIG[alert.severity];
              return (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  transition={{ ease: EASE, duration: DURATION, delay: Math.min(idx * 0.03, 0.4) }}
                >
                  <Link href={`/dashboard/deals/${alert.deal_id ?? alert.id}`}>
                    <div
                      className="relative flex items-start gap-3 px-5 py-3.5 border-b cursor-pointer"
                      style={{ borderColor: "rgba(255,255,255,0.04)", background: idx === 0 && alert.severity === "high" ? "rgba(248,113,113,0.025)" : "transparent" }}
                    >
                      {/* Left severity bar */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[2px] rounded-r"
                        style={{ background: cfg.color, opacity: 0.5 }}
                      />

                      <div className="flex-1 min-w-0 pl-1">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span
                            className="text-[8px] font-mono uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm"
                            style={{ background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}
                          >
                            {cfg.label}
                          </span>
                          {alert.flags.map(flag => (
                            <span
                              key={flag}
                              className="text-[8px] font-mono uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-sm"
                              style={{
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid rgba(255,255,255,0.06)",
                                color: "rgba(255,255,255,0.3)",
                              }}
                            >
                              {FLAG_LABELS[flag] ?? flag}
                            </span>
                          ))}
                        </div>
                        <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                          {alert.client_name ?? (alert.deal_id ?? alert.id.slice(0, 8)).toUpperCase()} · {alert.document_type}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)" }}>
                            {alert.destination_country}
                          </span>
                          <span className="text-[8px] font-mono uppercase" style={{ color: "rgba(255,255,255,0.18)" }}>
                            {stageLabel(alert.deal_status)}
                          </span>
                        </div>
                      </div>
                      <ArrowRight className="w-3 h-3 mt-1 shrink-0" style={{ color: "rgba(255,255,255,0.12)" }} />
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
