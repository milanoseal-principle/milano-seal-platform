"use client";
import { useState } from 'react';

import { CheckCircle, Circle } from "lucide-react";

const STEPS = [
  {
    key: "identity",
    label: "Identity",
    title: "Identity Verification",
    description:
      "Confirm your legal identity and professional standing. This information is reviewed by the Milano Seal compliance team before your account is activated.",
    fields: [
      { id: "contact_name", label: "Full Legal Name", type: "text", required: true },
      { id: "firm_name", label: "Firm / Organization Name", type: "text", required: false },
      { id: "partner_type", label: "Partner Type", type: "select", required: true, options: ["law_firm", "immigration", "relocation", "notary_operator", "real_estate", "other"] },
      { id: "email", label: "Contact Email", type: "email", required: true },
    ],
  },
  {
    key: "service_scope",
    label: "Service Scope",
    title: "Service Scope",
    description:
      "Indicate the jurisdictions and document categories relevant to your practice. This determines referral routing eligibility.",
    fields: [
      { id: "jurisdiction_codes", label: "Primary Jurisdictions (comma-separated country codes)", type: "text", required: false },
      { id: "document_categories", label: "Document Categories (e.g. apostille, notarization, translation)", type: "text", required: false },
    ],
  },
  {
    key: "document_handling",
    label: "Document Handling",
    title: "Document Handling Protocol",
    description:
      "Acknowledge Milano Seal's document handling standards. Partners must confirm secure transmission, storage, and destruction protocols before receiving client matters.",
    fields: [
      { id: "doc_handling_confirm", label: "I confirm I have secure document handling procedures in place", type: "checkbox", required: true },
    ],
  },
  {
    key: "compliance",
    label: "Compliance",
    title: "Compliance Agreement",
    description:
      "Review and confirm the Alliance Standard Operating Procedures, data handling requirements, and response SLA commitments.",
    fields: [
      { id: "compliance_confirm", label: "I agree to the Alliance Standard Operating Procedures", type: "checkbox", required: true },
      { id: "data_confirm", label: "I confirm GDPR/CCPA compliance in my client operations", type: "checkbox", required: true },
    ],
  },
  {
    key: "security",
    label: "Security",
    title: "Security Attestation",
    description:
      "Attest to your organisation's security posture. This includes access controls, encryption standards, and incident response readiness.",
    fields: [
      { id: "security_confirm", label: "I attest to maintaining appropriate security controls for client data", type: "checkbox", required: true },
      { id: "mfa_confirm", label: "I use multi-factor authentication on my business accounts", type: "checkbox", required: true },
    ],
  },
];

