"use client";

import { useApi } from "@/hooks/useApi";
import { motion } from "framer-motion";
import { Target, Clock, ArrowRight } from "lucide-react";
import { formatCurrency, stageLabel } from "@/lib/format";
import Link from "next/link";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

interface AcquisitionData {
  score_tiers: { high: number; medium: number; low: number };
  high_value_matters: {
    id: string;
    deal_id: string | null;
    client_name: string | null;
    document_type: string;
    destination_country: string;
    total_price: number;
    conversion_score: number;
    deal_status: string;
  }[];
  country_demand: { country: string; count: number; revenue: number }[];
  document_demand: { document_type: string; count: number; revenue: number }[];
  lane_distribution: { lane: string; count: number }[];
  abandoned_intake: {
    id: string;
    deal_id: string | null;
    client_name: string | null;
    document_type: string;
    destination_country: string;
    deal_status: string;
    hours_stale: number;
  }[];
  total_active: number;
  total_pipeline_value: number;
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-8 rounded-sm animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
      ))}
    </div>
  );
}

export function AcquisitionIntelligencePanel() {
  const { data, isLoading } = useApi<AcquisitionData>("/api/acquisition/intelligence");

  const maxCountry = data ? Math.max(1, ...data.country_demand.map(c => c.count)) : 1;
  const maxDoc = data ? Math.max(1, ...data.document_demand.map(d => d.count)) : 1;

  return (
    <div className="space-y-4">
      {/* Conversion Confidence */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <Target className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
                Conversion Confidence
              </div>
              <div className="text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                Acquisition Scoring · Pipeline Intelligence
              </div>
            </div>
          </div>
          {data && (
            <div className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.25)" }}>
              {data.total_active} ACTIVE · {formatCurrency(data.total_pipeline_value)} PIPELINE
            </div>
          )}
        </div>

        <div className="px-5 py-4">
          {isLoading ? (
            <SkeletonRows n={3} />
          ) : !data ? (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>No acquisition data available.</p>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "High Value", key: "high" as const, color: "#34d399", threshold: "Score ≥ 70" },
                { label: "Medium Value", key: "medium" as const, color: "#d4af37", threshold: "Score 40–69" },
                { label: "Low Value", key: "low" as const, color: "rgba(255,255,255,0.25)", threshold: "Score < 40" },
              ].map((tier, idx) => (
                <motion.div
                  key={tier.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ ease: EASE, duration: DURATION, delay: idx * 0.08 }}
                  className="px-3 py-3 rounded-sm"
                  style={{
                    background: "rgba(255,255,255,0.018)",
                    border: `1px solid ${tier.key === "high" ? "rgba(52,211,153,0.15)" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  <div className="text-[8px] font-mono uppercase tracking-[0.14em] mb-1" style={{ color: "rgba(255,255,255,0.25)" }}>
                    {tier.label}
                  </div>
                  <div
                    className="text-2xl font-light"
                    style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: tier.color }}
                  >
                    {data.score_tiers[tier.key]}
                  </div>
                  <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                    {tier.threshold}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* High-Value Matter Radar */}
      {data && data.high_value_matters.length > 0 && (
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              High-Value Matter Radar
            </div>
            <div className="text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
              Conversion score ≥ 70 · Active matters only
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 260, scrollbarWidth: "none" }}>
            {data.high_value_matters.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
              >
                <Link href={`/dashboard/deals/${m.deal_id ?? m.id}`}>
                  <div
                    className="flex items-center justify-between gap-3 px-5 py-3 border-b cursor-pointer"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[9px] font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                          {(m.deal_id ?? m.id.slice(0, 8)).toUpperCase()}
                        </span>
                        <span className="text-[8px] font-mono uppercase tracking-[0.12em]" style={{ color: "rgba(52,211,153,0.7)" }}>
                          {m.conversion_score}
                        </span>
                      </div>
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>
                        {m.client_name ?? "—"} · {m.document_type}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {m.destination_country} · {stageLabel(m.deal_status)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px]" style={{ color: "rgba(212,175,55,0.7)" }}>
                        {formatCurrency(m.total_price)}
                      </span>
                      <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.15)" }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {/* Country Opportunity Matrix */}
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Country Opportunity Matrix
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {isLoading ? (
              <SkeletonRows n={5} />
            ) : !data || data.country_demand.length === 0 ? (
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>No destination data recorded.</p>
            ) : (
              data.country_demand.slice(0, 7).map((c, idx) => (
                <motion.div
                  key={c.country}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[10px] w-28 shrink-0 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {c.country}
                  </span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "rgba(212,175,55,0.5)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(c.count / maxCountry) * 100}%` }}
                      transition={{ ease: EASE, duration: 0.6, delay: 0.3 + idx * 0.04 }}
                    />
                  </div>
                  <span className="text-[9px] font-mono w-5 text-right shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {c.count}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Document Type Opportunity */}
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Document-Type Opportunity
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {isLoading ? (
              <SkeletonRows n={5} />
            ) : !data || data.document_demand.length === 0 ? (
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>No document data recorded.</p>
            ) : (
              data.document_demand.slice(0, 7).map((d, idx) => (
                <motion.div
                  key={d.document_type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[10px] w-36 shrink-0 truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                    {d.document_type}
                  </span>
                  <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "rgba(212,175,55,0.4)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.count / maxDoc) * 100}%` }}
                      transition={{ ease: EASE, duration: 0.6, delay: 0.3 + idx * 0.04 }}
                    />
                  </div>
                  <span className="text-[9px] font-mono w-5 text-right shrink-0" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {d.count}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Abandoned Intake Recovery */}
      {data && data.abandoned_intake.length > 0 && (
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(245,158,11,0.12)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3 flex-shrink-0" style={{ color: "#f59e0b" }} />
              <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "#f59e0b" }}>
                Abandoned Intake Recovery
              </div>
              <div className="ml-auto text-[8px] font-mono" style={{ color: "rgba(245,158,11,0.5)" }}>
                STALE &gt; 48H
              </div>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 200, scrollbarWidth: "none" }}>
            {data.abandoned_intake.map((m, idx) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
              >
                <Link href={`/dashboard/deals/${m.deal_id ?? m.id}`}>
                  <div
                    className="flex items-center justify-between gap-3 px-5 py-2.5 border-b cursor-pointer"
                    style={{ borderColor: "rgba(255,255,255,0.04)" }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {m.client_name ?? (m.deal_id ?? m.id.slice(0, 8)).toUpperCase()} · {m.document_type}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {m.destination_country} · {stageLabel(m.deal_status)}
                      </div>
                    </div>
                    <span className="text-[9px] font-mono shrink-0" style={{ color: "#f59e0b" }}>
                      {m.hours_stale}h stale
                    </span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
