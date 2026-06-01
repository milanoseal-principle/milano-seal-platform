"use client";

import { useApi } from "@/hooks/useApi";
import { motion } from "framer-motion";
import { DollarSign, AlertCircle, ArrowRight } from "lucide-react";
import { formatCurrency, stageLabel, timeAgo } from "@/lib/format";
import Link from "next/link";
import type { ReferralLedgerEntry, AttributionStatus, ReferralSourceType } from "@/lib/referrals/ledger";

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

interface RevenueData {
  by_country: { country: string; count: number; closed: number; pipeline: number }[];
  by_document_type: { document_type: string; count: number; revenue: number }[];
  by_lane: { lane: string; count: number; closed: number; pipeline: number }[];
  unpaid_matters: {
    id: string;
    deal_id: string | null;
    client_name: string | null;
    total_price: number;
    deal_status: string;
    created_at: string;
  }[];
  total_closed: number;
  total_pipeline: number;
  total_unpaid: number;
}

function SkeletonRows({ n }: { n: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className="h-6 rounded-sm animate-pulse" style={{ background: "rgba(255,255,255,0.03)" }} />
      ))}
    </div>
  );
}

const ATTRIBUTION_STATUS_ORDER: AttributionStatus[] = ["captured", "verified", "locked", "disputed", "resolved"];
const ATTRIBUTION_STATUS_COLORS: Record<AttributionStatus, string> = {
  captured: "rgba(255,255,255,0.3)",
  verified: "#60a5fa",
  locked: "#34d399",
  disputed: "#f87171",
  resolved: "#d4af37",
};

