"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";

const STAGES = [
  { key: "new", label: "New", color: "#6A6A6A" },
  { key: "reviewing", label: "Reviewing", color: "#8A8A8A" },
  { key: "quoted", label: "Quoted", color: "#5B8DD9" },
  { key: "awaiting_payment", label: "Awaiting Payment", color: "#C6A55A" },
  { key: "scheduled", label: "Scheduled", color: "#7B9FD4" },
  { key: "in_execution", label: "In Execution", color: "#9B7FD4" },
  { key: "apostille", label: "Apostille", color: "#E09060" },
  { key: "shipped", label: "Released", color: "#88BBCC" },
  { key: "completed", label: "Completed", color: "#5DBB8A" },
];

const GATED = [
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
];

// SLA timer logic
function getSLADisplay(
  sla_deadline: string | null,
  created_at: string
): { text: string; color: string } | null {
  if (!sla_deadline) {
    // Default SLA: 48h from creation
    const deadline = new Date(created_at).getTime() + 48 * 3600000;
    sla_deadline = new Date(deadline).toISOString();
  }
  const remaining = new Date(sla_deadline).getTime() - Date.now();
  if (remaining <= 0) return { text: "SLA Breached", color: "#E07070" };
  const h = Math.floor(remaining / 3600000);
  const m = Math.floor((remaining % 3600000) / 60000);
  const text = `${h}h ${m}m remaining`;
  if (remaining < 6 * 3600000) return { text, color: "#E07070" };
  if (remaining < 24 * 3600000) return { text, color: "#C6A55A" };
  return { text, color: "#6A6A6A" };
}

function isFollowUpRequired(matter: any): boolean {
  if (matter.status !== "awaiting_payment") return false;
  const age = Date.now() - new Date(matter.created_at).getTime();
  return age > 24 * 3600000;
}

function getDeliveryLabel(status: string): string | null {
  if (status === "shipped") return "Released — In Transit";
  if (status === "completed") return "Delivered";
  return null;
}

