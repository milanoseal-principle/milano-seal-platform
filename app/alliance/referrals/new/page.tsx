"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Send, CheckCircle, AlertTriangle } from "lucide-react";

const DESTINATION_COUNTRIES = [
  "Italy", "Portugal", "Mexico", "Brazil", "Spain",
  "France", "Germany", "UK", "UAE", "Other",
];

const DOCUMENT_TYPES = [
  "Power of Attorney", "Birth Certificate", "Marriage Certificate",
  "Death Certificate", "Affidavit", "Diploma / Transcript",
  "Criminal Record", "Other",
];

const MATTER_TYPES = [
  "Citizenship by Descent", "Vital Records", "Power of Attorney",
  "Corporate", "Real Estate", "Immigration", "Academic", "Employment", "Other",
];

const CONTACT_METHODS = ["Email", "Phone", "WhatsApp"];
const URGENCY_LEVELS = ["Standard", "Priority", "Urgent"];

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(212,175,55,0.15)",
  color: "rgba(255,255,255,0.8)",
};

const labelStyle = {
  color: "rgba(255,255,255,0.35)",
};

function InputField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-[10px] font-mono uppercase tracking-[0.2em]"
        style={labelStyle}
      >
        {label}
        {required && " *"}
      </label>
      {children}
    </div>
  );
}

