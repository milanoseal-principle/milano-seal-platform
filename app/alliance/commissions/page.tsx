"use client";

import { useState, useEffect } from "react";
import { DollarSign, Calendar, TrendingUp, AlertTriangle } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommissionRow = {
  id: string;
  matter_id: string;
  commission_status: string;
  payout_due_at: string | null;
  payout_paid_at: string | null;
  created_at: string;
};

type DashboardStats = {
  active_matters: number;
  this_month: number;
  total_referred: number;
  outstanding_commission: null; // always null — amount never exposed
};

type DashboardResponse = {
  no_data: boolean;
  stats: DashboardStats;
  commissions: CommissionRow[];
  error?: string;
};

// ─── Status badge ─────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  string,
  { label: string; bg: string; color: string; border: string }
> = {
  Pending: {
    label: "Pending",
    bg: "rgba(255,255,255,0.04)",
    color: "rgba(255,255,255,0.4)",
    border: "rgba(255,255,255,0.1)",
  },
  Eligible: {
    label: "Eligible",
    bg: "rgba(63,164,122,0.08)",
    color: "#3FA47A",
    border: "rgba(63,164,122,0.2)",
  },
  Paid: {
    label: "Paid",
    bg: "rgba(63,164,122,0.12)",
    color: "#52d9a4",
    border: "rgba(63,164,122,0.3)",
  },
  "On Hold": {
    label: "On Hold",
    bg: "rgba(212,175,55,0.08)",
    color: "#C6A55A",
    border: "rgba(198,165,90,0.25)",
  },
  "Needs Review": {
    label: "Needs Review",
    bg: "rgba(180,50,50,0.08)",
    color: "rgba(255,100,100,0.7)",
    border: "rgba(180,50,50,0.2)",
  },
};

function CommissionBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG["Pending"];
  return (
    <span
      className="text-[9px] font-mono uppercase tracking-[0.1em] px-2 py-0.5 rounded-sm"
      style={{
        background: cfg.bg,
        color: cfg.color,
        border: `1px solid ${cfg.border}`,
      }}
    >
      {cfg.label}
    </span>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AllianceCommissionsPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/alliance/dashboard");
        if (!res.ok) {
          if (res.status === 401) {
            setError("Session expired. Please sign in again.");
          } else {
            setError("Could not load commission data. Please try again.");
          }
          return;
        }
        const json: DashboardResponse = await res.json();
        setData(json);
      } catch {
        setError("Could not load commission data. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const commissions = data?.commissions ?? [];

  // Derive safe summary counts from status labels only — no amounts
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const mtdCount = commissions.filter(
    (c) =>
      (c.commission_status === "Eligible" || c.commission_status === "Paid") &&
      new Date(c.created_at) >= monthStart,
  ).length;

  const outstandingCount = commissions.filter(
    (c) => c.commission_status === "Eligible" || c.commission_status === "Pending",
  ).length;

  const ytdCount = commissions.filter(
    (c) =>
      c.commission_status === "Paid" &&
      new Date(c.payout_paid_at ?? c.created_at).getFullYear() ===
        now.getFullYear(),
  ).length;

  const nextPayment = commissions.find(
    (c) => c.commission_status === "Eligible" && c.payout_due_at,
  );

  return (
    <div
      className="min-h-screen"
      style={{ background: "#050505", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.3em]"
            style={{ color: "rgba(198,165,90,0.55)" }}
          >
            Alliance Partner Portal
          </p>
          <h1
            className="text-3xl font-light"
            style={{
              fontFamily: "var(--font-playfair),Georgia,serif",
              color: "#C6A55A",
            }}
          >
            Commission Ledger
          </h1>
          <p
            className="text-sm leading-relaxed max-w-xl"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Track the status of commissions tied to referred matters. Amounts
            are confirmed and communicated directly by Milano Seal — no amounts
            are displayed here.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-start gap-3 rounded-sm px-4 py-3"
            style={{
              background: "rgba(180,50,50,0.08)",
              border: "1px solid rgba(180,50,50,0.2)",
            }}
          >
            <AlertTriangle
              className="w-4 h-4 mt-0.5 flex-shrink-0"
              style={{ color: "#b43232" }}
            />
            <p
              className="text-xs"
              style={{ color: "rgba(255,100,100,0.8)" }}
            >
              {error}
            </p>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: DollarSign,
              label: "Month to Date",
              value: loading ? "—" : `${mtdCount} eligible`,
              sub: "Cleared this month",
            },
            {
              icon: TrendingUp,
              label: "Outstanding",
              value: loading ? "—" : `${outstandingCount} pending`,
              sub: "Awaiting matter completion",
            },
            {
              icon: DollarSign,
              label: "Year to Date",
              value: loading ? "—" : `${ytdCount} paid`,
              sub: "Paid this year",
            },
            {
              icon: Calendar,
              label: "Next Payment",
              value: loading
                ? "—"
                : nextPayment?.payout_due_at
                ? new Date(nextPayment.payout_due_at).toLocaleDateString(
                    "en-US",
                    { month: "short", day: "numeric" },
                  )
                : "None scheduled",
              sub: "Net 30 after completion",
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-sm p-4"
              style={{
                background: "rgba(8,5,1,0.96)",
                border: "1px solid rgba(198,165,90,0.1)",
              }}
            >
              <div
                className="w-8 h-8 rounded-sm flex items-center justify-center mb-3"
                style={{
                  background: "rgba(198,165,90,0.08)",
                  border: "1px solid rgba(198,165,90,0.15)",
                }}
              >
                <stat.icon size={15} color="#C6A55A" />
              </div>
              <div
                className="text-lg font-semibold font-mono"
                style={{ color: "rgba(255,255,255,0.85)" }}
              >
                {stat.value}
              </div>
              <div
                className="text-[10px] font-mono uppercase tracking-[0.12em] mt-1"
                style={{ color: "rgba(198,165,90,0.55)" }}
              >
                {stat.label}
              </div>
              <div
                className="text-[10px] mt-0.5"
                style={{ color: "rgba(255,255,255,0.25)" }}
              >
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Commission table */}
        <div
          className="rounded-sm"
          style={{
            background: "rgba(8,5,1,0.96)",
            border: "1px solid rgba(198,165,90,0.1)",
          }}
        >
          <div
            className="px-6 py-4 border-b"
            style={{ borderColor: "rgba(198,165,90,0.08)" }}
          >
            <h2
              className="text-sm font-light"
              style={{
                fontFamily: "var(--font-playfair),Georgia,serif",
                color: "rgba(255,255,255,0.75)",
              }}
            >
              Commission Records
            </h2>
            <p
              className="text-[10px] mt-0.5"
              style={{ color: "rgba(255,255,255,0.25)" }}
            >
              Payout amounts are communicated directly by Milano Seal and are
              not shown in this view.
            </p>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-center">
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Loading commission records…
              </p>
            </div>
          ) : commissions.length === 0 ? (
            <div className="px-6 py-12 text-center space-y-3">
              <DollarSign
                size={32}
                className="mx-auto"
                style={{ color: "rgba(255,255,255,0.15)" }}
              />
              <p
                className="text-sm"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                No commission records yet.
              </p>
              <p
                className="text-xs max-w-sm mx-auto"
                style={{ color: "rgba(255,255,255,0.2)" }}
              >
                Commissions are created when referred matters are accepted and
                progress through execution. Amounts are confirmed directly by
                Milano Seal.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table
                className="w-full text-[11px]"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(198,165,90,0.08)",
                    }}
                  >
                    {[
                      "Matter Ref",
                      "Created",
                      "Commission Status",
                      "Due Date",
                      "Paid Date",
                    ].map((h) => (
                      <th
                        key={h}
                        className="text-left px-6 py-3 text-[9px] font-mono uppercase tracking-[0.15em]"
                        style={{ color: "rgba(198,165,90,0.4)" }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {commissions.map((c) => (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid rgba(255,255,255,0.03)",
                      }}
                    >
                      <td
                        className="px-6 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(198,165,90,0.6)" }}
                      >
                        {c.matter_id
                          ? `MAT-${c.matter_id.substring(0, 8).toUpperCase()}`
                          : "—"}
                      </td>
                      <td
                        className="px-6 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {new Date(c.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-3">
                        <CommissionBadge status={c.commission_status} />
                      </td>
                      <td
                        className="px-6 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {c.payout_due_at
                          ? new Date(c.payout_due_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" },
                            )
                          : "—"}
                      </td>
                      <td
                        className="px-6 py-3 font-mono text-[10px]"
                        style={{ color: "rgba(255,255,255,0.3)" }}
                      >
                        {c.payout_paid_at
                          ? new Date(c.payout_paid_at).toLocaleDateString(
                              "en-US",
                              { month: "short", day: "numeric", year: "numeric" },
                            )
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div
            className="px-6 py-4 border-t"
            style={{ borderColor: "rgba(255,255,255,0.04)" }}
          >
            <p
              className="text-[9px] font-mono"
              style={{ color: "rgba(255,255,255,0.15)" }}
            >
              Partner-safe view only. Revenue, margins, and internal payment
              details are not accessible through this portal.
            </p>
          </div>
        </div>

        {/* Payment terms reference */}
        <div
          className="rounded-sm p-5 space-y-3"
          style={{
            background: "rgba(8,5,1,0.96)",
            border: "1px solid rgba(198,165,90,0.08)",
          }}
        >
          <h3
            className="text-[10px] font-mono uppercase tracking-[0.2em]"
            style={{ color: "rgba(198,165,90,0.5)" }}
          >
            Payment Terms
          </h3>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {[
              ["Payment Terms", "Net 30 after matter completion review"],
              ["Payment Method", "Wise / ACH / Wire"],
              ["Statements", "Monthly via secure portal communication"],
              ["Questions", "Contact your Milano Seal coordinator"],
            ].map(([k, v]) => (
              <div key={k} className="flex items-start gap-3">
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.1em] mt-0.5 min-w-[100px]"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {k}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