export function AllianceOnboardingFlow() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, string | boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const current = STEPS[step];

  function handleField(id: string, value: string | boolean) {
    setFormData((prev) => ({ ...prev, [id]: value }));
  }

  function canProceed() {
    return current.fields
      .filter((f) => f.required)
      .every((f) => {
        const v = formData[f.id];
        if (f.type === "checkbox") return v === true;
        return typeof v === "string" && v.trim().length > 0;
      });
  }

  async function handleSubmit() {
    setSubmitting(true);
    await fetch("/api/alliance/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    }).catch(() => null);
    setSubmitting(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div
        style={{
          padding: "48px 24px",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            background: "rgba(63,164,122,0.1)",
            border: "1px solid rgba(63,164,122,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CheckCircle size={24} color="#3FA47A" />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, color: "#F6F1E6", marginBottom: 8 }}>
            Onboarding Submitted
          </div>
          <p style={{ fontSize: 13, color: "#A8A29A", maxWidth: 400, lineHeight: 1.6 }}>
            The Milano Seal compliance team will review your submission and follow up within 2–3 business days.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Step rail */}
      <div style={{ display: "flex", alignItems: "center", marginBottom: 32, overflowX: "auto" }}>
        {STEPS.map((s, i) => {
          const done = i < step;
          const active = i === step;
          return (
            <div key={s.key} style={{ display: "flex", alignItems: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: done ? "#C6A55A" : active ? "rgba(198,166,91,0.15)" : "rgba(255,255,255,0.04)",
                    border: `2px solid ${done || active ? "#C6A55A" : "rgba(255,255,255,0.1)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: 700,
                    color: done ? "#050505" : active ? "#C6A55A" : "#A8A29A",
                    flexShrink: 0,
                  }}
                >
                  {done ? "✓" : i + 1}
                </div>
                <span style={{ fontSize: 10, color: active ? "#C6A55A" : done ? "#D8BE73" : "#A8A29A", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  style={{
                    width: 40,
                    height: 1,
                    background: i < step ? "#C6A55A" : "rgba(255,255,255,0.08)",
                    marginBottom: 16,
                    flexShrink: 0,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div
        style={{
          padding: 24,
          background: "#111111",
          border: "1px solid rgba(198,166,91,0.16)",
          borderRadius: 8,
        }}
      >
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 6 }}>
            Step {step + 1} of {STEPS.length}
          </div>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "#F6F1E6", margin: "0 0 8px" }}>
            {current.title}
          </h2>
          <p style={{ fontSize: 13, color: "#A8A29A", lineHeight: 1.6, margin: 0 }}>
            {current.description}
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {current.fields.map((field) => (
            <div key={field.id}>
              {field.type === "checkbox" ? (
                <label style={{ display: "flex", alignItems: "flex-start", gap: 12, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={formData[field.id] === true}
                    onChange={(e) => handleField(field.id, e.target.checked)}
                    style={{ marginTop: 2, accentColor: "#C6A55A" }}
                  />
                  <span style={{ fontSize: 13, color: "#F6F1E6", lineHeight: 1.5 }}>{field.label}</span>
                </label>
              ) : field.type === "select" ? (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
                    {field.label}
                    {field.required && <span style={{ color: "#C6A55A" }}> *</span>}
                  </label>
                  <select
                    value={(formData[field.id] as string) || ""}
                    onChange={(e) => handleField(field.id, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#0a0a0a",
                      border: "1px solid rgba(198,166,91,0.2)",
                      borderRadius: 4,
                      color: formData[field.id] ? "#F6F1E6" : "#A8A29A",
                      fontSize: 13,
                      outline: "none",
                    }}
                  >
                    <option value="">Select...</option>
                    {field.options?.map((o) => (
                      <option key={o} value={o}>{o.replace(/_/g, " ")}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label style={{ display: "block", fontSize: 11, fontFamily: "monospace", letterSpacing: "0.15em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
                    {field.label}
                    {field.required && <span style={{ color: "#C6A55A" }}> *</span>}
                  </label>
                  <input
                    type={field.type}
                    value={(formData[field.id] as string) || ""}
                    onChange={(e) => handleField(field.id, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "9px 12px",
                      background: "#0a0a0a",
                      border: "1px solid rgba(198,166,91,0.2)",
                      borderRadius: 4,
                      color: "#F6F1E6",
                      fontSize: 13,
                      outline: "none",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28 }}>
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            style={{
              padding: "9px 20px",
              background: "transparent",
              border: "1px solid rgba(198,166,91,0.2)",
              borderRadius: 4,
              color: step === 0 ? "#A8A29A" : "#C6A55A",
              fontSize: 13,
              cursor: step === 0 ? "default" : "pointer",
              opacity: step === 0 ? 0.4 : 1,
            }}
          >
            Back
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canProceed()}
              style={{
                padding: "9px 24px",
                background: canProceed() ? "rgba(198,166,91,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${canProceed() ? "rgba(198,166,91,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 4,
                color: canProceed() ? "#C6A55A" : "#A8A29A",
                fontSize: 13,
                cursor: canProceed() ? "pointer" : "default",
              }}
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={!canProceed() || submitting}
              style={{
                padding: "9px 24px",
                background: canProceed() ? "rgba(198,166,91,0.15)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${canProceed() ? "rgba(198,166,91,0.4)" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 4,
                color: canProceed() ? "#C6A55A" : "#A8A29A",
                fontSize: 13,
                cursor: canProceed() ? "pointer" : "default",
              }}
            >
              {submitting ? "Submitting..." : "Submit Onboarding"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
