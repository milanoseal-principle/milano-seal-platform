"use client";

import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Globe2, AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const EASE = [0.16, 1, 0.3, 1] as const;

interface DashboardSummary {
  countries: { country: string; count: number }[];
  awaiting_payment: number;
  in_execution: number;
  apostille_count: number;
  shipped_count: number;
}

interface SlaAlert {
  deal_id: string;
  deal_status: string;
  severity: "low" | "medium" | "high";
}

const FLAG_MAP: Record<string, string> = {
  italy: "🇮🇹", spain: "🇪🇸", brazil: "🇧🇷", mexico: "🇲🇽",
  france: "🇫🇷", germany: "🇩🇪", portugal: "🇵🇹", greece: "🇬🇷",
  "united kingdom": "🇬🇧", "united arab emirates": "🇦🇪", uae: "🇦🇪",
  "saudi arabia": "🇸🇦", qatar: "🇶🇦", singapore: "🇸🇬",
  "hong kong": "🇭🇰", switzerland: "🇨🇭", colombia: "🇨🇴",
  peru: "🇵🇪", chile: "🇨🇱", "costa rica": "🇨🇷",
  argentina: "🇦🇷", japan: "🇯🇵", australia: "🇦🇺",
  canada: "🇨🇦", philippines: "🇵🇭",
};

function getFlag(country: string): string {
  return FLAG_MAP[country.toLowerCase()] ?? "🌐";
}

export function GlobalExecutionIntelligence() {
  const { data, isLoading } = useApi<DashboardSummary>("/api/dashboard/summary");
  const { data: slaAlerts } = useApi<SlaAlert[]>("/api/admin/sla-alerts");

  const highRiskCountries = new Set(
    (slaAlerts ?? [])
      .filter((a) => a.severity === "high")
      .map((a) => a.deal_status)
  );

  const slaCount = (slaAlerts ?? []).filter((a) => a.severity !== "low").length;

  return (
    <div className="bg-[#080808] border border-[#1A1A1A] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1A1A1A]">
        <div className="flex items-center gap-3">
          <Globe2 className="w-4 h-4 text-[#C6A55A]" />
          <div>
            <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#6A5520] mb-0.5">
              Operator Intelligence
            </p>
            <h3 className="font-serif text-base text-white">
              Global Execution Intelligence
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-mono text-[8.5px] tracking-[0.2em] uppercase text-[#3A3A3A]">
            FL Origin
          </span>
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
        </div>
      </div>

      {/* Summary strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-[#1A1A1A]">
        {[
          { label: "Awaiting Payment", value: data?.awaiting_payment, tone: "amber" },
          { label: "In Execution",     value: data?.in_execution,     tone: "green" },
          { label: "In Apostille",     value: data?.apostille_count,  tone: "blue" },
          { label: "In Transit",       value: data?.shipped_count,    tone: "neutral" },
        ].map((stat, i) => (
          <div
            key={stat.label}
            className={`px-5 py-3 ${i < 3 ? "border-r border-[#1A1A1A]" : ""}`}
          >
            <p className="font-mono text-[8.5px] tracking-[0.22em] uppercase text-[#4A4A4A] mb-1">
              {stat.label}
            </p>
            {isLoading ? (
              <Skeleton className="h-6 w-8 bg-[#1A1A1A]" />
            ) : (
              <p
                className={`font-serif text-xl ${
                  stat.tone === "amber"
                    ? "text-[#C6A55A]"
                    : stat.tone === "green"
                      ? "text-emerald-400"
                      : stat.tone === "blue"
                        ? "text-sky-400"
                        : "text-[#888]"
                }`}
              >
                {stat.value ?? "—"}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Country destination grid */}
      <div className="p-6">
        {slaCount > 0 && (
          <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-amber-500/5 border border-amber-500/20 rounded-lg">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-amber-500/80">
              {slaCount} matter{slaCount !== 1 ? "s" : ""} with SLA risk across active corridors
            </p>
          </div>
        )}

        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-14 bg-[#111]" />
            ))}
          </div>
        ) : !data?.countries?.length ? (
          <div className="text-center py-10">
            <Globe2 className="w-8 h-8 text-[#2A2A2A] mx-auto mb-3" />
            <p className="font-mono text-[10px] tracking-[0.25em] uppercase text-[#3A3A3A]">
              No active destination corridors
            </p>
            <p className="text-xs text-[#2A2A2A] mt-1">
              Matters will appear here once intake is logged
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {data.countries
              .sort((a, b) => b.count - a.count)
              .map((c, i) => {
                const isRisk = highRiskCountries.has(c.country);
                return (
                  <motion.div
                    key={c.country}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, ease: EASE, duration: 0.35 }}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
                      isRisk
                        ? "bg-red-950/10 border-red-500/20"
                        : "bg-[#0D0D0D] border-[#1E1E1E]"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base leading-none flex-shrink-0">
                        {getFlag(c.country)}
                      </span>
                      <span className="font-mono text-[9.5px] tracking-wide uppercase text-[#9A9A9A] truncate">
                        {c.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {isRisk && (
                        <AlertTriangle className="w-2.5 h-2.5 text-red-500" />
                      )}
                      <span
                        className={`font-serif text-base ${
                          isRisk ? "text-red-400" : "text-[#C6A55A]"
                        }`}
                      >
                        {c.count}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-[#1A1A1A] flex items-center justify-between">
        <p className="font-mono text-[8.5px] tracking-[0.25em] uppercase text-[#3A3A3A]">
          Cross-Border Document Coordination · Hague & Non-Hague Jurisdictions
        </p>
        <div className="flex items-center gap-3 text-[8.5px] font-mono tracking-wider uppercase">
          <span className="flex items-center gap-1 text-[#3A3A3A]">
            <span className="h-1 w-1 rounded-full bg-[#C6A55A]/60" />
            Active
          </span>
          <span className="flex items-center gap-1 text-[#3A3A3A]">
            <span className="h-1 w-1 rounded-full bg-red-500/60" />
            SLA Risk
          </span>
        </div>
      </div>
    </div>
  );
}