export function RevenueIntelligencePanel() {
  const { data, isLoading } = useApi<RevenueData>("/api/revenue/intelligence");
  const { data: ledgerData } = useApi<{ entries: ReferralLedgerEntry[] }>("/api/dashboard/referral-ledger");

  const maxCountry = data ? Math.max(1, ...data.by_country.map(c => c.closed + c.pipeline)) : 1;
  const maxDoc = data ? Math.max(1, ...data.by_document_type.map(d => d.revenue)) : 1;

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center gap-2.5">
            <DollarSign className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
            <div>
              <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
                Revenue Intelligence
              </div>
              <div className="text-[8px] uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                Closed · Pipeline · Unpaid Exposure
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-4 grid grid-cols-3 gap-4">
          {[
            { label: "Closed Revenue", value: data ? formatCurrency(data.total_closed) : "—", color: "#34d399" },
            { label: "Pipeline Value", value: data ? formatCurrency(data.total_pipeline) : "—", color: "#d4af37" },
            { label: "Unpaid Exposure", value: data ? formatCurrency(data.total_unpaid) : "—", color: data?.total_unpaid ? "#f59e0b" : "rgba(255,255,255,0.3)" },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ease: EASE, duration: DURATION, delay: idx * 0.08 }}
            >
              <div className="text-[8px] font-mono uppercase tracking-[0.14em] mb-1" style={{ color: "rgba(255,255,255,0.22)" }}>
                {stat.label}
              </div>
              <div
                className="text-xl font-light"
                style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: stat.color }}
              >
                {isLoading ? "—" : stat.value}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Revenue by Destination */}
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Revenue by Destination
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {isLoading ? (
              <SkeletonRows n={5} />
            ) : !data || data.by_country.length === 0 ? (
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>No destination revenue data.</p>
            ) : (
              data.by_country.slice(0, 7).map((c, idx) => {
                const total = c.closed + c.pipeline;
                return (
                  <motion.div
                    key={c.country}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {c.country}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                        {formatCurrency(total)}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "rgba(212,175,55,0.45)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(total / maxCountry) * 100}%` }}
                        transition={{ ease: EASE, duration: 0.6, delay: 0.3 + idx * 0.04 }}
                      />
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Revenue by Document Type */}
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Revenue by Document Type
            </div>
          </div>
          <div className="px-5 py-4 space-y-3">
            {isLoading ? (
              <SkeletonRows n={5} />
            ) : !data || data.by_document_type.length === 0 ? (
              <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>No document revenue data.</p>
            ) : (
              data.by_document_type.slice(0, 7).map((d, idx) => (
                <motion.div
                  key={d.document_type}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
                  className="space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] truncate max-w-[140px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                      {d.document_type}
                    </span>
                    <span className="text-[9px] font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                      {formatCurrency(d.revenue)}
                    </span>
                  </div>
                  <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "rgba(212,175,55,0.35)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${(d.revenue / maxDoc) * 100}%` }}
                      transition={{ ease: EASE, duration: 0.6, delay: 0.3 + idx * 0.04 }}
                    />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Lane Revenue Distribution */}
      {data && data.by_lane.length > 0 && (
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Service Lane Revenue Distribution
            </div>
          </div>
          <div className="px-5 py-4 grid gap-3 sm:grid-cols-3">
            {data.by_lane.map((lane, idx) => (
              <motion.div
                key={lane.lane}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ease: EASE, duration: DURATION, delay: idx * 0.07 }}
                className="px-3 py-2.5 rounded-sm"
                style={{
                  background: "rgba(255,255,255,0.018)",
                  border: "1px solid rgba(255,255,255,0.04)",
                }}
              >
                <div className="text-[8px] font-mono uppercase tracking-[0.14em] mb-1.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                  {lane.lane}
                </div>
                <div className="text-base font-light" style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: "#d4af37" }}>
                  {formatCurrency(lane.closed)}
                </div>
                <div className="text-[8px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.18)" }}>
                  {formatCurrency(lane.pipeline)} pipeline · {lane.count} matters
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Unpaid Matter Escalation */}
      {data && data.unpaid_matters.length > 0 && (
        <div
          className="rounded-sm"
          style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(245,158,11,0.12)" }}
        >
          <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3 h-3" style={{ color: "#f59e0b" }} />
              <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "#f59e0b" }}>
                Unpaid Matter Escalation
              </div>
              <span className="ml-auto text-[8px] font-mono" style={{ color: "rgba(245,158,11,0.5)" }}>
                {formatCurrency(data.total_unpaid)} EXPOSURE
              </span>
            </div>
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 220, scrollbarWidth: "none" }}>
            {data.unpaid_matters.map((m, idx) => (
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
                      <div className="text-[10px]" style={{ color: "rgba(255,255,255,0.55)" }}>
                        {m.client_name ?? (m.deal_id ?? m.id.slice(0, 8)).toUpperCase()}
                      </div>
                      <div className="text-[9px] mt-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
                        {stageLabel(m.deal_status)} · {timeAgo(m.created_at)}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px]" style={{ color: "#f59e0b" }}>
                        {formatCurrency(m.total_price)}
                      </span>
                      <ArrowRight className="w-3 h-3" style={{ color: "rgba(255,255,255,0.12)" }} />
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Revenue by Source */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
            Revenue by Source
          </div>
        </div>
        <div className="px-5 py-4">
          {!ledgerData || ledgerData.entries.length === 0 ? (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              Attribution data will populate once referral ledger is active.
            </p>
          ) : (() => {
            const grouped = ledgerData.entries.reduce<Record<ReferralSourceType, number>>((acc, e) => {
              acc[e.source_type] = (acc[e.source_type] ?? 0) + 1;
              return acc;
            }, {} as Record<ReferralSourceType, number>);
            const entries = Object.entries(grouped).sort((a, b) => b[1] - a[1]);
            const max = Math.max(1, ...entries.map(([, v]) => v));
            return (
              <div className="space-y-3">
                {entries.map(([source, count], idx) => (
                  <motion.div
                    key={source}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ ease: EASE, duration: DURATION, delay: idx * 0.04 }}
                    className="space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {source.replace(/_/g, " ")}
                      </span>
                      <span className="text-[9px] font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                        {count}
                      </span>
                    </div>
                    <div className="h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
                      <motion.div
                        className="h-full rounded-full"
                        style={{ background: "rgba(212,175,55,0.35)" }}
                        initial={{ width: 0 }}
                        animate={{ width: `${(count / max) * 100}%` }}
                        transition={{ ease: EASE, duration: 0.6, delay: 0.3 + idx * 0.04 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Attribution Status Rail */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
            Attribution Status Rail
          </div>
        </div>
        <div className="px-5 py-4">
          {!ledgerData || ledgerData.entries.length === 0 ? (
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
              No attribution entries yet.
            </p>
          ) : (
            <div className="flex gap-4 flex-wrap">
              {ATTRIBUTION_STATUS_ORDER.map((status) => {
                const count = ledgerData.entries.filter(e => e.attribution_status === status).length;
                return (
                  <div key={status} className="text-center">
                    <div
                      className="text-base font-light"
                      style={{ fontFamily: "var(--font-playfair), Georgia, serif", color: ATTRIBUTION_STATUS_COLORS[status] }}
                    >
                      {count}
                    </div>
                    <div className="text-[8px] font-mono uppercase tracking-[0.12em] mt-0.5" style={{ color: "rgba(255,255,255,0.25)" }}>
                      {status}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pending Payout Reviews */}
      <div
        className="rounded-sm"
        style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
      >
        <div className="px-5 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
          <div className="flex items-center justify-between">
            <div className="text-[9px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(212,175,55,0.5)" }}>
              Pending Payout Reviews
            </div>
            <Link href="/dashboard/alliance">
              <span className="text-[8px] font-mono" style={{ color: "rgba(212,175,55,0.4)" }}>
                Alliance →
              </span>
            </Link>
          </div>
        </div>
        <div className="px-5 py-4">
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.22)" }}>
            Payout reviews are operator-confirmed only. Visit the{" "}
            <Link href="/dashboard/alliance" style={{ color: "rgba(212,175,55,0.6)" }}>
              Alliance dashboard
            </Link>{" "}
            to manage pending reviews.
          </p>
        </div>
      </div>
    </div>
  );
}
