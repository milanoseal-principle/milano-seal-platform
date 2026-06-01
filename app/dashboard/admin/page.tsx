"use client";

import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { useRealtimeRefresh } from "@/hooks/useRealtimeRefresh";
import { formatCurrency, stageLabel } from "@/lib/format";

interface PipelineDeal {
  deal_id: string | null;
  client_name: string | null;
  document_type: string | null;
  destination_country: string | null;
  country: string | null;
  total_price: number;
  deal_status: string;
  payment_status: string;
  execution_lane: string | null;
}

interface PipelineStage {
  stage: string;
  count: number;
  total_value: number;
  deals: PipelineDeal[];
}

interface PipelineResponse {
  stages: PipelineStage[];
  total_open: number;
  total_value_open: number;
  total_value_closed: number;
}

interface ScoringRow {
  deal_id: string;
  client_name: string;
  total_price: number;
  score: number;
  factors: { label: string; weight: number }[];
}

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  new: {
    bg: "rgba(100,163,216,.10)",
    color: "#64a3d8",
    border: "rgba(100,163,216,.25)",
  },
  reviewing: {
    bg: "rgba(155,126,212,.10)",
    color: "#9b7ed4",
    border: "rgba(155,126,212,.25)",
  },
  quoted: {
    bg: "rgba(155,126,212,.10)",
    color: "#9b7ed4",
    border: "rgba(155,126,212,.25)",
  },
  awaiting_payment: {
    bg: "rgba(200,151,58,.10)",
    color: "#c8973a",
    border: "rgba(200,151,58,.25)",
  },
  scheduled: {
    bg: "rgba(155,126,212,.10)",
    color: "#9b7ed4",
    border: "rgba(155,126,212,.25)",
  },
  in_execution: {
    bg: "rgba(198,165,90,.12)",
    color: "#c6a55a",
    border: "rgba(198,165,90,.28)",
  },
  apostille: {
    bg: "rgba(200,151,58,.10)",
    color: "#c8973a",
    border: "rgba(200,151,58,.25)",
  },
  shipped: {
    bg: "rgba(74,158,107,.10)",
    color: "#4a9e6b",
    border: "rgba(74,158,107,.25)",
  },
  completed: {
    bg: "rgba(74,158,107,.10)",
    color: "#4a9e6b",
    border: "rgba(74,158,107,.28)",
  },
  lost: {
    bg: "rgba(192,80,80,.08)",
    color: "#c05050",
    border: "rgba(192,80,80,.18)",
  },
};

const STAGES = [
  "new",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
];

function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES.new;
  return (
    <span
      className="ms-status-badge"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {stageLabel(status)}
    </span>
  );
}

function fmt$Compact(n: number): { sym: string; val: string } {
  return { sym: "$", val: Number(n).toLocaleString("en-US") };
}

