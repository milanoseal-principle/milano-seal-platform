"use client";

import { useApi } from "@/hooks/useApi";

interface PipelineApiData {
  intake: number;
  review: number;
  awaiting_payment: number;
  scheduled: number;
  execution: number;
  apostille: number;
  transit: number;
  delivered: number;
  completed: number;
}

const STATUS_COLORS: string[] = [
  "#C6A55A",
  "#A87C3A",
  "#7C5C28",
  "#4A8FA0",
  "#3A7890",
  "#5A9A6A",
  "#3A7A4A",
  "#9A6A4A",
  "#7A4A3A",
];

const STATUS_LABELS: { key: keyof PipelineApiData; label: string }[] = [
  { key: "intake", label: "Intake" },
  { key: "review", label: "Review" },
  { key: "awaiting_payment", label: "Payment" },
  { key: "scheduled", label: "Scheduled" },
  { key: "execution", label: "Execution" },
  { key: "apostille", label: "Apostille" },
  { key: "transit", label: "Transit" },
  { key: "delivered", label: "Delivered" },
  { key: "completed", label: "Complete" },
];

function buildDonut(
  segments: { value: number; color: string }[],
  radius: number,
  cx: number,
  cy: number,
  strokeWidth: number
) {
  const total = segments.reduce((s, g) => s + g.value, 0) || 1;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circumference;
    const gap = circumference - dash;
    const rotation = (offset / total) * 360 - 90;
    offset += seg.value;
    return { dash, gap, rotation, color: seg.color, pct };
  });
}

export function MattersByStatus() {
  const { data, isLoading } = useApi<PipelineApiData>("/api/dashboard/pipeline");

  const segments = STATUS_LABELS.map((s, i) => ({
    label: s.label,
    key: s.key,
    value: data ? (data[s.key] ?? 0) : 0,
    color: STATUS_COLORS[i],
  }));

  const total = segments.reduce((s, g) => s + g.value, 0);
  const cx = 60;
  const cy = 60;
  const radius = 48;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;

  const arcs = buildDonut(
    segments.map((s) => ({ value: s.value, color: s.color })),
    radius,
    cx,
    cy,
    strokeWidth
  );

  return (
    <div
      className="rounded-lg border border-white/[0.06] p-5"
      style={{ background: "rgba(3,3,5,0.90)" }}
    >
      <p className="font-mono text-[9px] tracking-[0.32em] uppercase text-[#C6A55A]/50 mb-4">
        Matters by Status
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-20 h-20 rounded-full border-4 border-white/[0.05] border-t-[#C6A55A]/40 animate-spin" />
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* SVG Donut */}
          <div className="flex-shrink-0">
            <svg width={120} height={120} viewBox="0 0 120 120">
              {total === 0 ? (
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth={strokeWidth}
                />
              ) : (
                arcs.map((arc, i) => (
                  <circle
                    key={i}
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill="none"
                    stroke={arc.pct > 0 ? arc.color : "transparent"}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${arc.dash} ${arc.gap}`}
                    strokeDashoffset={0}
                    transform={`rotate(${arc.rotation} ${cx} ${cy})`}
                    strokeLinecap="butt"
                  />
                ))
              )}
              <text
                x={cx}
                y={cy - 6}
                textAnchor="middle"
                fill="white"
                fontSize="18"
                fontWeight="600"
                fontFamily="serif"
              >
                {total}
              </text>
              <text
                x={cx}
                y={cy + 10}
                textAnchor="middle"
                fill="rgba(154,154,154,0.6)"
                fontSize="7"
                fontFamily="monospace"
                letterSpacing="2"
              >
                TOTAL
              </text>
            </svg>
          </div>

          {/* Legend */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-0">
            {segments
              .filter((s) => s.value > 0)
              .map((s) => {
                const pct = total > 0 ? Math.round((s.value / total) * 100) : 0;
                return (
                  <div key={s.key} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ background: s.color }}
                    />
                    <span className="text-[11px] text-[#9A9A9A] flex-1 truncate">{s.label}</span>
                    <span className="text-[11px] text-white font-semibold">{s.value}</span>
                    <span className="text-[10px] text-[#9A9A9A]/50 w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            {total === 0 && (
              <p className="text-[11px] text-[#9A9A9A]/40">No active matters</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
