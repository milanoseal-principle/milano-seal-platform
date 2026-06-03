"use client";

import { motion } from "framer-motion";
import { Award } from "lucide-react";
import type {
  PriorityCorridorCard,
  CertificationSummary,
  CertStatus,
} from "@/app/dashboard/corridors/certification/page";

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  cards: PriorityCorridorCard[];
  summary: CertificationSummary;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const STATUS_CONFIG: Record<
  CertStatus,
  { label: string; color: string; bg: string; action: string }
> = {
  UNCHARTED: {
    label: "UNCHARTED",
    color: "rgba(255,255,255,0.25)",
    bg: "rgba(255,255,255,0.04)",
    action: "Seek first matter",
  },
  DERIVED: {
    label: "DERIVED",
    color: "rgba(198,165,90,0.5)",
    bg: "rgba(198,165,90,0.06)",
    action: "Build volume",
  },
  OBSERVED: {
    label: "OBSERVED",
    color: "#f59e0b",
    bg: "rgba(245,158,11,0.08)",
    action: "Build volume",
  },
  VERIFIED: {
    label: "VERIFIED",
    color: "#C6A55A",
    bg: "rgba(198,165,90,0.1)",
    action: "Document process",
  },
  CERTIFIED: {
    label: "CERTIFIED",
    color: "#4a9e6b",
    bg: "rgba(74,158,107,0.1)",
    action: "Publish corridor",
  },
};

// ─── Summary chip ─────────────────────────────────────────────────────────────

function SummaryChip({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 px-5 py-4 flex-1"
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
      }}
    >
      <span className="text-[8px] font-mono uppercase tracking-[0.28em]" style={{ color: "rgba(255,255,255,0.25)" }}>
        {label}
      </span>
      <span className="text-xl font-mono tabular-nums" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

// ─── Corridor card ────────────────────────────────────────────────────────────

function CorridorCard({
  card,
  index,
}: {
  card: PriorityCorridorCard;
  index: number;
}) {
  const cfg = STATUS_CONFIG[card.status];
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE, duration: 0.36, delay: index * 0.04 }}
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 8,
        padding: "16px",
      }}
    >
      {/* Route + status */}
      <div className="flex items-start justify-between mb-2">
        <div>
          <div className="text-[11px] font-mono tracking-[0.14em]" style={{ color: "#C6A55A" }}>
            {card.corridor}
          </div>
          <div className="text-[13px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>
            {card.document}
          </div>
        </div>
        <span
          className="text-[8px] font-mono uppercase tracking-[0.2em] px-2 py-1 rounded-sm ml-3 flex-shrink-0"
          style={{ background: cfg.bg, color: cfg.color }}
        >
          {cfg.label}
        </span>
      </div>

      {/* Use case */}
      <p className="text-[10px] mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
        {card.use_case}
      </p>

      {/* Execution chain notes */}
      <div
        className="text-[9px] font-mono px-2.5 py-1.5 rounded-sm mb-3"
        style={{
          background: "rgba(255,255,255,0.03)",
          color: "rgba(255,255,255,0.35)",
          borderLeft: "2px solid rgba(198,165,90,0.15)",
        }}
      >
        {card.notes}
      </div>

      {/* Stats + action */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {card.matter_count > 0 ? (
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.5)" }}>
              {card.matter_count} matter{card.matter_count !== 1 ? "s" : ""}
            </span>
          ) : (
            <span className="text-[10px] font-mono" style={{ color: "rgba(255,255,255,0.2)" }}>
              UNCHARTED — first matter needed
            </span>
          )}
          {card.avg_days !== null && (
            <span className="text-[9px] font-mono" style={{ color: "rgba(255,255,255,0.3)" }}>
              ~{card.avg_days}d avg
            </span>
          )}
        </div>
        <span
          className="text-[8px] font-mono uppercase tracking-[0.14em]"
          style={{ color: cfg.color }}
        >
          {cfg.action} →
        </span>
      </div>
    </motion.div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function CorridorCertificationCenter({ cards, summary }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ease: EASE, duration: 0.32 }}
      className="min-h-screen px-6 py-8 space-y-6"
      style={{ background: "#0A0A0A" }}
    >
      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
          style={{ background: "rgba(198,165,90,0.08)", border: "1px solid rgba(198,165,90,0.15)" }}
        >
          <Award className="w-4 h-4" style={{ color: "#C6A55A" }} />
        </div>
        <div>
          <h1 className="text-sm font-mono tracking-[0.18em] uppercase" style={{ color: "#C6A55A" }}>
            Corridor Certification Program
          </h1>
          <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            Every certified corridor is a defensible moat.
          </p>
        </div>
      </div>

      {/* ── Summary chips ─────────────────────────────────────────────────── */}
      <div className="flex gap-3">
        <SummaryChip label="Target Corridors" value={summary.total} color="#C6A55A" />
        <SummaryChip label="Uncharted" value={summary.uncharted} color="rgba(255,255,255,0.25)" />
        <SummaryChip label="Derived" value={summary.derived} color="rgba(198,165,90,0.5)" />
        <SummaryChip label="Observed" value={summary.observed} color="#f59e0b" />
        <SummaryChip label="Verified" value={summary.verified} color="#C6A55A" />
        <SummaryChip label="Certified" value={summary.certified} color="#4a9e6b" />
      </div>

      {/* ── Corridor cards ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card, i) => (
          <CorridorCard key={`${card.country}::${card.document}`} card={card} index={i} />
        ))}
      </div>

      {/* ── Value statement ───────────────────────────────────────────────── */}
      <div
        className="rounded-lg px-6 py-5"
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
        }}
      >
        <div
          className="font-mono text-[9px] tracking-[0.32em] uppercase mb-2"
          style={{ color: "rgba(198,165,90,0.5)" }}
        >
          Certified Corridor Value
        </div>
        <p className="text-[12px] leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
          Each certified corridor represents verified institutional knowledge of the complete
          execution chain from U.S. document preparation through foreign authority acceptance.
          This intelligence cannot be replicated by firms without equivalent matter history.
        </p>
      </div>
    </motion.div>
  );
}
