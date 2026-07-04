"use client";

import { Shield } from "lucide-react";

// Illustrative command-core visual. All values are demo/illustrative for the
// isolated motion preview — not live telemetry.

export function HolographicCore() {
  return (
    <div className="glass-sovereign rounded-sm p-8 lg:p-10 relative overflow-hidden metallic-edge">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
        <div className="space-y-3 lg:order-1">
          <CoreMetric label="JURISDICTION_REVIEW" value="193" suffix="DESTINATIONS" />
          <CoreMetric label="HAGUE_VERIFIED" value="TRUE" tone="emerald" />
          <CoreMetric label="ACTIVE_MATTERS" value="1,847" suffix="DEMO" />
        </div>

        <div className="flex justify-center lg:order-2">
          <div className="relative w-[320px] h-[320px]">
            <div className="absolute inset-0 rounded-full border border-[#D4AF37]/20 rotate-slow" style={{ borderStyle: "dashed" }} />
            <div className="absolute inset-6 rounded-full border border-[#D4AF37]/30 rotate-reverse" style={{ borderStyle: "dashed" }} />
            <div className="absolute inset-12 rounded-full border-2 border-[#D4AF37]/40 pulse-soft" />

            <svg className="absolute inset-0 w-full h-full" style={{ animation: "ms-rotate-slow 80s linear infinite" }}>
              {Array.from({ length: 36 }).map((_, i) => {
                const angle = (i * 10 * Math.PI) / 180;
                const r1 = 158;
                const r2 = i % 9 === 0 ? 142 : 150;
                return (
                  <line
                    key={i}
                    x1={160 + Math.cos(angle) * r1}
                    y1={160 + Math.sin(angle) * r1}
                    x2={160 + Math.cos(angle) * r2}
                    y2={160 + Math.sin(angle) * r2}
                    stroke="#D4AF37"
                    strokeWidth={i % 9 === 0 ? "1.5" : "0.8"}
                    opacity={i % 9 === 0 ? "0.6" : "0.25"}
                  />
                );
              })}
            </svg>

            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative w-32 h-32 rounded-full bg-gradient-to-br from-[#F4E5B8] via-[#D4AF37] to-[#8B6914] flex items-center justify-center glow-gold"
                style={{ boxShadow: "0 0 60px rgba(212,175,55,.5), 0 0 120px rgba(212,175,55,.3), inset 0 0 40px rgba(0,0,0,.3), inset 0 4px 0 rgba(255,255,255,.15)" }}
              >
                <div className="absolute inset-2 rounded-full border-2 border-black/20" />
                <div className="absolute inset-3 rounded-full border border-black/10" />
                <Shield className="w-12 h-12 text-black/85 relative z-10" strokeWidth={2.5} />
                <div className="absolute text-[7px] font-bold text-black/70 tracking-[0.2em]" style={{ bottom: "14px" }}>EST. 2026</div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3 lg:order-3">
          <CoreMetric label="CUSTODY_INTEGRITY" value="99.7%" align="right" />
          <CoreMetric label="COMPLIANCE_RATE" value="99.4%" align="right" tone="emerald" />
          <CoreMetric label="EXECUTION_SLA" value="3.2 DAYS" suffix="AVERAGE" align="right" />
        </div>
      </div>
    </div>
  );
}

function CoreMetric({
  label,
  value,
  suffix,
  tone = "gold",
  align = "left",
}: {
  label: string;
  value: string;
  suffix?: string;
  tone?: "gold" | "emerald";
  align?: "left" | "right";
}) {
  const color = tone === "emerald" ? "text-emerald-400" : "text-[#D4AF37]";
  const isRight = align === "right";
  return (
    <div className={`${isRight ? "text-right pr-4 border-r-2" : "text-left pl-4 border-l-2"} border-[#D4AF37]/30`}>
      <div className="text-[9px] text-gray-500 font-mono tracking-[0.3em] mb-1">{label}</div>
      <div className={`text-2xl lg:text-3xl font-mono font-semibold ${color}`}>{value}</div>
      {suffix && <div className="text-[9px] text-gray-600 font-mono tracking-[0.2em] mt-0.5">{suffix}</div>}
    </div>
  );
}