// Memoized matter card
const MatterCard = memo(function MatterCard({
  matter,
  nextStage,
  onAdvance,
  advancing,
}: {
  matter: any;
  nextStage: (typeof STAGES)[0] | undefined;
  onAdvance: (deal_id: string, stage: string) => void;
  advancing: boolean;
}) {
  const isPaid = matter.payment_status === "paid";
  const canAdvance = nextStage && (isPaid || !GATED.includes(nextStage.key));
  const followUp = isFollowUpRequired(matter);
  const delivery = getDeliveryLabel(matter.status);
  const sla = getSLADisplay(matter.sla_deadline, matter.created_at);
  const ageH = (Date.now() - new Date(matter.created_at).getTime()) / 3600000;

  return (
    <div
      className={`bg-[#111111] border rounded-lg p-3 transition-all ${
        advancing ? "opacity-50" : "hover:border-[#C6A55A]/20"
      }`}
      style={{ borderColor: advancing ? "#C6A55A" : "#2A2A2A" }}
    >
      <div className="flex items-start justify-between gap-1 mb-1.5">
        <p className="text-white text-xs font-medium leading-tight truncate">
          {matter.client_name}
        </p>
        {matter.has_messages && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#C6A55A] flex-shrink-0 mt-1"
            title="Unread message"
          />
        )}
      </div>

      <p className="text-[#8A8A8A] text-[10px] truncate">
        {matter.destination_country || matter.execution_tier || "—"}
      </p>

      {matter.amount && (
        <p className="text-[#C6A55A] text-[10px] mt-1">
          ${Number(matter.amount).toLocaleString()}
        </p>
      )}

      {sla && (
        <p className="text-[9px] mt-1.5 font-mono" style={{ color: sla.color }}>
          {sla.text}
        </p>
      )}

      {followUp && (
        <p className="text-[9px] mt-1 text-amber-400 font-medium">
          ↻ Follow-Up Required
        </p>
      )}

      {delivery && <p className="text-[9px] mt-1 text-[#88BBCC]">{delivery}</p>}

      {isPaid && (
        <span className="inline-block text-[9px] text-green-400 mt-1">
          ● Paid
        </span>
      )}

      {nextStage && (
        <div className="mt-2.5">
          {canAdvance ? (
            <button
              disabled={advancing}
              onClick={() => onAdvance(matter.deal_id, nextStage.key)}
              className="w-full text-[9px] tracking-[0.1em] uppercase py-1.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-[#8A8A8A] hover:border-[#C6A55A]/40 hover:text-[#C6A55A] transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {advancing ? "Advancing…" : `Advance → ${nextStage.label}`}
            </button>
          ) : (
            <div className="relative group">
              <button
                disabled
                className="w-full text-[9px] tracking-[0.1em] uppercase py-1.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-[#4A4A4A] cursor-not-allowed"
              >
                Advance → {nextStage.label}
              </button>
              <div className="absolute bottom-full left-0 right-0 mb-1 hidden group-hover:block z-10">
                <div className="bg-[#1A1A1A] border border-[#C6A55A]/20 rounded px-2 py-1.5 text-[9px] text-[#C6A55A] leading-snug">
                  Payment required before advancing this matter.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

// Memoized stage column
const StageColumn = memo(function StageColumn({
  stage,
  matters,
  nextStage,
  onAdvance,
  advancing,
}: {
  stage: (typeof STAGES)[0];
  matters: any[];
  nextStage: (typeof STAGES)[0] | undefined;
  onAdvance: (deal_id: string, stage: string) => void;
  advancing: string | null;
}) {
  return (
    <div className="flex-shrink-0 w-44">
      <div className="flex items-center justify-between mb-2 px-0.5">
        <span
          className="text-[9px] font-semibold tracking-[0.12em] uppercase"
          style={{ color: stage.color }}
        >
          {stage.label}
        </span>
        <span className="text-[10px] text-[#4A4A4A] bg-[#1A1A1A] px-1.5 py-0.5 rounded-full">
          {matters.length}
        </span>
      </div>
      <div className="space-y-3 min-h-[80px]">
        {matters.length === 0 ? (
          <div className="border border-dashed border-[#1E1E1E] rounded-lg h-14 flex items-center justify-center">
            <span className="text-[#2A2A2A] text-[9px]">empty</span>
          </div>
        ) : (
          matters.map((m) => (
            <MatterCard
              key={m.deal_id}
              matter={m}
              nextStage={nextStage}
              onAdvance={onAdvance}
              advancing={advancing === m.deal_id}
            />
          ))
        )}
      </div>
    </div>
  );
});

export function PipelineBoard() {
  const [matters, setMatters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [advancing, setAdvancing] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/pipeline")
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((d) => {
        setMatters(Array.isArray(d) ? d : []);
        setError(null);
        setLoading(false);
      })
      .catch(() => {
        setError("Unable to load matters. Please refresh.");
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, [load]);

  const onAdvance = useCallback(async (deal_id: string, stage: string) => {
    setAdvancing(deal_id);
    setActionError(null);
    // Scheduling must pass the canonical server-side gate, which honors a
    // verified payment OR a valid complimentary authorization. The generic
    // /api/admin/move path only checks payment_status and would wrongly block a
    // complimentary Matter, so route "scheduled" through the protected endpoint.
    const res =
      stage === "scheduled"
        ? await fetch(`/api/deals/${deal_id}/schedule`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}),
          })
        : await fetch("/api/admin/move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ deal_id, stage }),
          });
    if (res.status === 402) {
      const d = await res.json().catch(() => ({}));
      setActionError(
        d.message ||
          "Verified payment or an active complimentary authorization is required before scheduling.",
      );
      setAdvancing(null);
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setActionError(d.error || "Advance failed.");
      setAdvancing(null);
      return;
    }
    setMatters((prev) =>
      prev.map((m) => (m.deal_id === deal_id ? { ...m, status: stage } : m))
    );
    setAdvancing(null);
  }, []);

  // Memoized stats
  const stats = useMemo(() => {
    const active = matters.filter(
      (m) => !["completed", "lost"].includes(m.status)
    ).length;
    const awaitingPay = matters.filter(
      (m) => m.status === "awaiting_payment"
    ).length;
    const inExec = matters.filter((m) => m.status === "in_execution").length;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const completedToday = matters.filter(
      (m) =>
        m.status === "completed" &&
        new Date(m.last_activity || m.created_at) >= todayStart
    ).length;
    const paidMatters = matters.filter((m) => m.payment_status === "paid");
    const totalRevenue = paidMatters.reduce(
      (s, m) => s + (Number(m.amount) || 0),
      0
    );
    const pendingRevenue = matters
      .filter((m) => m.payment_status !== "paid")
      .reduce((s, m) => s + (Number(m.amount) || 0), 0);
    const avgValue = paidMatters.length ? totalRevenue / paidMatters.length : 0;
    return {
      active,
      awaitingPay,
      inExec,
      completedToday,
      totalRevenue,
      pendingRevenue,
      avgValue,
    };
  }, [matters]);

  // Memoized stage buckets
  const buckets = useMemo(() => {
    const map: Record<string, any[]> = {};
    STAGES.forEach((s) => {
      map[s.key] = [];
    });
    matters.forEach((m) => {
      if (map[m.status]) map[m.status].push(m);
    });
    return map;
  }, [matters]);

  if (loading)
    return (
      <div className="h-40 flex items-center justify-center text-[#8A8A8A] text-sm">
        Loading Execution Center…
      </div>
    );

  if (error)
    return (
      <div className="bg-[#111111] border border-red-500/20 rounded-xl p-6 text-center">
        <p className="text-red-400 text-sm">{error}</p>
        <button
          onClick={load}
          className="mt-3 text-[10px] tracking-widest uppercase text-[#C6A55A] hover:underline cursor-pointer"
        >
          Refresh
        </button>
      </div>
    );

  return (
    <div>
      {/* Execution Center Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-[9px] tracking-[0.25em] uppercase text-[#C6A55A] font-semibold mb-1">
              Live
            </p>
            <h2 className="text-white font-serif text-xl font-light">
              Execution Center
            </h2>
          </div>
          <div className="text-[10px] text-[#4A4A4A]">↻ auto-refresh 10s</div>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            { label: "Active Matters", value: stats.active },
            { label: "Awaiting Payment", value: stats.awaitingPay },
            { label: "In Execution", value: stats.inExec },
            { label: "Completed Today", value: stats.completedToday },
          ].map((k) => (
            <div
              key={k.label}
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3"
            >
              <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-1">
                {k.label}
              </p>
              <p className="text-white text-xl font-light font-serif">
                {k.value}
              </p>
            </div>
          ))}
        </div>

        {/* Revenue panel */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              label: "Total Revenue",
              value: `$${stats.totalRevenue.toLocaleString()}`,
              gold: true,
            },
            {
              label: "Pending Revenue",
              value: `$${stats.pendingRevenue.toLocaleString()}`,
            },
            {
              label: "Avg Matter Value",
              value: `$${Math.round(stats.avgValue).toLocaleString()}`,
            },
          ].map((r) => (
            <div
              key={r.label}
              className="bg-[#111111] border border-[#2A2A2A] rounded-xl px-4 py-3"
            >
              <p className="text-[9px] tracking-widest uppercase text-[#6A6A6A] mb-1">
                {r.label}
              </p>
              <p
                className={`text-lg font-light font-serif ${
                  r.gold ? "text-[#C6A55A]" : "text-white"
                }`}
              >
                {r.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action error */}
      {actionError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {actionError}
        </div>
      )}

      {/* Empty state */}
      {matters.length === 0 ? (
        <div className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-12 text-center">
          <p className="text-[#6A6A6A] text-sm">
            No active matters in the Trust Flow.
          </p>
          <p className="text-[#4A4A4A] text-xs mt-2">
            Matters appear here after intake is submitted.
          </p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-4">
          {STAGES.map((stage, idx) => (
            <StageColumn
              key={stage.key}
              stage={stage}
              matters={buckets[stage.key] || []}
              nextStage={STAGES[idx + 1]}
              onAdvance={onAdvance}
              advancing={advancing}
            />
          ))}
        </div>
      )}
    </div>
  );
}
