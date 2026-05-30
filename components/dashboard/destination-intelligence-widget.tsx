"use client";

import { useApi } from "@/hooks/useApi";
import { formatCurrency, timeAgo } from "@/lib/format";
import { COUNTRY_COMPLIANCE_DATA } from "@/components/landing/country-compliance-card";
import type { DestinationStats } from "@/app/api/dashboard/destination-intelligence/route";

// Node type classification per corridor
const NODE_TYPE: Record<string, string> = {
  Italy:    "HAGUE",
  Spain:    "HAGUE",
  UAE:      "HAGUE",
  Brazil:   "HAGUE",
  Mexico:   "HAGUE",
  Portugal: "HAGUE",
  Greece:   "HAGUE",
};

const ROUTE_LABEL: Record<string, string> = {
  Italy:    "Florida → Italy · Apostille Validation",
  Spain:    "Florida → Spain · Hague Route",
  UAE:      "Florida → UAE · Consular Authentication",
  Brazil:   "Florida → Brazil · Document Authentication",
  Mexico:   "Florida → Mexico · Cross-Border Notarial",
  Portugal: "Florida → Portugal · Lusophone Bridge",
  Greece:   "Florida → Greece · Diaspora Registry",
};

interface StageRowProps { label: string; count: number; accent?: boolean }
function StageRow({ label, count, accent }: StageRowProps) {
  if (count === 0) return null;
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="font-mono text-[8px] tracking-[0.15em] text-[#444] uppercase">{label}</span>
      <span className={`font-mono text-[9px] font-semibold ${accent ? "text-[#C6A55A]" : "text-[#666]"}`}>
        {count}
      </span>
    </div>
  );
}

function DestinationCard({ stats }: { stats: DestinationStats }) {
  const compliance = COUNTRY_COMPLIANCE_DATA[stats.country.toLowerCase()];
  const hasActivity = stats.active > 0 || stats.completed > 0;

  return (
    <div
      className="relative rounded-xl border border-white/[0.05] bg-[#080808] overflow-hidden"
      style={{ boxShadow: hasActivity ? "0 0 0 1px rgba(198,165,90,0.08), inset 0 0 24px rgba(0,0,0,0.4)" : undefined }}
    >
      {/* Top accent line — gold only when active */}
      {hasActivity && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#C6A55A]/50 to-transparent" />
      )}

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <span className="text-xl leading-none select-none">{compliance?.flag ?? "🌐"}</span>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm text-white font-medium">{stats.country}</span>
                <span className="font-mono text-[7px] px-1.5 py-0.5 rounded border border-[#C6A55A]/20 text-[#C6A55A]/60 tracking-widest">
                  {NODE_TYPE[stats.country] ?? "HAGUE"}
                </span>
              </div>
              <span className="font-mono text-[7px] text-[#3A3A3A] tracking-wider block mt-0.5">
                {ROUTE_LABEL[stats.country]}
              </span>
            </div>
          </div>

          {/* Route pulse dot */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span
              className="block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ background: hasActivity ? "#C6A55A" : "#222" }}
            />
            <span className="font-mono text-[7px] text-[#333]">
              {compliance?.hagueSince ? `HAGUE ${compliance.hagueSince}` : "HAGUE"}
            </span>
          </div>
        </div>

        {hasActivity ? (
          <>
            {/* Matter counts */}
            <div className="grid grid-cols-3 gap-1.5 mb-3">
              {[
                { label: "Active",    value: stats.active },
                { label: "Pipeline",  value: formatCurrency(stats.revenue_pipeline) },
                { label: "Closed",    value: stats.completed },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-lg border border-white/[0.04] bg-white/[0.015] px-2 py-1.5 text-center">
                  <div className="font-mono text-[8px] text-[#444] uppercase tracking-widest mb-0.5">{label}</div>
                  <div className="font-mono text-[11px] font-semibold text-[#C6A55A]">{value}</div>
                </div>
              ))}
            </div>

            {/* Stage breakdown */}
            <div className="border-t border-white/[0.04] pt-2 space-y-0">
              <StageRow label="Awaiting Payment" count={stats.awaiting_payment} accent />
              <StageRow label="In Execution"     count={stats.in_execution} />
              <StageRow label="Apostille"        count={stats.apostille} accent />
              <StageRow label="Courier Released" count={stats.shipped} />
            </div>

            {stats.most_recent_at && (
              <div className="mt-2 pt-2 border-t border-white/[0.04]">
                <span className="font-mono text-[7px] text-[#2E2E2E]">
                  Last matter: {timeAgo(stats.most_recent_at)}
                </span>
              </div>
            )}
          </>
        ) : (
          <div className="py-3 text-center">
            <span className="font-mono text-[8px] text-[#2A2A2A] tracking-[0.18em] uppercase">
              No active matters in this corridor
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function DestinationIntelligenceWidget() {
  const { data, isLoading, isError } = useApi<{ destinations: DestinationStats[] }>(
    "/api/dashboard/destination-intelligence"
  );

  return (
    <div className="rounded-xl border border-white/[0.05] bg-[#050507] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-[#C6A55A]/60" />
          <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-[#555]">
            Destination Intelligence
          </span>
        </div>
        <span className="font-mono text-[8px] text-[#2A2A2A]">7 CORRIDORS</span>
      </div>

      <div className="p-4">
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-28 rounded-xl border border-white/[0.04] bg-[#080808] animate-pulse" />
            ))}
          </div>
        )}

        {isError && (
          <div className="py-6 text-center font-mono text-[9px] text-[#333] tracking-widest uppercase">
            Intelligence feed unavailable
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {data.destinations.map((dest) => (
              <DestinationCard key={dest.country} stats={dest} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
