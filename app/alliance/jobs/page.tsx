"use client";

import { useState } from "react";
import Link from "next/link";
import { Briefcase } from "lucide-react";
import type { JobStatus } from "@/lib/allianceEligibility";

// Partner-safe job record — client total_price, platform margin,
// internal_notes, other partner attempts and client PII are excluded.
interface PartnerSafeJob {
  job_id: string;
  service_type: string;
  city: string;
  state: string;
  destination_country: string;
  required_capability: string;
  deadline: string;
  payout_amount: number;
  status: JobStatus;
}

// Stub jobs — replaced by /api/alliance/jobs when partner backend is wired
const STUB_JOBS: PartnerSafeJob[] = [
  {
    job_id: "JOB-9201",
    service_type: "Remote Online Notarization",
    city: "Tampa",
    state: "FL",
    destination_country: "Italy",
    required_capability: "Florida RON Authorized Notary",
    deadline: "2026-06-02",
    payout_amount: 150,
    status: "offered",
  },
  {
    job_id: "JOB-9202",
    service_type: "Apostille Courier Submission",
    city: "Tallahassee",
    state: "FL",
    destination_country: "Spain",
    required_capability: "Physical Runner / DOS Courier",
    deadline: "2026-05-30",
    payout_amount: 185,
    status: "queued",
  },
  {
    job_id: "JOB-9203",
    service_type: "Document Execution & Notarization",
    city: "Miami",
    state: "FL",
    destination_country: "Brazil",
    required_capability: "Bilingual Notary (English / Portuguese)",
    deadline: "2026-06-05",
    payout_amount: 220,
    status: "in_progress",
  },
];

const STATUS_PILL: Record<JobStatus, React.ReactNode> = {
  offered: <span className="ap-pill blue">Offered</span>,
  queued: <span className="ap-pill gray">Queued</span>,
  accepted: <span className="ap-pill green">Accepted</span>,
  in_progress: <span className="ap-pill purple">In Progress</span>,
  completed: <span className="ap-pill green">Completed</span>,
  declined: <span className="ap-pill gray">Declined</span>,
  reassigned: <span className="ap-pill amber">Reassigned</span>,
  rejected: <span className="ap-pill gray">Rejected</span>,
  unassigned: <span className="ap-pill gray">Unassigned</span>,
  escalated: <span className="ap-pill amber">Escalated</span>,
};

export default function AllianceJobsPage() {
  const [jobs, setJobs] = useState<PartnerSafeJob[]>(STUB_JOBS);

  // Stub action — isolated for API wiring
  function handleJobAction(jobId: string, action: "accept" | "decline") {
    setJobs((prev) =>
      prev.map((j) =>
        j.job_id === jobId
          ? { ...j, status: action === "accept" ? "accepted" : "declined" }
          : j,
      ),
    );
    // TODO: wire to POST /api/alliance/jobs/[id]/action
  }

  return (
    <div className="space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Partner Job Board</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Available Jobs
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Jobs matched to your verified capabilities. Client pricing, platform
          margin, and internal notes are not shown.
        </p>
      </div>

      <div className="ap-card overflow-hidden">
        {jobs.length === 0 ? (
          <div className="ap-empty">
            <Briefcase size={32} className="mx-auto mb-3 text-gray-300" />
            <div className="font-medium text-gray-500">No jobs available</div>
            <div className="text-gray-400">
              Jobs will appear here when routing is active.
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Job ID</th>
                  <th>Service Type</th>
                  <th>Location → Destination</th>
                  <th>Required Capability</th>
                  <th>Deadline</th>
                  <th className="text-right">Net Payout</th>
                  <th className="text-center">Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map((job) => (
                  <tr key={job.job_id}>
                    <td>
                      <Link
                        href={`/alliance/jobs/${job.job_id}`}
                        className="font-mono font-bold text-amber-700 hover:underline"
                      >
                        {job.job_id}
                      </Link>
                    </td>
                    <td className="font-medium text-gray-900">
                      {job.service_type}
                    </td>
                    <td className="text-gray-500">
                      {job.city}, {job.state} → {job.destination_country}
                    </td>
                    <td>
                      <span className="text-xs text-gray-600 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded">
                        {job.required_capability}
                      </span>
                    </td>
                    <td className="font-mono text-gray-600 text-xs">
                      {job.deadline}
                    </td>
                    <td className="text-right font-mono font-semibold text-gray-900">
                      ${job.payout_amount.toFixed(2)}
                    </td>
                    <td className="text-center">{STATUS_PILL[job.status]}</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {job.status === "offered" && (
                          <>
                            <button
                              onClick={() =>
                                handleJobAction(job.job_id, "accept")
                              }
                              className="ap-btn accept text-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() =>
                                handleJobAction(job.job_id, "decline")
                              }
                              className="ap-btn decline text-xs"
                            >
                              Decline
                            </button>
                          </>
                        )}
                        <Link
                          href={`/alliance/jobs/${job.job_id}`}
                          className="ap-btn ghost text-xs"
                        >
                          View
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
