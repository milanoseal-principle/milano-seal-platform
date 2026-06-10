"use client";

import { PlayCircle } from "lucide-react";

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.12)";
const SURFACE = "rgba(255,255,255,0.03)";

// ── Types ──────────────────────────────────────────────────────────────────────
type JobStatus =
  | "pending"
  | "scheduled"
  | "in_progress"
  | "awaiting_payment"
  | "blocked"
  | "completed"
  | "cancelled";

type PaymentGateStatus = "not_required" | "pending" | "confirmed" | "release_blocked";

type JobType =
  | "RON Session"
  | "Mobile Notary"
  | "Apostille Submission"
  | "Translation Coordination"
  | "Courier Release"
  | "Rejection Recovery";

interface ExecutionJob {
  job_id: string;
  matter_id: string;
  job_type: JobType;
  status: JobStatus;
  assigned_to: string;
  due_date: string;
  dependency: string;
  payment_gate_status: PaymentGateStatus;
  notes: string;
}

// ── Safe demo seed — clearly marked, no live data ─────────────────────────────
// const SEED_JOBS: ExecutionJob[] = [
//   {
//     job_id: "JOB-0001",
//     matter_id: "MTR-0001",
//     job_type: "RON Session",
//     status: "awaiting_payment",
//     assigned_to: "Nicholas Milano",
//     due_date: "2026-06-15",
//     dependency: "PAYMENT_CONFIRMED",
//     payment_gate_status: "pending",
//     notes: "Signer confirmed. Payment gate not cleared — release blocked until confirmed.",
//   },
// ];

const JOBS: ExecutionJob[] = []; // Empty state — no active jobs

// ── Status display helpers ─────────────────────────────────────────────────────
const STATUS_COLOR: Record<JobStatus, string> = {
  pending: "rgba(255,255,255,0.35)",
  scheduled: "rgba(96,165,250,0.65)",
  in_progress: "rgba(212,175,55,0.75)",
  awaiting_payment: "rgba(251,191,36,0.7)",
  blocked: "rgba(239,68,68,0.7)",
  completed: "rgba(34,197,94,0.65)",
  cancelled: "rgba(255,255,255,0.2)",
};

const GATE_COLOR: Record<PaymentGateStatus, string> = {
  not_required: "rgba(255,255,255,0.25)",
  pending: "rgba(251,191,36,0.65)",
  confirmed: "rgba(34,197,94,0.65)",
  release_blocked: "rgba(239,68,68,0.75)",
};

const COL_HEADERS = [
  "Job ID",
  "Matter",
  "Type",
  "Status",
  "Assigned To",
  "Due Date",
  "Dependency",
  "Payment Gate",
  "Notes",
];

export default function ExecutionJobsPage() {
  return (
    <div style={{ color: "#e8e4dc", fontFamily: "monospace" }}>
      {/* Header */}
      <div className="mb-6">
        <p style={{ fontSize: 9, letterSpacing: "0.25em", color: GOLD_DIM, marginBottom: 4 }}>
          OPERATOR CONTROL LAYER
        </p>
        <div className="flex items-center gap-3 mb-2">
          <PlayCircle size={16} style={{ color: GOLD }} />
          <h1 style={{ fontSize: "clamp(1.1rem,2.5vw,1.5rem)", fontFamily: "Georgia,serif", fontWeight: "normal", color: "#f4e5b8" }}>
            Execution Jobs
          </h1>
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          Active execution tasks across all matters. Payment gate must be confirmed before release operations.
          Routing is operator-reviewed — not automated.
        </p>
      </div>

      {/* Job type reference */}
      <div
        className="flex flex-wrap gap-2 px-4 py-3 rounded-sm mb-6"
        style={{ background: SURFACE, border: `1px solid ${BORDER}` }}
      >
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.18em", marginRight: 4 }}>JOB TYPES:</span>
        {(["RON Session", "Mobile Notary", "Apostille Submission", "Translation Coordination", "Courier Release", "Rejection Recovery"] as JobType[]).map((t) => (
          <span key={t} style={{ fontSize: 8, color: "rgba(255,255,255,0.25)", letterSpacing: "0.12em", borderRight: `1px solid ${BORDER}`, paddingRight: 8 }}>
            {t.toUpperCase()}
          </span>
        ))}
      </div>

      {JOBS.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center py-20 rounded-sm"
          style={{ border: `1px solid ${BORDER}`, background: SURFACE }}
        >
          <PlayCircle size={28} style={{ color: GOLD_DIM, marginBottom: 12 }} />
          <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", letterSpacing: "0.08em" }}>
            No Execution Jobs
          </p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", marginTop: 6 }}>
            Jobs will appear here when matters enter execution phase
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-sm" style={{ border: `1px solid ${BORDER}` }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${BORDER}`, background: SURFACE }}>
                {COL_HEADERS.map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 12px",
                      textAlign: "left",
                      fontSize: 8,
                      letterSpacing: "0.18em",
                      color: GOLD_DIM,
                      fontWeight: "normal",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {JOBS.map((job) => (
                <tr
                  key={job.job_id}
                  style={{ borderBottom: `1px solid ${BORDER}` }}
                >
                  <td style={{ padding: "10px 12px", color: "#f4e5b8", whiteSpace: "nowrap" }}>{job.job_id}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{job.matter_id}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.65)", whiteSpace: "nowrap" }}>{job.job_type}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ color: STATUS_COLOR[job.status], fontSize: 9, letterSpacing: "0.1em" }}>
                      {job.status.toUpperCase().replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.5)", whiteSpace: "nowrap" }}>{job.assigned_to}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.4)", whiteSpace: "nowrap", fontFamily: "monospace" }}>{job.due_date}</td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap", fontSize: 9 }}>{job.dependency}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>
                    <span style={{ color: GATE_COLOR[job.payment_gate_status], fontSize: 9, letterSpacing: "0.1em" }}>
                      {job.payment_gate_status.toUpperCase().replace(/_/g, " ")}
                    </span>
                  </td>
                  <td style={{ padding: "10px 12px", color: "rgba(255,255,255,0.3)", maxWidth: 240, fontSize: 9 }}>{job.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="mt-6 flex items-center justify-between flex-wrap gap-2">
        <span style={{ fontSize: 8, color: "rgba(255,255,255,0.15)", letterSpacing: "0.15em" }}>
          {JOBS.length} JOBS · PAYMENT_CONFIRMED REQUIRED BEFORE RELEASE · OPERATOR REVIEW ONLY
        </span>
        <span style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.15em" }}>
          THE MILANO SEAL™
        </span>
      </div>
    </div>
  );
}
