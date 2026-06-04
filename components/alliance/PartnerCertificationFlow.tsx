"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";

type CertificationStep = {
  id: string;
  label: string;
  description: string;
  attestation_prompt: string;
  requires_operator_confirmation: boolean;
};

type CertificationStatus = "ROUTING_LOCKED" | "ROUTING_ELIGIBLE" | "ACTIVE_PARTNER";

type StepRow = {
  step: string;
  status: string;
  completed_at: string | null;
  operator_confirmed: boolean;
  operator_confirmed_at: string | null;
};

type CertData = {
  steps: CertificationStep[];
  completedStepIds: string[];
  status: CertificationStatus;
  rows: StepRow[];
  table_missing?: boolean;
};

function StatusBadge({ status }: { status: CertificationStatus }) {
  const cfg: Record<CertificationStatus, { label: string; color: string; bg: string; border: string }> = {
    ROUTING_LOCKED: { label: "ROUTING LOCKED", color: "#EF4444", bg: "rgba(239,68,68,0.08)", border: "rgba(239,68,68,0.3)" },
    ROUTING_ELIGIBLE: { label: "ROUTING ELIGIBLE", color: "#3FA47A", bg: "rgba(63,164,122,0.08)", border: "rgba(63,164,122,0.3)" },
    ACTIVE_PARTNER: { label: "ACTIVE PARTNER", color: "#C6A55A", bg: "rgba(198,165,90,0.08)", border: "rgba(198,165,90,0.3)" },
  };
  const c = cfg[status];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "3px 10px",
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
      fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em",
      color: c.color, fontWeight: 600, textTransform: "uppercase",
    }}>
      {c.label}
    </span>
  );
}

