"use client";

import { useEffect, useMemo, useState } from "react";

interface FinalSealReviewPanelProps {
  matter: {
    id: string;
    destination_country?: string | null;
  };
  founderMode?: boolean;
}

type GatePayload = {
  evidence: {
    final_pdf_locked: boolean;
    pathway_reviewed: boolean;
    delivery_recipient_confirmed: boolean;
    founder_approved: boolean;
    compliance_hold: boolean;
    evidence?: Record<string, unknown>;
    reviewed_by?: string | null;
    updated_at?: string | null;
  } | null;
  facts: {
    fullPaymentReceived: boolean;
    ronCompleted: boolean;
    apostilleReturned: boolean;
    translationCompleted: boolean;
    identifierMatchPassed: boolean;
    finalPdfLocked: boolean;
    pathwayReviewed: boolean;
    deliveryRecipientConfirmed: boolean;
    founderApproved: boolean;
    complianceHold: boolean;
  };
  gate: {
    canRelease: boolean;
    blockedReasons: string[];
    requiresFounderApproval: boolean;
  };
};

const gold = "rgba(198,165,90,0.9)";
const muted = "rgba(255,255,255,0.5)";

export function FinalSealReviewPanel({ matter, founderMode = false }: FinalSealReviewPanelProps) {
  const [data, setData] = useState<GatePayload | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    const res = await fetch(`/api/dashboard/matters/${matter.id}/release-review`, { cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.error || "Release review unavailable");
    setData(json as GatePayload);
  }

  useEffect(() => {
    void refresh().catch((err) => setError(err instanceof Error ? err.message : "Release review unavailable"));
  }, [matter.id]);

  async function updateEvidence(patch: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch(`/api/dashboard/matters/${matter.id}/release-review`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...patch, reason: `Final Seal Review update: ${key}` }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Unable to save review evidence");
      setData(json as GatePayload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save review evidence");
    } finally {
      setBusy(null);
    }
  }

  const rows = useMemo(() => {
    if (!data) return [];
    return [
      { key: "payment", label: "Verified Wise settlement", pass: data.facts.fullPaymentReceived, source: "Canonical payment truth" },
      { key: "ron", label: "RON / execution complete", pass: data.facts.ronCompleted, source: "Provider execution evidence" },
      { key: "apostille", label: "Apostille / authentication returned", pass: data.facts.apostilleReturned, source: "Canonical execution record" },
      { key: "translation", label: "Translation complete / not required", pass: data.facts.translationCompleted, source: "Governed review evidence" },
      { key: "identifier", label: "Required identifier lock", pass: data.facts.identifierMatchPassed, source: "Identifier lock" },
      { key: "final_pdf_locked", label: "Final PDF locked", pass: data.facts.finalPdfLocked, source: "Governed review evidence", editable: true },
      { key: "pathway_reviewed", label: "Execution pathway reviewed", pass: data.facts.pathwayReviewed, source: "Governed review evidence", editable: true },
      { key: "delivery_recipient_confirmed", label: "Delivery recipient confirmed", pass: data.facts.deliveryRecipientConfirmed, source: "Governed review evidence", editable: true },
      { key: "compliance_hold", label: "Compliance hold cleared", pass: !data.facts.complianceHold, source: "Founder-governed evidence", founderOnly: true },
      { key: "founder_approved", label: "Founder final approval", pass: data.facts.founderApproved, source: "Founder-governed evidence", founderOnly: true },
    ];
  }, [data]);

  return (
    <section
      data-critical-card=""
      aria-labelledby={`final-seal-review-${matter.id}`}
      style={{
        background: "rgba(6,13,20,0.72)",
        border: `1px solid ${data?.gate.canRelease ? "rgba(100,200,120,0.22)" : "rgba(198,165,90,0.18)"}`,
        borderRadius: 12,
        padding: "16px",
        marginTop: 12,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <div>
          <p style={{ fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: gold, fontFamily: "monospace" }}>
            Final Seal Review
          </p>
          <h3 id={`final-seal-review-${matter.id}`} style={{ marginTop: 6, color: "rgba(255,255,255,0.9)", fontSize: 16, fontWeight: 500 }}>
            Server-governed release readiness
          </h3>
          <p style={{ marginTop: 4, color: muted, fontSize: 11, lineHeight: 1.5 }}>
            Browser controls record evidence only. Final release is authorized exclusively by the canonical server gate.
          </p>
        </div>
        <span
          role="status"
          style={{
            fontSize: 10,
            fontFamily: "monospace",
            padding: "4px 8px",
            borderRadius: 4,
            background: data?.gate.canRelease ? "rgba(100,200,120,0.12)" : "rgba(212,140,42,0.12)",
            color: data?.gate.canRelease ? "rgba(100,200,120,0.95)" : "rgba(230,170,80,0.95)",
          }}
        >
          {!data ? "CHECKING" : data.gate.canRelease ? "RELEASE GATE PASSED" : `BLOCKED (${data.gate.blockedReasons.length})`}
        </span>
      </div>

      {error && <p role="alert" style={{ marginTop: 12, color: "rgba(240,120,120,0.9)", fontSize: 11 }}>{error}</p>}

      <div style={{ marginTop: 14, display: "grid", gap: 6 }}>
        {rows.map((row) => {
          const canEdit = row.editable === true || (row.founderOnly === true && founderMode);
          return (
            <div key={row.key} style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 42, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span aria-hidden="true" style={{ color: row.pass ? "rgba(100,200,120,0.9)" : "rgba(230,170,80,0.9)", width: 14 }}>
                {row.pass ? "✓" : "○"}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: "rgba(255,255,255,0.78)", fontSize: 11 }}>{row.label}</div>
                <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 9, marginTop: 2 }}>{row.source}</div>
              </div>
              {canEdit && (
                <button
                  type="button"
                  disabled={busy !== null}
                  onClick={() => {
                    if (row.key === "compliance_hold") {
                      void updateEvidence({ compliance_hold: row.pass }, row.key);
                    } else {
                      void updateEvidence({ [row.key]: !row.pass }, row.key);
                    }
                  }}
                  style={{
                    minHeight: 36,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid rgba(198,165,90,0.28)",
                    background: row.pass ? "rgba(255,255,255,0.03)" : "rgba(198,165,90,0.08)",
                    color: row.pass ? muted : gold,
                    fontSize: 9,
                    fontFamily: "monospace",
                    cursor: busy ? "not-allowed" : "pointer",
                  }}
                >
                  {busy === row.key ? "SAVING…" : row.pass ? "REOPEN" : "RECORD"}
                </button>
              )}
            </div>
          );
        })}
      </div>

      {data && !data.gate.canRelease && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 8, background: "rgba(212,140,42,0.07)" }}>
          <div style={{ color: "rgba(230,170,80,0.95)", fontSize: 10, fontFamily: "monospace" }}>NEXT REQUIRED EVIDENCE</div>
          <ul style={{ marginTop: 6, paddingLeft: 16, color: "rgba(255,255,255,0.58)", fontSize: 10, lineHeight: 1.6 }}>
            {data.gate.blockedReasons.map((reason) => <li key={reason}>{reason}</li>)}
          </ul>
        </div>
      )}

      {data?.evidence?.updated_at && (
        <p style={{ marginTop: 10, color: "rgba(255,255,255,0.22)", fontSize: 9, fontFamily: "monospace" }}>
          Evidence updated {new Date(data.evidence.updated_at).toLocaleString()}
        </p>
      )}
    </section>
  );
}
