"use client";
import { useState } from 'react';

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useApi } from "@/hooks/useApi";
import { stageLabel, timeAgo } from "@/lib/format";
import { getWorkflowOrDerive } from "@/data/intelligence";
import type { Workflow } from "@/data/intelligence";
import { PaymentIntegrityPanel } from "@/components/dashboard/PaymentIntegrityPanel";
import { FinalSealReviewPanel } from "@/components/dashboard/FinalSealReviewPanel";
import { ExecutionQAMatrix } from "@/components/dashboard/ExecutionQAMatrix";

interface MatterDetail {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  document_type: string;
  destination_country: string;
  deal_status: string;
  payment_status: string | null;
  payment_confirmed?: boolean | null;
  is_platform_fee_only?: boolean | null;
  viewer_role?: string | null;
  payment_confirmed_at?: string | null;
  payment_settlement_status?: string | null;
  payment_observed_at?: string | null;
  payment_cleared_at?: string | null;
  payment_funding_method?: string | null;
  founder_payment_override_at?: string | null;
  founder_payment_override_by?: string | null;
  founder_payment_override_reason?: string | null;
  amount_due?: number | null;
  amount_paid?: number | null;
  tier: string | null;
  courier_tracking_id: string | null;
  courier_carrier: string | null;
  delivery_status: string | null;
  updated_at: string;
  created_at: string;
  due_at: string | null;
  balance_due: number | null;
  total_price: number | null;
}

interface Props {
  matterId: string | null;
  onClose: () => void;
}

const STATUS_ORDER = [
  "under_review",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "courier_ready",
  "shipped",
  "delivered",
  "completed",
];

function statusGte(status: string, target: string): boolean {
  return STATUS_ORDER.indexOf(status) >= STATUS_ORDER.indexOf(target);
}

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

const gold = "rgba(198,165,90,1)";
const goldMuted = "rgba(198,165,90,0.5)";
const textMuted = "rgba(255,255,255,0.28)";

function computeReadiness(matter: MatterDetail, workflow: Workflow | undefined) {
  const s = matter.deal_status;
  const items = [
    {
      label: "Payment Confirmed",
      weight: 25,
      done:
        matter.payment_status === "paid" ||
        matter.payment_status === "payment_confirmed",
    },
    {
      label: "Apostille Path Determined",
      weight: 20,
      done: workflow ? workflow.apostilleRequired !== undefined : false,
    },
    {
      label: "Notarization Complete",
      weight: 25,
      done: statusGte(s, "apostille_processing"),
    },
    {
      label: "Apostille Submitted",
      weight: 20,
      done: statusGte(s, "courier_ready"),
    },
    {
      label: "Courier Released",
      weight: 10,
      done: statusGte(s, "shipped"),
    },
  ];
  const score = items.reduce((sum, item) => (item.done ? sum + item.weight : sum), 0);
  return { score, items };
}

function apostilleStatusLabel(deal_status: string): string {
  if (statusGte(deal_status, "delivered")) return "Complete";
  if (statusGte(deal_status, "courier_ready")) return "Submitted — Awaiting Return";
  if (deal_status === "apostille_processing") return "In Processing";
  if (statusGte(deal_status, "in_execution")) return "Pending Submission";
  return "Not Started";
}

function trackingStatusLabel(matter: MatterDetail): string {
  if (matter.delivery_status) return matter.delivery_status;
  if (matter.courier_tracking_id) return `Tracking: ${matter.courier_tracking_id}`;
  if (statusGte(matter.deal_status, "shipped")) return "Shipped — Awaiting Delivery";
  if (matter.deal_status === "courier_ready") return "Ready for Release";
  return "Not Yet Released";
}

function nextActionLabel(matter: MatterDetail): string {
  const s = matter.deal_status;
  if (s === "under_review") return "Complete compliance review";
  if (s === "scheduled") {
    if (matter.payment_status !== "paid" && matter.payment_status !== "payment_confirmed")
      return "Await payment confirmation";
    return "Schedule notarization appointment";
  }
  if (s === "in_execution") return "Complete notarization & signing";
  if (s === "apostille_processing") return "Await apostille from Secretary of State";
  if (s === "courier_ready") return "Release documents to courier";
  if (s === "shipped") return "Await international delivery confirmation";
  if (s === "delivered") return "Close matter and archive";
  if (s === "completed") return "Matter complete";
  return "—";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p style={{ color: textMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 4 }}>
        {label}
      </p>
      <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 13 }}>{value}</p>
    </div>
  );
}

const STATUS_MACHINE = [
  "intake_received",
  "under_review",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille_processing",
  "in_transit",
  "delivered",
  "completed",
] as const;

