"use client";

import { useApi } from "@/hooks/useApi";

interface StatItem {
  name: string;
  count: number;
}

interface TopStatsData {
  topCountries: StatItem[];
  topDocuments: StatItem[];
}

export function TopDocumentsPanel() {
  const { data, isLoading } = useApi<TopStatsData>("/api/dashboard/top-stats");
  const items = data?.topDocuments ?? [];
  const max = items.length > 0 ? Math.max(...items.map((i) => i.count)) : 1;
  const total = items.reduce((s, i) => s + i.count, 0) || 1;

  return (
    <div
      className="rounded-lg border border-white/[0.06] p-5"
      style={{ background: "rgba(3,3,5,0.90)" }}
    >
      <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-4">
        Top Document Types
      </p>
      <div className="flex flex-col gap-3">
        {isLoading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 rounded bg-white/[0.03] animate-pulse" />
            ))
          : items.map((item) => {
              const pct = Math.round((item.count / total) * 100);
              const barWidth = Math.round((item.count / max) * 100);
              return (
                <div key={item.name} className="flex items-center gap-3">
                  <span className="text-[11px] text-[#9A9A9A] w-36 shrink-0 truncate">{item.name}</span>
                  <div className="flex-1 h-1 bg-white/[0.05] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${barWidth}%`, background: "#C6A55A" }}
                    />
                  </div>
                  <span className="text-[11px] text-white font-semibold w-5 text-right shrink-0">{item.count}</span>
                  <span className="text-[10px] text-[#9A9A9A]/50 w-8 text-right shrink-0">{pct}%</span>
                </div>
              );
            })}
      </div>
    </div>
  );
}
