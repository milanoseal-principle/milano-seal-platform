"use client";

import { useMemo, useState } from "react";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";

interface FormState {
  referral_code: string;
  partner_email: string;
  client_name: string;
  destination_country: string;
  document_type: string;
  matter_type: string;
  urgency: string;
  notes: string;
}

interface AllianceReferralEngineProps {
  partnerEmail?: string | null;
  referralCode?: string | null;
}

const DOCUMENT_TYPES = ["Apostille", "Notarization", "Authentication", "Translation", "Legalization", "Power of Attorney", "Birth Certificate", "Marriage Certificate", "Degree Verification", "Corporate Documents", "Other"];
const MATTER_TYPES = ["Immigration", "Relocation", "Real Estate", "Business Formation", "Estate Planning", "Education", "Marriage / Family", "Other"];
const URGENCY_OPTIONS = ["Standard (10–15 business days)", "Expedited (5–7 business days)", "Urgent (2–3 business days)", "Emergency (same day / next day)"];

export function AllianceReferralEngine({ partnerEmail = "", referralCode = "" }: AllianceReferralEngineProps) {
  const initial = useMemo<FormState>(() => ({
    referral_code: referralCode ?? "",
    partner_email: partnerEmail ?? "",
    client_name: "",
    destination_country: "",
    document_type: "",
    matter_type: "",
    urgency: "",
    notes: "",
  }), [partnerEmail, referralCode]);

  const [form, setForm] = useState<FormState>(initial);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; referral_id?: string; error?: string } | null>(null);

  function set(key: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function canSubmit() {
    return (
      (form.partner_email.trim() || form.referral_code.trim()) &&
      form.client_name.trim() &&
      form.destination_country.trim() &&
      form.document_type &&
      form.matter_type
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/alliance/referrals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) setForm(initial);
    } catch {
      setResult({ error: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "9px 12px",
    background: "#0a0a0a",
    border: "1px solid rgba(198,166,91,0.2)",
    borderRadius: 4,
    color: "#F6F1E6",
    fontSize: 13,
    outline: "none",
    boxSizing: "border-box",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 10,
    fontFamily: "monospace",
    letterSpacing: "0.15em",
    textTransform: "uppercase",
    color: "#A8A29A",
    marginBottom: 6,
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {(form.referral_code || partnerEmail) && (
        <div style={{ padding: "10px 12px", background: "rgba(198,166,91,0.04)", border: "1px solid rgba(198,166,91,0.12)", borderRadius: 4, fontSize: 11, color: "#A8A29A" }}>
          Referral attribution locked to this Alliance account{form.referral_code ? ` · ${form.referral_code}` : ""}.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <div>
          <label style={labelStyle}>Partner Email <span style={{ color: "#C6A55A" }}>*</span></label>
          <input type="email" required={!form.referral_code} value={form.partner_email} onChange={(e) => set("partner_email", e.target.value)} readOnly={Boolean(partnerEmail)} style={{ ...inputStyle, opacity: partnerEmail ? 0.72 : 1 }} />
        </div>
        <div>
          <label style={labelStyle}>Client Name <span style={{ color: "#C6A55A" }}>*</span></label>
          <input type="text" required value={form.client_name} onChange={(e) => set("client_name", e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Destination Country <span style={{ color: "#C6A55A" }}>*</span></label>
          <input type="text" required value={form.destination_country} onChange={(e) => set("destination_country", e.target.value)} placeholder="e.g. Italy, Portugal, Mexico" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Document Type <span style={{ color: "#C6A55A" }}>*</span></label>
          <select required value={form.document_type} onChange={(e) => set("document_type", e.target.value)} style={{ ...inputStyle, color: form.document_type ? "#F6F1E6" : "#A8A29A" }}>
            <option value="">Select...</option>
            {DOCUMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Matter Type <span style={{ color: "#C6A55A" }}>*</span></label>
          <select required value={form.matter_type} onChange={(e) => set("matter_type", e.target.value)} style={{ ...inputStyle, color: form.matter_type ? "#F6F1E6" : "#A8A29A" }}>
            <option value="">Select...</option>
            {MATTER_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label style={labelStyle}>Urgency (optional)</label>
          <select value={form.urgency} onChange={(e) => set("urgency", e.target.value)} style={{ ...inputStyle, color: form.urgency ? "#F6F1E6" : "#A8A29A" }}>
            <option value="">Select...</option>
            {URGENCY_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label style={labelStyle}>Notes (optional)</label>
        <textarea
          rows={4}
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Additional context, known issues, or special instructions..."
          style={{ ...inputStyle, resize: "vertical" }}
        />
      </div>

      {result && (
        <div
          style={{
            padding: "12px 16px",
            background: result.success ? "rgba(63,164,122,0.06)" : "rgba(184,92,92,0.06)",
            border: `1px solid ${result.success ? "rgba(63,164,122,0.2)" : "rgba(184,92,92,0.2)"}`,
            borderRadius: 4,
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
          }}
        >
          {result.success ? (
            <CheckCircle size={14} color="#3FA47A" style={{ flexShrink: 0, marginTop: 1 }} />
          ) : (
            <AlertTriangle size={14} color="#B85C5C" style={{ flexShrink: 0, marginTop: 1 }} />
          )}
          <div style={{ fontSize: 13, color: result.success ? "#3FA47A" : "#B85C5C" }}>
            {result.success ? (
              <>Referral submitted. Reference: <span style={{ fontFamily: "monospace" }}>{result.referral_id}</span></>
            ) : result.error}
          </div>
        </div>
      )}

      <div>
        <button
          type="submit"
          disabled={!canSubmit() || submitting}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 24px",
            background: canSubmit() ? "rgba(198,166,91,0.12)" : "rgba(255,255,255,0.04)",
            border: `1px solid ${canSubmit() ? "rgba(198,166,91,0.35)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 4,
            color: canSubmit() ? "#C6A55A" : "#A8A29A",
            fontSize: 12,
            fontFamily: "monospace",
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            cursor: canSubmit() ? "pointer" : "default",
          }}
        >
          <Send size={13} />
          {submitting ? "Submitting..." : "Submit Referral"}
        </button>
      </div>
    </form>
  );
}
