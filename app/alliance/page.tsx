"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, Send, Map, CheckCircle, AlertTriangle } from "lucide-react";

const CORRIDORS = ["Italy", "Portugal", "Mexico", "Brazil", "Spain", "France", "Other"];
const ROLES = [
  "Attorney",
  "Notary",
  "International Partner",
  "Real Estate Professional",
  "Other",
];

export default function AlliancePage() {
  const [form, setForm] = useState({
    partner_name: "",
    firm: "",
    email: "",
    role: "",
    corridors: [] as string[],
    observation: "",
    source_url: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{
    success?: boolean;
    message?: string;
    reference?: string;
    error?: string;
  } | null>(null);

  function toggleCorridor(c: string) {
    setForm((f) => ({
      ...f,
      corridors: f.corridors.includes(c)
        ? f.corridors.filter((x) => x !== c)
        : [...f.corridors, c],
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch("/api/alliance/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      if (data.success) {
        setForm({
          partner_name: "",
          firm: "",
          email: "",
          role: "",
          corridors: [],
          observation: "",
          source_url: "",
        });
      }
    } catch {
      setResult({ error: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: "rgba(4,3,1,1)", color: "rgba(255,255,255,0.85)" }}
    >
      <div className="max-w-4xl mx-auto px-6 py-16 space-y-16">
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
            Milano Execution Partner Suite™
          </h1>
          <p className="text-sm leading-relaxed max-w-2xl" style={{ color: "rgba(255,255,255,0.45)" }}>
            Join the network of attorneys, notaries, and international practitioners
            coordinating document execution through The Milano Seal™.
          </p>
        </div>

        {/* Partner Observation Intake Form */}
        <div
          className="rounded-sm p-8 space-y-6"
          style={{
            background: "rgba(8,5,1,0.96)",
            border: "1px solid rgba(212,175,55,0.12)",
          }}
        >
          <div>
            <p
              className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              Partner Observation Intake
            </p>
            <h2
              className="text-lg font-light"
              style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}
            >
              Submit an Authority Observation
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Partner Name *
                </label>
                <input
                  type="text"
                  required
                  value={form.partner_name}
                  onChange={(e) => setForm((f) => ({ ...f, partner_name: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Firm / Organization
                </label>
                <input
                  type="text"
                  value={form.firm}
                  onChange={(e) => setForm((f) => ({ ...f, firm: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: "rgba(255,255,255,0.8)",
                  }}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                  Role
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                  style={{
                    background: "rgba(8,5,1,0.98)",
                    border: "1px solid rgba(212,175,55,0.15)",
                    color: form.role ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)",
                  }}
                >
                  <option value="">Select role...</option>
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Corridor Interest chips */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Corridor Interest
              </label>
              <div className="flex flex-wrap gap-2">
                {CORRIDORS.map((c) => {
                  const active = form.corridors.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCorridor(c)}
                      className="px-3 py-1 rounded-sm text-[11px] font-mono uppercase tracking-[0.15em] transition-colors duration-200"
                      style={{
                        background: active ? "rgba(212,175,55,0.15)" : "rgba(255,255,255,0.04)",
                        border: active ? "1px solid rgba(212,175,55,0.5)" : "1px solid rgba(255,255,255,0.08)",
                        color: active ? "#d4af37" : "rgba(255,255,255,0.4)",
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authority Observation */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Authority Observation *
              </label>
              <textarea
                required
                rows={5}
                value={form.observation}
                onChange={(e) => setForm((f) => ({ ...f, observation: e.target.value }))}
                placeholder="I have information about a receiving authority's requirements..."
                className="w-full rounded-sm px-3 py-2 text-sm outline-none resize-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  color: "rgba(255,255,255,0.8)",
                }}
              />
            </div>

            {/* Source URL */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(255,255,255,0.35)" }}>
                Source URL (optional)
              </label>
              <input
                type="url"
                value={form.source_url}
                onChange={(e) => setForm((f) => ({ ...f, source_url: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-sm px-3 py-2 text-sm outline-none"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(212,175,55,0.15)",
                  color: "rgba(255,255,255,0.8)",
                }}
              />
            </div>

            {result && (
              <div
                className="flex items-start gap-3 rounded-sm px-4 py-3"
                style={{
                  background: result.success
                    ? "rgba(212,175,55,0.06)"
                    : "rgba(180,50,50,0.08)",
                  border: result.success
                    ? "1px solid rgba(212,175,55,0.2)"
                    : "1px solid rgba(180,50,50,0.2)",
                }}
              >
                {result.success ? (
                  <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#d4af37" }} />
                ) : (
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: "#b43232" }} />
                )}
                <div className="text-xs space-y-0.5">
                  <p style={{ color: result.success ? "rgba(255,255,255,0.75)" : "rgba(255,100,100,0.8)" }}>
                    {result.message ?? result.error}
                  </p>
                  {result.reference && (
                    <p className="font-mono" style={{ color: "rgba(212,175,55,0.6)" }}>
                      Reference: {result.reference}
                    </p>
                  )}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-5 py-2.5 rounded-sm text-xs font-mono uppercase tracking-[0.2em] transition-opacity duration-200 disabled:opacity-50"
              style={{
                background: "rgba(212,175,55,0.12)",
                border: "1px solid rgba(212,175,55,0.3)",
                color: "#d4af37",
              }}
            >
              <Send className="w-3.5 h-3.5" />
              {submitting ? "Submitting..." : "Submit Observation"}
            </button>
          </form>
        </div>

        {/* What Partners Can Submit */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div
            className="rounded-sm p-6 space-y-4"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(212,175,55,0.08)",
            }}
          >
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.45)" }}>
                Partners Can Submit
              </p>
              <h3 className="text-sm font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
                Accepted Observations
              </h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Authority requirement observations",
                "Timeline observations from completed matters",
                "Rejection observations",
                "Source URLs for verification",
                "Contact update requests",
                "Referral leads",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                  <CheckCircle className="w-3 h-3 mt-0.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-sm p-6 space-y-4"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(255,255,255,0.04)",
            }}
          >
            <div>
              <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(255,255,255,0.2)" }}>
                Partner Restrictions
              </p>
              <h3 className="text-sm font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "rgba(255,255,255,0.45)" }}>
                What Partners Cannot Do
              </h3>
            </div>
            <ul className="space-y-2.5">
              {[
                "Verify authority records or promote confidence levels",
                "View client documents or matter internals",
                "View other partners' data or revenue information",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                  <span className="mt-1 flex-shrink-0 w-2.5 h-px" style={{ background: "rgba(255,255,255,0.15)" }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Execution Partner Toolkit */}
        <div className="space-y-4">
          <div>
            <p className="text-[9px] font-mono uppercase tracking-[0.3em] mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>
              Alliance Resources
            </p>
            <h2 className="text-xl font-light" style={{ fontFamily: "var(--font-playfair),Georgia,serif" }}>
              Execution Partner Toolkit™
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              {
                icon: FileText,
                title: "Submit an Observation",
                description: "Share authority requirements, rejection notes, or timeline data with the Milano Seal operations team.",
                href: "#intake-form",
                label: "Open Form",
              },
              {
                icon: Send,
                title: "Refer a Matter",
                description: "Send a client to Milano Seal intake. Your referral will be captured and attributed to your partner record.",
                href: "/intake?ref=partner",
                label: "Go to Intake",
              },
              {
                icon: Map,
                title: "Check Corridor Status",
                description: "View current processing timelines, authority notes, and jurisdictional intelligence by corridor.",
                href: "/map",
                label: "View Map",
              },
            ].map((card) => (
              <Link
                key={card.title}
                href={card.href}
                className="group block rounded-sm p-5 space-y-3 transition-colors duration-300"
                style={{
                  background: "rgba(8,5,1,0.96)",
                  border: "1px solid rgba(212,175,55,0.1)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center"
                  style={{
                    background: "rgba(212,175,55,0.06)",
                    border: "1px solid rgba(212,175,55,0.18)",
                  }}
                >
                  <card.icon className="w-3.5 h-3.5" style={{ color: "#d4af37" }} />
                </div>
                <div>
                  <h3 className="text-sm font-light mb-1.5" style={{ fontFamily: "var(--font-playfair),Georgia,serif", color: "rgba(255,255,255,0.75)" }}>
                    {card.title}
                  </h3>
                  <p className="text-[11px] leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>
                    {card.description}
                  </p>
                </div>
                <div className="text-[9px] font-mono uppercase tracking-[0.2em]" style={{ color: "rgba(212,175,55,0.5)" }}>
                  {card.label} →
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
