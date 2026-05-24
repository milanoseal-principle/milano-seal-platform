"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Upload, CheckCircle2 } from "lucide-react";

export default function AllianceJobDetailPage() {
  const params = useParams();
  const jobId = params.id as string;

  const [actionState, setActionState] = useState<
    "offered" | "accepted" | "completed"
  >("offered");

  // Stub job record — contains only partner-safe fields.
  // Client total_price, platform margin, internal_notes are not present.
  const job = {
    job_id: jobId,
    service_type: "Remote Online Notarization",
    city: "Tampa",
    state: "FL",
    destination_country: "Italy",
    required_capability: "Florida RON Authorized Notary",
    deadline: "2026-06-02",
    payout_amount: 150,
    status: actionState,
    instructions:
      "Signer will join via secure video link. Verify government-issued photo ID. Document is a Power of Attorney for use in Italian consular proceedings. Apostille required after execution. Do not transmit document via unsecured channels.",
  };

  function handleAccept() {
    setActionState("accepted");
    // TODO: wire to POST /api/alliance/jobs/[id]/action { action: "accept" }
  }

  function handleDecline() {
    // TODO: wire to POST /api/alliance/jobs/[id]/action { action: "decline" }
    window.history.back();
  }

  function handleComplete() {
    setActionState("completed");
    // TODO: wire to POST /api/alliance/jobs/[id]/action { action: "complete" } with upload hash
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back + header */}
      <div className="flex items-center gap-3">
        <Link href="/alliance/jobs" className="ap-btn ghost text-xs">
          <ArrowLeft size={12} />
          Back to Jobs
        </Link>
      </div>

      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Operation File</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          {job.job_id}
        </h1>
        <div className="mt-2">
          {actionState === "offered" && (
            <span className="ap-pill blue">Offered</span>
          )}
          {actionState === "accepted" && (
            <span className="ap-pill green">Accepted</span>
          )}
          {actionState === "completed" && (
            <span className="ap-pill green">Completed</span>
          )}
        </div>
      </div>

      {/* Partner-safe job details */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Job Details</h3>
        </div>
        <div className="ap-card-body space-y-0">
          <div className="ap-kv">
            <span className="ap-kv-k">Service Type</span>
            <span className="ap-kv-v">{job.service_type}</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Location</span>
            <span className="ap-kv-v">
              {job.city}, {job.state}
            </span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Destination Country</span>
            <span className="ap-kv-v">{job.destination_country}</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Required Capability</span>
            <span className="ap-kv-v text-sm">{job.required_capability}</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Deadline</span>
            <span className="ap-kv-v font-mono">{job.deadline}</span>
          </div>
          <div className="ap-kv">
            <span className="ap-kv-k">Net Payout</span>
            <span className="ap-kv-v font-semibold text-amber-700 font-mono">
              ${job.payout_amount.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Execution Instructions</div>
        <p className="text-sm text-gray-600 leading-relaxed mt-2">
          {job.instructions}
        </p>
      </div>

      {/* Completion upload — stub */}
      {actionState === "accepted" && (
        <div className="ap-card">
          <div className="ap-card-header">
            <h3 className="ap-card-title">Completion Upload</h3>
          </div>
          <div className="ap-card-body">
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center mb-4">
              <Upload size={24} className="mx-auto mb-2 text-gray-300" />
              <div className="text-sm text-gray-500 mb-1">
                Upload executed document files
              </div>
              <div className="text-xs text-gray-400">
                PDF, PNG, JPG — Max 25 MB
              </div>
            </div>
            {/* TODO: wire upload to Supabase storage + chain-of-custody append */}
            <button
              onClick={handleComplete}
              className="ap-btn primary w-full justify-center"
            >
              <CheckCircle2 size={14} />
              Signal Job Complete
            </button>
            <div className="text-xs text-gray-400 text-center mt-2">
              Upload wired to secure storage on account activation
            </div>
          </div>
        </div>
      )}

      {actionState === "completed" && (
        <div className="ap-card ap-card-body flex items-center gap-3 border-emerald-200"
          style={{ borderColor: "rgba(16,185,129,0.3)" }}>
          <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
          <div>
            <div className="font-semibold text-gray-900">Job Completed</div>
            <div className="text-sm text-gray-500">
              Payout will be reflected in your commission ledger upon Milano Seal
              review.
            </div>
          </div>
        </div>
      )}

      {/* Accept / Decline — shown when offered */}
      {actionState === "offered" && (
        <div className="ap-card ap-card-body flex gap-3">
          <button
            onClick={handleAccept}
            className="ap-btn accept flex-1 justify-center"
          >
            <CheckCircle2 size={14} />
            Accept Job
          </button>
          <button
            onClick={handleDecline}
            className="ap-btn decline flex-1 justify-center"
          >
            Decline
          </button>
        </div>
      )}
    </div>
  );
}