export function PartnerCertificationFlow() {
  const [data, setData] = useState<CertData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/alliance/certification");
      if (!res.ok) throw new Error("Failed to load certifications");
      const json: CertData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleAttest(step: CertificationStep) {
    if (!checked[step.id]) return;
    setSubmitting(step.id);
    try {
      const res = await fetch("/api/alliance/certification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: step.id, attestation_text: step.attestation_prompt }),
      });
      if (!res.ok) throw new Error("Failed to submit attestation");
      const json: CertData = await res.json();
      setData(json);
      setExpandedStep(null);
      setChecked((prev) => ({ ...prev, [step.id]: false }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#A8A29A", fontFamily: "monospace", fontSize: 12 }}>
        Loading certifications...
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ padding: 32, color: "#EF4444", fontFamily: "monospace", fontSize: 12 }}>
        {error}
      </div>
    );
  }

  if (!data) return null;

  const completedCount = data.completedStepIds.length;
  const totalCount = data.steps.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 720 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
        <div>
          <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
            / PARTNER CERTIFICATION /
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: 0 }}>
            Partner Certification
          </h1>
        </div>
        <StatusBadge status={data.status} />
      </div>

      {data.table_missing && (
        <div style={{ padding: "12px 16px", background: "rgba(198,165,90,0.06)", border: "1px solid rgba(198,165,90,0.2)", borderRadius: 6, fontSize: 12, color: "#A8A29A", fontFamily: "monospace" }}>
          Certification system initializing. Complete steps below — they will be recorded once ready.
        </div>
      )}

      {/* Progress bar */}
      <div style={{ background: "#111", border: "1px solid rgba(198,165,90,0.12)", borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em" }}>
            PROGRESS
          </span>
          <span style={{ fontSize: 11, fontFamily: "monospace", color: "#C6A55A" }}>
            {completedCount} / {totalCount} steps
          </span>
        </div>
        <div style={{ height: 4, background: "rgba(198,165,90,0.1)", borderRadius: 2, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPct}%`,
            background: "linear-gradient(90deg, rgba(198,165,90,0.6), rgba(198,165,90,1))",
            borderRadius: 2,
            transition: "width 0.4s ease",
          }} />
        </div>
      </div>

      {/* Step cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {data.steps.map((step) => {
          const isComplete = data.completedStepIds.includes(step.id);
          const row = data.rows?.find((r) => r.step === step.id);
          const isExpanded = expandedStep === step.id;
          const pendingOperator = isComplete && step.requires_operator_confirmation && !row?.operator_confirmed;

          return (
            <div
              key={step.id}
              style={{
                background: isComplete ? "rgba(63,164,122,0.04)" : "#0d0d0d",
                border: isComplete
                  ? "1px solid rgba(63,164,122,0.2)"
                  : "1px solid rgba(198,165,90,0.1)",
                borderRadius: 8,
                overflow: "hidden",
                transition: "border-color 0.2s",
              }}
            >
              {/* Step header */}
              <button
                onClick={() => !isComplete && setExpandedStep(isExpanded ? null : step.id)}
                style={{
                  display: "flex", alignItems: "center", gap: 14,
                  width: "100%", padding: "16px 20px",
                  background: "transparent", border: "none",
                  cursor: isComplete ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  {isComplete ? (
                    <CheckCircle2 size={18} color="#3FA47A" />
                  ) : (
                    <div style={{ width: 18, height: 18, borderRadius: "50%", border: "1.5px solid rgba(198,165,90,0.3)" }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: isComplete ? "#A8A29A" : "#F6F1E6" }}>
                    {step.label}
                  </div>
                  {isComplete && row?.completed_at && (
                    <div style={{ fontSize: 11, color: "#3FA47A", fontFamily: "monospace", marginTop: 2 }}>
                      Completed {new Date(row.completed_at).toLocaleDateString()}
                    </div>
                  )}
                  {pendingOperator && (
                    <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                      <Clock size={11} color="#F59E0B" />
                      <span style={{ fontSize: 11, color: "#F59E0B", fontFamily: "monospace" }}>
                        Pending Operator Review
                      </span>
                    </div>
                  )}
                </div>
                {!isComplete && (
                  <div style={{ flexShrink: 0, color: "#A8A29A" }}>
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                )}
              </button>

              {/* Expandable form for pending steps */}
              {!isComplete && isExpanded && (
                <div style={{ padding: "0 20px 20px", borderTop: "1px solid rgba(198,165,90,0.08)" }}>
                  <p style={{ fontSize: 12, color: "#A8A29A", lineHeight: 1.6, margin: "16px 0 12px" }}>
                    {step.description}
                  </p>
                  <div style={{
                    padding: "12px 16px",
                    background: "rgba(198,165,90,0.04)",
                    border: "1px solid rgba(198,165,90,0.15)",
                    borderRadius: 6,
                    fontSize: 12, color: "#F6F1E6", lineHeight: 1.6, marginBottom: 16,
                  }}>
                    <em>&ldquo;{step.attestation_prompt}&rdquo;</em>
                  </div>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 14 }}>
                    <input
                      type="checkbox"
                      checked={!!checked[step.id]}
                      onChange={(e) => setChecked((prev) => ({ ...prev, [step.id]: e.target.checked }))}
                      style={{ marginTop: 2, accentColor: "#C6A55A", width: 14, height: 14 }}
                    />
                    <span style={{ fontSize: 12, color: "#A8A29A", lineHeight: 1.5 }}>
                      I confirm the above attestation is accurate and I agree to be bound by it.
                    </span>
                  </label>
                  <button
                    onClick={() => handleAttest(step)}
                    disabled={!checked[step.id] || submitting === step.id}
                    style={{
                      padding: "9px 20px",
                      background: checked[step.id] ? "rgba(198,165,90,0.12)" : "rgba(198,165,90,0.04)",
                      border: `1px solid ${checked[step.id] ? "rgba(198,165,90,0.5)" : "rgba(198,165,90,0.15)"}`,
                      borderRadius: 5,
                      color: checked[step.id] ? "#C6A55A" : "#5A5550",
                      fontSize: 12, fontFamily: "monospace", letterSpacing: "0.1em",
                      cursor: checked[step.id] ? "pointer" : "not-allowed",
                      transition: "all 0.2s",
                    }}
                  >
                    {submitting === step.id ? "SUBMITTING..." : "I ATTEST"}
                  </button>
                  {step.requires_operator_confirmation && (
                    <p style={{ fontSize: 11, color: "#A8A29A", marginTop: 10, fontFamily: "monospace" }}>
                      This step requires operator review after submission.
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div style={{
        padding: "14px 18px",
        background: "rgba(198,165,90,0.03)",
        border: "1px solid rgba(198,165,90,0.1)",
        borderRadius: 6,
        display: "flex", alignItems: "flex-start", gap: 10,
      }}>
        <AlertCircle size={14} color="#A8A29A" style={{ marginTop: 1, flexShrink: 0 }} />
        <p style={{ fontSize: 12, color: "#A8A29A", margin: 0, lineHeight: 1.6 }}>
          All certifications reviewed by The Milano Seal™ before routing is enabled. Steps requiring operator confirmation will be reviewed within one business day.
        </p>
      </div>
    </div>
  );
}