function OperatorActions({ matter }: { matter: MatterDetail }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<string>(matter.deal_status);

  async function advanceStatus() {
    setBusy("status");
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/matters/${matter.id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setMsg(json.message || json.code || "Failed to advance status.");
      } else {
        setMsg(`Status set to ${json.status}. Refresh to update.`);
      }
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Network error.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
        Operator Actions
      </p>

      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <select
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
          style={{
            flex: 1,
            background: "#0b0b0b",
            border: "1px solid rgba(198,165,90,0.25)",
            color: "rgba(255,255,255,0.8)",
            fontSize: 11,
            fontFamily: "monospace",
            padding: "8px 10px",
          }}
        >
          {STATUS_MACHINE.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => void advanceStatus()}
          disabled={busy !== null}
          style={{
            background: "rgba(198,165,90,0.1)",
            border: "1px solid rgba(198,165,90,0.4)",
            color: gold,
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            padding: "8px 14px",
            cursor: busy !== null ? "not-allowed" : "pointer",
          }}
        >
          {busy === "status" ? "Saving…" : "Set"}
        </button>
      </div>

      {msg && (
        <p style={{ color: "rgba(255,255,255,0.55)", fontSize: 11, marginTop: "0.5rem" }}>
          {msg}
        </p>
      )}
    </div>
  );
}

