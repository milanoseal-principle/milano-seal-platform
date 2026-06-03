export const dynamic = "force-dynamic";

import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export const metadata = {
  title: "Execution Lanes — Milano Seal",
};

interface DealLane {
  destination_country: string | null;
  lane: string | null;
  created_at: string | null;
  apostille_at: string | null;
  matter_status: string | null;
}

interface LaneRow {
  country: string;
  lane: string;
  count: number;
  avgDays: number | null;
  lastDate: string | null;
}

export default async function LanesPage() {
  await requireDashboardAccess();

  const supabase = createAdminClient();

  let rows: LaneRow[] = [];

  try {
    const { data } = await supabase
      .from("deals")
      .select("destination_country, lane, created_at, apostille_at, matter_status")
      .not("destination_country", "is", null)
      .order("created_at", { ascending: false });

    const deals: DealLane[] = data ?? [];

    const map = new Map<string, { count: number; durations: number[]; lastDate: string | null }>();

    for (const d of deals) {
      const key = `${d.destination_country ?? "Unknown"}|||${d.lane ?? "standard"}`;
      const existing = map.get(key);
      const duration =
        d.apostille_at && d.created_at
          ? Math.round((new Date(d.apostille_at).getTime() - new Date(d.created_at).getTime()) / (1000 * 3600 * 24))
          : null;

      if (!existing) {
        map.set(key, {
          count: 1,
          durations: duration != null ? [duration] : [],
          lastDate: d.created_at,
        });
      } else {
        existing.count += 1;
        if (duration != null) existing.durations.push(duration);
        if (d.created_at && (!existing.lastDate || d.created_at > existing.lastDate)) {
          existing.lastDate = d.created_at;
        }
      }
    }

    rows = Array.from(map.entries())
      .map(([key, v]) => {
        const [country, lane] = key.split("|||");
        const avgDays =
          v.durations.length > 0
            ? Math.round(v.durations.reduce((a, b) => a + b, 0) / v.durations.length)
            : null;
        return { country: country ?? "Unknown", lane: lane ?? "standard", count: v.count, avgDays, lastDate: v.lastDate };
      })
      .sort((a, b) => b.count - a.count);
  } catch {}

  const laneColor = (lane: string) => {
    if (lane === "expedited") return "#C6A55A";
    if (lane === "urgent") return "#f59e0b";
    return "rgba(255,255,255,0.35)";
  };

  return (
    <div style={{ padding: "32px 24px" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <p style={{ fontFamily: "monospace", fontSize: 9, letterSpacing: "0.32em", textTransform: "uppercase", color: "rgba(198,165,90,0.5)", margin: "0 0 4px" }}>
          MILANO SEAL / EXECUTION LANES
        </p>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)", margin: "0 0 8px" }}>
          Execution Routing by Destination
        </h1>
        <p style={{ color: "rgba(255,255,255,0.35)", fontSize: 13, margin: "0 0 32px" }}>
          {rows.length} unique country/lane combinations
        </p>

        <div style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)", borderRadius: 8, overflow: "hidden" }}>
          {rows.length === 0 ? (
            <p style={{ padding: 32, color: "rgba(255,255,255,0.35)", fontFamily: "monospace", fontSize: 12, margin: 0, textAlign: "center" }}>
              No lane data available.
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    {["Country", "Lane", "Matter Count", "Avg Days to Apostille", "Last Matter"].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 16px",
                          textAlign: "left",
                          fontFamily: "monospace",
                          fontSize: 9,
                          letterSpacing: "0.28em",
                          textTransform: "uppercase",
                          color: "rgba(198,165,90,0.5)",
                          borderBottom: "1px solid rgba(212,175,55,0.06)",
                          fontWeight: 400,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={`${r.country}-${r.lane}`} style={{ borderBottom: "1px solid rgba(212,175,55,0.04)" }}>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.85)", fontSize: 13 }}>{r.country}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontFamily: "monospace",
                            color: laneColor(r.lane),
                            background: `${laneColor(r.lane)}18`,
                            padding: "2px 8px",
                            borderRadius: 4,
                            textTransform: "uppercase",
                          }}
                        >
                          {r.lane}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.75)", fontSize: 13, fontFamily: "monospace" }}>{r.count}</td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "monospace" }}>
                        {r.avgDays != null ? `${r.avgDays}d` : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "monospace" }}>
                        {r.lastDate ? new Date(r.lastDate).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