const today = () =>
  new Date().toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default function OperatorCommandCenter() {
  const {
    data: pipeline,
    isLoading: pipeLoading,
    refetch: refetchPipeline,
  } = useApi<PipelineResponse>("/api/admin/pipeline");
  const { data: scoring, refetch: refetchScoring } =
    useApi<ScoringRow[]>("/api/admin/scoring");

  useRealtimeRefresh(
    ["deals", "deal_events", "custody_ledger"],
    () => {
      void refetchPipeline();
      void refetchScoring();
    },
    { throttleMs: 5_000 },
  );

  const totalCollected = pipeline?.total_value_closed ?? 0;
  const totalOpen = pipeline?.total_value_open ?? 0;
  const totalActive = pipeline?.total_open ?? 0;
  const hotLeads = (scoring ?? []).filter((s) => s.score >= 70).length;

  const allDeals: PipelineDeal[] =
    pipeline?.stages.flatMap((s) => s.deals) ?? [];
  const seen = new Set<string>();
  const tableDeals = allDeals
    .filter((d) => {
      if (!d.deal_id || seen.has(d.deal_id)) return false;
      seen.add(d.deal_id);
      return true;
    })
    .slice(0, 12);

  const stats = [
    {
      label: "Revenue Collected",
      ...fmt$Compact(totalCollected),
      sub: "Closed-won, lifetime",
    },
    {
      label: "Pipeline Value",
      ...fmt$Compact(totalOpen),
      sub: "Active + awaiting",
    },
    {
      label: "Hot Leads",
      sym: "",
      val: String(hotLeads),
      sub: "Score ≥ 70",
    },
    {
      label: "Active Matters",
      sym: "",
      val: String(totalActive),
      sub: "In open stages",
    },
  ];

  return (
    <div className="ms-fade-up">
      <div className="ms-eyebrow">Execution Center · {today()}</div>
      <h1 className="ms-h1">
        Welcome back, <em>Nicholas</em>
      </h1>

      <div className="ms-grid-4">
        {stats.map((s) => (
          <div key={s.label} className="ms-stat">
            <div className="ms-stat-lbl">{s.label}</div>
            <div className="ms-stat-val">
              {s.sym && <span>{s.sym}</span>}
              {pipeLoading ? "—" : s.val}
            </div>
            <div className="ms-stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="ms-divg">◇</div>
      <div className="ms-section-lbl">Pipeline · By Stage</div>

      <div className="ms-kanban">
        {STAGES.map((stage) => {
          const stageData = pipeline?.stages.find((s) => s.stage === stage);
          const items = stageData?.deals ?? [];
          return (
            <div key={stage} className="ms-kan-col">
              <div className="ms-kan-hdr">
                <span className="ms-kan-hdr-l">{stageLabel(stage)}</span>
                <span className="ms-kan-hdr-c">{stageData?.count ?? 0}</span>
              </div>
              {items.length === 0 ? (
                <div className="ms-kan-empty">— No matters —</div>
              ) : (
                items.slice(0, 6).map((d) => (
                  <Link
                    key={d.deal_id ?? Math.random()}
                    href={`/dashboard/deals/${d.deal_id}`}
                    className="ms-kan-card"
                  >
                    <div className="ms-kan-id">{d.deal_id}</div>
                    <div className="ms-kan-name">{d.client_name}</div>
                    <div className="ms-kan-doc">
                      {(d.document_type ?? "").slice(0, 38)}
                      {(d.document_type ?? "").length > 38 ? "…" : ""}
                    </div>
                    <div className="ms-kan-footer">
                      <span className="ms-kan-price">
                        {formatCurrency(d.total_price)}
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          );
        })}
      </div>

      <div className="ms-divg">◇</div>
      <div className="ms-section-lbl">All Matters</div>

      <div className="ms-tbl-wrap">
        <table className="ms-tbl">
          <thead>
            <tr>
              <th>ID</th>
              <th>Client</th>
              <th>Document</th>
              <th>Country</th>
              <th>Lane</th>
              <th>Value</th>
              <th>Status</th>
              <th>Payment</th>
              <th>Score</th>
            </tr>
          </thead>
          <tbody>
            {tableDeals.map((d) => {
              const sc = (scoring ?? []).find((s) => s.deal_id === d.deal_id);
              const isClosed = d.deal_status === "completed" || d.deal_status === "lost";
              const score = sc?.score ?? 0;
              const scoreColor =
                score >= 70 ? "#C6A55A" : score >= 40 ? "#c8973a" : "#888";
              return (
                <tr key={d.deal_id}>
                  <td className="ms-tbl-id">
                    <Link href={`/dashboard/deals/${d.deal_id}`}>
                      {d.deal_id}
                    </Link>
                  </td>
                  <td className="ms-tbl-name">{d.client_name}</td>
                  <td className="ms-tbl-doc">{d.document_type}</td>
                  <td>{d.destination_country ?? d.country}</td>
                  <td className="ms-tbl-lane">{d.execution_lane ?? "—"}</td>
                  <td className="ms-tbl-value">
                    {formatCurrency(d.total_price)}
                  </td>
                  <td>
                    <StatusBadge status={d.deal_status} />
                  </td>
                  <td>
                    <StatusBadge
                      status={
                        d.payment_status === "paid"
                          ? "completed"
                          : "awaiting_payment"
                      }
                    />
                  </td>
                  <td>
                    {isClosed ? (
                      <span style={{ color: "#444", fontSize: 12 }}>—</span>
                    ) : (
                      <div className="ms-score-cell">
                        <div className="ms-bar">
                          <div
                            style={{
                              width: `${score}%`,
                              background: scoreColor,
                            }}
                          />
                        </div>
                        <span className="ms-score-val" style={{ color: scoreColor }}>
                          {score}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {tableDeals.length === 0 && (
              <tr>
                <td colSpan={9} className="ms-tbl-empty">
                  {pipeLoading ? "Loading…" : "No matters yet."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