function DrawerContent({ matter, onClose }: { matter: MatterDetail; onClose: () => void }) {
  const countrySlug = toSlug(matter.destination_country);
  const docSlug = toSlug(matter.document_type);
  const workflow = getWorkflowOrDerive(countrySlug, docSlug);
  const { score, items: readinessItems } = computeReadiness(matter, workflow);

  const ronEligibility =
    workflow
      ? workflow.notarizationType === "ron" || workflow.notarizationType === "either"
        ? "Eligible"
        : "Not Eligible (In-Person Required)"
      : "Pending Review";

  const witnessRequirements =
    workflow
      ? workflow.witnessRequired
        ? `Required — ${workflow.witnessCount ?? 1} witness${(workflow.witnessCount ?? 1) > 1 ? "es" : ""}`
        : "Not Required"
      : "Pending Review";

  const executionLane =
    workflow
      ? workflow.routeType
      : "—";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflowY: "auto" }}>
      {/* Header */}
      <div
        style={{
          padding: "1.25rem 1.5rem",
          borderBottom: "1px solid rgba(198,166,91,0.12)",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: 6 }}>
            Procedural Detail
          </p>
          <h2 style={{ color: "rgba(255,255,255,0.9)", fontSize: 18, fontFamily: "Georgia, serif", fontWeight: 400 }}>
            Matter Detail
          </h2>
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: textMuted,
            padding: 4,
            marginTop: 2,
          }}
          aria-label="Close"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.75rem" }}>
        {/* Client Block */}
        <div>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: 20, fontFamily: "Georgia, serif", fontWeight: 400, marginBottom: 4 }}>
            {matter.client_name ?? "—"}
          </p>
          <p style={{ color: gold, fontFamily: "monospace", fontSize: 11, letterSpacing: "0.12em", marginBottom: 4 }}>
            {(matter.deal_id ?? matter.id.slice(0, 8)).toUpperCase()}
          </p>
          <p style={{ color: textMuted, fontSize: 12 }}>{matter.destination_country}</p>
        </div>

        {/* Execution Readiness */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
            Execution Readiness
          </p>
          <div style={{ display: "flex", alignItems: "baseline", gap: "0.75rem", marginBottom: "1rem" }}>
            <span style={{ color: gold, fontSize: 36, fontFamily: "Georgia, serif", fontWeight: 400, lineHeight: 1 }}>
              {score}%
            </span>
            <span style={{ color: textMuted, fontSize: 11 }}>readiness score</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {readinessItems.map((item) => (
              <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "0.625rem" }}>
                <span
                  style={{
                    fontSize: 12,
                    color: item.done ? "rgba(34,197,94,0.85)" : textMuted,
                    flexShrink: 0,
                    width: 14,
                  }}
                >
                  {item.done ? "✓" : "✗"}
                </span>
                <span style={{ color: item.done ? "rgba(255,255,255,0.75)" : textMuted, fontSize: 12 }}>
                  {item.label}
                </span>
                <span style={{ color: "rgba(255,255,255,0.18)", fontSize: 10, marginLeft: "auto", fontFamily: "monospace" }}>
                  {item.weight}pts
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fields Grid */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
            Procedural Fields
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem 1.5rem" }}>
            <Field label="Country" value={matter.destination_country} />
            <Field label="Document Type" value={matter.document_type} />
            <Field label="Execution Lane" value={executionLane} />
            <Field label="RON Eligibility" value={ronEligibility} />
            <Field label="Witness Requirements" value={witnessRequirements} />
            <Field label="Apostille Status" value={apostilleStatusLabel(matter.deal_status)} />
            <Field label="Tracking Status" value={trackingStatusLabel(matter)} />
            <Field label="Next Action" value={nextActionLabel(matter)} />
          </div>
        </div>

        {/* Status Block */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.875rem" }}>
            Current Status
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.625rem", marginBottom: "0.75rem" }}>
            <span
              style={{
                background: "rgba(198,165,90,0.08)",
                border: "1px solid rgba(198,165,90,0.22)",
                color: gold,
                fontSize: 10,
                fontFamily: "monospace",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                padding: "3px 10px",
              }}
            >
              {stageLabel(matter.deal_status)}
            </span>
            {matter.payment_status && (
              <span
                style={{
                  background:
                    matter.payment_status === "paid" || matter.payment_status === "payment_confirmed"
                      ? "rgba(34,197,94,0.08)"
                      : "rgba(245,158,11,0.08)",
                  border:
                    matter.payment_status === "paid" || matter.payment_status === "payment_confirmed"
                      ? "1px solid rgba(34,197,94,0.22)"
                      : "1px solid rgba(245,158,11,0.22)",
                  color:
                    matter.payment_status === "paid" || matter.payment_status === "payment_confirmed"
                      ? "rgba(34,197,94,0.85)"
                      : "rgba(245,158,11,0.85)",
                  fontSize: 10,
                  fontFamily: "monospace",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  padding: "3px 10px",
                }}
              >
                {matter.payment_status.replace(/_/g, " ")}
              </span>
            )}
          </div>
          <p style={{ color: textMuted, fontSize: 11 }}>
            Last updated {timeAgo(matter.updated_at)}
          </p>
        </div>

        {/* Operator Actions — manual payment confirmation + status advance */}
        <OperatorActions matter={matter} />

        {/* Payment Integrity — founder/operator view of payment gate state */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Payment Integrity
          </p>
          <PaymentIntegrityPanel
            matter={{
              payment_confirmed: matter.payment_confirmed === true,
              is_platform_fee_only: matter.is_platform_fee_only === true,
              payment_status: matter.payment_status,
            }}
          />
        </div>

        {/* Founder Release Override — founder_admin only, settlement-pending bridge */}
        <FounderReleaseOverridePanel matter={matter} />

        {/* Execution QA Matrix — pre-flight check state */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Execution QA
          </p>
          <ExecutionQAMatrix
            matter={{
              client_name: matter.client_name,
              destination_country: matter.destination_country,
              document_type: matter.document_type,
              payment_confirmed: matter.payment_confirmed === true,
            }}
          />
        </div>

        {/* Final Seal Review — release gate checklist */}
        <div>
          <p style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
            Final Seal Review
          </p>
          <FinalSealReviewPanel
            matter={{ id: matter.id, destination_country: matter.destination_country }}
            founderMode
          />
        </div>
      </div>
    </div>
  );
}

// Founder-only control to release a final packet when payment is visible but not
// yet settlement-cleared (e.g. card-funded Wise). Calls the release route with a
// written override_reason; the server still enforces founder_admin, the payment
// gate, settlement clearance, and the Codice Fiscale lock. Never shown to
// admin_operator, virtual_assistant, or clients.
function FounderReleaseOverridePanel({ matter }: { matter: MatterDetail }) {
  const [overrideReason, setOverrideReason] = useState("");
  const [overrideBusy, setOverrideBusy] = useState(false);
  const [overrideMessage, setOverrideMessage] = useState<string | null>(null);

  const isFounder = matter.viewer_role === "founder_admin";
  if (!isFounder) return null;

  const amber = "rgba(245,158,11,1)";
  const cleared = matter.payment_settlement_status === "cleared";
  const overrideAlreadyRecorded = Boolean(matter.founder_payment_override_at);

  if (cleared) {
    return (
      <div style={{ border: "1px solid rgba(52,211,153,0.28)", background: "rgba(52,211,153,0.06)", padding: 12, borderRadius: 8 }}>
        <p style={{ color: "rgba(52,211,153,0.9)", fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase" }}>
          Funds Cleared — Release Gate Eligible
        </p>
      </div>
    );
  }

  if (overrideAlreadyRecorded) {
    return (
      <div style={{ border: `1px solid rgba(245,158,11,0.28)`, background: "rgba(245,158,11,0.06)", padding: 12, borderRadius: 8 }}>
        <p style={{ color: amber, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: 6 }}>
          Founder Override Recorded
        </p>
        <p style={{ color: textMuted, fontSize: 11 }}>By: {matter.founder_payment_override_by ?? "—"}</p>
        <p style={{ color: textMuted, fontSize: 11 }}>At: {matter.founder_payment_override_at ? timeAgo(matter.founder_payment_override_at) : "—"}</p>
        <p style={{ color: textMuted, fontSize: 11 }}>Reason: {matter.founder_payment_override_reason ?? "—"}</p>
      </div>
    );
  }

  const paymentLooksPaid =
    matter.payment_status === "paid" ||
    matter.payment_status === "confirmed" ||
    matter.payment_status === "payment_confirmed" ||
    matter.payment_confirmed === true ||
    Boolean(matter.payment_confirmed_at);
  const due = Number(matter.amount_due ?? matter.total_price ?? 0);
  const paidAmount = Number(matter.amount_paid ?? 0);
  const amountCovered = due <= 0 || paidAmount >= due || matter.is_platform_fee_only === true;
  const settlementPending =
    Boolean(matter.payment_settlement_status) && matter.payment_settlement_status !== "cleared";

  if (!(paymentLooksPaid && amountCovered && settlementPending)) return null;

  const reasonReady = overrideReason.trim().length >= 12;

  async function approveReleaseOverride() {
    const reason = overrideReason.trim();
    if (reason.length < 12) {
      setOverrideMessage("Override reason must be specific.");
      return;
    }
    setOverrideBusy(true);
    setOverrideMessage(null);
    try {
      const res = await fetch(`/api/deals/${matter.id}/release`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ override_reason: reason }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok || !json.ok) {
        setOverrideMessage(
          json.required_action || json.message || json.error || "Release override failed.",
        );
        return;
      }
      setOverrideMessage("Override recorded. Release gate updated. Refreshing matter.");
      window.setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      setOverrideMessage(error instanceof Error ? error.message : "Network error.");
    } finally {
      setOverrideBusy(false);
    }
  }

  return (
    <div style={{ border: `1px solid rgba(245,158,11,0.28)`, background: "rgba(245,158,11,0.06)", padding: 14, borderRadius: 8 }}>
      <p style={{ color: amber, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.22em", textTransform: "uppercase", marginBottom: 4 }}>
        Founder Release Control
      </p>
      <p style={{ color: "#fff", fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Release Override</p>
      <p style={{ color: textMuted, fontSize: 11, lineHeight: 1.5, marginBottom: 10 }}>
        Payment is visible but not marked cleared. Use this only if you accept release
        responsibility before settlement confirmation.
      </p>
      <label style={{ color: goldMuted, fontSize: 9, fontFamily: "monospace", letterSpacing: "0.16em", textTransform: "uppercase" }}>
        Override reason
      </label>
      <textarea
        value={overrideReason}
        onChange={(e) => setOverrideReason(e.target.value)}
        placeholder="Example: Wise payment visible in business account; founder approves release before settlement."
        rows={3}
        style={{
          width: "100%",
          marginTop: 6,
          marginBottom: 10,
          background: "#000",
          color: "#fff",
          border: `1px solid rgba(245,158,11,0.4)`,
          borderRadius: 6,
          padding: 8,
          fontSize: 12,
          fontFamily: "monospace",
          resize: "vertical",
        }}
      />
      <button
        type="button"
        onClick={approveReleaseOverride}
        disabled={overrideBusy || !reasonReady}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 6,
          border: "none",
          background: overrideBusy || !reasonReady ? "rgba(245,158,11,0.25)" : amber,
          color: overrideBusy || !reasonReady ? "rgba(255,255,255,0.55)" : "#1a1206",
          fontFamily: "monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          cursor: overrideBusy || !reasonReady ? "not-allowed" : "pointer",
        }}
      >
        {overrideBusy ? "Working…" : reasonReady ? "Approve Release Override" : "Enter Override Reason"}
      </button>
      {overrideMessage && (
        <p style={{ color: textMuted, fontSize: 11, marginTop: 8 }}>{overrideMessage}</p>
      )}
    </div>
  );
}

export function MatterDetailDrawer({ matterId, onClose }: Props) {
  const { data, isLoading } = useApi<MatterDetail>(
    matterId ? `/api/dashboard/matter-detail/${matterId}` : null
  );

  return (
    <AnimatePresence>
      {matterId && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
              zIndex: 99,
            }}
          />

          {/* Drawer */}
          <motion.div
            key="drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 280 }}
            style={{
              position: "fixed",
              top: 0,
              right: 0,
              bottom: 0,
              width: "100%",
              maxWidth: 480,
              background: "#0b0b0b",
              borderLeft: "1px solid rgba(198,166,91,0.22)",
              zIndex: 100,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {isLoading && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  color: textMuted,
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                Preparing Execution Center…
              </div>
            )}
            {!isLoading && !data && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  color: textMuted,
                  fontSize: 13,
                }}
              >
                Matter not found.
              </div>
            )}
            {!isLoading && data && (
              <DrawerContent matter={data} onClose={onClose} />
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