function ReferralFormInner() {
  const searchParams = useSearchParams();
  const refParam = searchParams.get("ref") ?? "";

  const [form, setForm] = useState({
    referral_code: refParam,
    partner_name: "",
    partner_email: "",
    partner_firm: "",
    client_name: "",
    client_email: "",
    client_phone: "",
    preferred_contact_method: "Email",
    destination_country: "",
    document_type: "",
    matter_type: "",
    urgency: "Standard",
    signer_location: "",
    requires_apostille: false,
    requires_translation: false,
    requires_witness: false,
    partner_context_note: "",
    deadline_note: "",
    receiving_authority_note: "",
    known_issue_note: "",
  });

  const [submitting, setSubmitting] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    referral_id?: string;
    error?: string;
  } | null>(null);

  useEffect(() => {
    if (refParam) setForm((f) => ({ ...f, referral_code: refParam }));
  }, [refParam]);

  function set(key: string, value: string | boolean) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function validate(): boolean {
    if (!form.referral_code && !form.partner_email) {
      setValidationError("Please complete the required referral details before submitting.");
      return false;
    }
    if (!form.client_name && !form.client_email) {
      setValidationError("Please complete the required referral details before submitting.");
      return false;
    }
    if (!form.destination_country || !form.document_type || !form.matter_type) {
      setValidationError("Please complete the required referral details before submitting.");
      return false;
    }
    setValidationError(null);
    return true;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
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
    } catch {
      setResult({ error: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  if (result && result.referral_id) {
    return (
      <div
        className="rounded-sm p-8 space-y-5"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <div className="flex items-center gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#d4af37" }} />
          <h2
            className="text-lg font-light"
            style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "#d4af37" }}
          >
            Referral Received
          </h2>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
          Thank you. This referral has been received for review. If accepted, the matter will be
          routed through The Milano Seal execution workflow and status visibility will be available
          through the partner-safe referral view.
        </p>
        <div
          className="rounded-sm px-4 py-3 space-y-1"
          style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <p className="text-[9px] font-mono uppercase tracking-[0.25em]" style={{ color: "rgba(212,175,55,0.5)" }}>
            Referral ID
          </p>
          <p className="font-mono text-sm" style={{ color: "#d4af37" }}>
            {result.referral_id}
          </p>
        </div>
        {form.referral_code && (
          <Link
            href={`/alliance/referrals?ref=${encodeURIComponent(form.referral_code)}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-[0.15em]"
            style={{ color: "rgba(212,175,55,0.7)" }}
          >
            View Referral Status →
          </Link>
        )}
      </div>
    );
  }

  const sharedInputClass = "w-full rounded-sm px-3 py-2 text-sm outline-none";

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Section 1: Partner Information */}
      <div
        className="rounded-sm p-6 space-y-5"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.12)" }}
      >
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
            Section 1
          </p>
          <h2 className="text-base font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
            Partner Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Referral Code">
            <input
              type="text"
              value={form.referral_code}
              onChange={(e) => set("referral_code", e.target.value)}
              placeholder="e.g. MS-PARTNER-001"
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Partner Name" required={!form.referral_code}>
            <input
              type="text"
              value={form.partner_name}
              onChange={(e) => set("partner_name", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Partner Email" required={!form.referral_code}>
            <input
              type="email"
              value={form.partner_email}
              onChange={(e) => set("partner_email", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Firm / Organization">
            <input
              type="text"
              value={form.partner_firm}
              onChange={(e) => set("partner_firm", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
        </div>
      </div>

      {/* Section 2: Client Information */}
      <div
        className="rounded-sm p-6 space-y-5"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.12)" }}
      >
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
            Section 2
          </p>
          <h2 className="text-base font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
            Client Information
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Client Name" required={!form.client_email}>
            <input
              type="text"
              value={form.client_name}
              onChange={(e) => set("client_name", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Client Email" required={!form.client_name}>
            <input
              type="email"
              value={form.client_email}
              onChange={(e) => set("client_email", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Client Phone">
            <input
              type="text"
              value={form.client_phone}
              onChange={(e) => set("client_phone", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Preferred Contact Method">
            <select
              value={form.preferred_contact_method}
              onChange={(e) => set("preferred_contact_method", e.target.value)}
              className={sharedInputClass}
              style={{ ...inputStyle, background: "rgba(8,5,1,0.98)" }}
            >
              {CONTACT_METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </InputField>
        </div>
      </div>

      {/* Section 3: Matter Details */}
      <div
        className="rounded-sm p-6 space-y-5"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.12)" }}
      >
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
            Section 3
          </p>
          <h2 className="text-base font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
            Matter Details
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField label="Destination Country" required>
            <select
              value={form.destination_country}
              onChange={(e) => set("destination_country", e.target.value)}
              className={sharedInputClass}
              style={{
                ...inputStyle,
                background: "rgba(8,5,1,0.98)",
                color: form.destination_country ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
              }}
            >
              <option value="">Select country...</option>
              {DESTINATION_COUNTRIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Document Type" required>
            <select
              value={form.document_type}
              onChange={(e) => set("document_type", e.target.value)}
              className={sharedInputClass}
              style={{
                ...inputStyle,
                background: "rgba(8,5,1,0.98)",
                color: form.document_type ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
              }}
            >
              <option value="">Select document...</option>
              {DOCUMENT_TYPES.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Matter Type" required>
            <select
              value={form.matter_type}
              onChange={(e) => set("matter_type", e.target.value)}
              className={sharedInputClass}
              style={{
                ...inputStyle,
                background: "rgba(8,5,1,0.98)",
                color: form.matter_type ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
              }}
            >
              <option value="">Select matter type...</option>
              {MATTER_TYPES.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Urgency">
            <select
              value={form.urgency}
              onChange={(e) => set("urgency", e.target.value)}
              className={sharedInputClass}
              style={{ ...inputStyle, background: "rgba(8,5,1,0.98)" }}
            >
              {URGENCY_LEVELS.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </InputField>
          <InputField label="Signer Location">
            <input
              type="text"
              value={form.signer_location}
              onChange={(e) => set("signer_location", e.target.value)}
              placeholder="City, State or Country"
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
        </div>
        <div className="flex flex-wrap gap-6 pt-1">
          {[
            { key: "requires_apostille", label: "Requires Apostille" },
            { key: "requires_translation", label: "Requires Translation" },
            { key: "requires_witness", label: "Requires Witness" },
          ].map(({ key, label }) => (
            <label
              key={key}
              className="flex items-center gap-2.5 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={form[key as keyof typeof form] as boolean}
                onChange={(e) => set(key, e.target.checked)}
                className="w-3.5 h-3.5 rounded-sm"
                style={{ accentColor: "#d4af37" }}
              />
              <span className="text-[11px] font-mono uppercase tracking-[0.12em]" style={{ color: "rgba(255,255,255,0.45)" }}>
                {label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Section 4: Context Notes */}
      <div
        className="rounded-sm p-6 space-y-5"
        style={{ background: "rgba(8,5,1,0.96)", border: "1px solid rgba(212,175,55,0.12)" }}
      >
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
            Section 4
          </p>
          <h2 className="text-base font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
            Context Notes
          </h2>
        </div>
        <div className="space-y-4">
          <InputField label="Partner Context">
            <textarea
              rows={4}
              value={form.partner_context_note}
              onChange={(e) => set("partner_context_note", e.target.value)}
              placeholder="Any background on this matter…"
              className={`${sharedInputClass} resize-none`}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Deadline or Timeline Note">
            <input
              type="text"
              value={form.deadline_note}
              onChange={(e) => set("deadline_note", e.target.value)}
              className={sharedInputClass}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Receiving Authority Note">
            <textarea
              rows={3}
              value={form.receiving_authority_note}
              onChange={(e) => set("receiving_authority_note", e.target.value)}
              placeholder="Known authority requirements or contacts…"
              className={`${sharedInputClass} resize-none`}
              style={inputStyle}
            />
          </InputField>
          <InputField label="Known Issues">
            <textarea
              rows={3}
              value={form.known_issue_note}
              onChange={(e) => set("known_issue_note", e.target.value)}
              placeholder="Any known complications…"
              className={`${sharedInputClass} resize-none`}
              style={inputStyle}
            />
          </InputField>
        </div>
      </div>

      {/* Disclaimer */}
      <p className="text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.2)" }}>
        The Milano Seal provides notarial and document coordination services only and does not
        provide legal advice. International use is subject to destination and
        receiving-authority requirements.
      </p>

      {/* Validation Error */}
      {validationError && (
        <div
          className="flex items-start gap-3 rounded-sm px-4 py-3"
          style={{ background: "rgba(180,50,50,0.08)", border: "1px solid rgba(180,50,50,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#b43232" }} />
          <p className="text-xs" style={{ color: "rgba(255,100,100,0.8)" }}>{validationError}</p>
        </div>
      )}

      {/* API Error */}
      {result?.error && (
        <div
          className="flex items-start gap-3 rounded-sm px-4 py-3"
          style={{ background: "rgba(180,50,50,0.08)", border: "1px solid rgba(180,50,50,0.2)" }}
        >
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#b43232" }} />
          <p className="text-xs" style={{ color: "rgba(255,100,100,0.8)" }}>{result.error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-[0.2em] transition-opacity duration-200 disabled:opacity-50"
        style={{ background: "rgba(212,175,55,0.12)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37" }}
      >
        <Send className="w-3.5 h-3.5" />
        {submitting ? "Submitting..." : "Submit Referral for Review"}
      </button>
    </form>
  );
}

export default function NewReferralPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "rgba(4,3,1,1)", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-3xl mx-auto px-6 py-16 space-y-10">
        {/* Header */}
        <div className="space-y-3">
          <p
            className="text-[10px] font-mono uppercase tracking-[0.35em]"
            style={{ color: "rgba(212,175,55,0.6)" }}
          >
            Milano Seal Alliance
          </p>
          <h1
            className="text-4xl font-light"
            style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "#d4af37" }}
          >
            Submit a Partner Referral
          </h1>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            Submit a client referral for The Milano Seal execution workflow. Referrals are reviewed
            by the operations team before acceptance.
          </p>
        </div>

        <Suspense fallback={<div className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>Loading form…</div>}>
          <ReferralFormInner />
        </Suspense>
      </div>
    </div>
  );
}
