"use client";

import { useState } from "react";
<<<<<<< HEAD
import {
  selectCertificate,
  type NotarialAct,
  type CertificateTemplate,
} from "@/lib/intelligence/certificateSelection";

const ACT_OPTIONS: { value: NotarialAct; label: string }[] = [
  { value: "acknowledgment", label: "Acknowledgment" },
  { value: "jurat", label: "Jurat" },
  { value: "copy_certification", label: "Copy Certification" },
  { value: "oath_affirmation", label: "Oath / Affirmation" },
  { value: "representative_acknowledgment", label: "Representative Acknowledgment" },
];

const DESTINATION_OPTIONS = [
  { value: "any", label: "Any / Unspecified" },
  { value: "apostille", label: "Apostille" },
  { value: "consulate", label: "Consulate / Legalization" },
  { value: "domestic", label: "Domestic Use" },
];

function Badge({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`inline-block font-mono text-xs px-2 py-0.5 rounded border ${
        active
          ? "border-green-700 bg-green-900/40 text-green-300"
          : "border-neutral-700 bg-neutral-800 text-neutral-500"
      }`}
    >
      {label}
    </span>
  );
}

function TemplateCard({ template }: { template: CertificateTemplate }) {
  const [copied, setCopied] = useState(false);

  function copyTemplate() {
    navigator.clipboard.writeText(template.template_text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-950 p-5 space-y-3">
      {/* Title row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="font-mono text-sm font-semibold text-[#c9a84c]">
          {template.label}
        </h3>
        <div className="flex gap-2 flex-wrap">
          <Badge label="RON" active={template.ron_eligible} />
          <Badge label="Physical" active={template.physical_eligible} />
        </div>
      </div>

      {/* Description */}
      <p className="font-mono text-xs text-neutral-400">{template.description}</p>

      {/* Restrictions */}
      {template.restrictions && (
        <p className="font-mono text-xs text-amber-400 border border-amber-800 rounded px-3 py-2 bg-amber-950/30">
          ⚠ {template.restrictions}
        </p>
      )}

      {/* Template text */}
      <pre className="font-mono text-xs text-neutral-300 bg-neutral-900 border border-neutral-700 rounded p-4 whitespace-pre-wrap break-words leading-relaxed">
        {template.template_text}
      </pre>

      {/* Operator approval notice + copy button */}
      <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
        <p className="font-mono text-xs text-red-400 font-semibold">
          Operator approval required before use. System suggests — operator confirms.
        </p>
        <button
          onClick={copyTemplate}
          className="font-mono text-xs px-4 py-1.5 rounded border border-[#c9a84c] text-[#c9a84c] hover:bg-[#c9a84c]/10 transition-colors shrink-0"
        >
          {copied ? "Copied!" : "Copy Template"}
        </button>
      </div>
    </div>
  );
}

export default function CertificateSelectionEngine() {
  const [act, setAct] = useState<NotarialAct>("acknowledgment");
  const [state, setState] = useState("florida");
  const [destination, setDestination] = useState("any");
  const [ronSession, setRonSession] = useState(false);

  const results = selectCertificate(act, state, destination, ronSession);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-[#c9a84c] font-mono text-sm uppercase tracking-widest font-semibold">
          Certificate Selection Engine
        </h2>
        <p className="font-mono text-xs text-neutral-500 mt-1">
          Select parameters to find matching notarial certificate templates.
        </p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Act type */}
        <div className="space-y-1">
          <label className="font-mono text-xs text-neutral-400 uppercase tracking-wide">
            Act Type
          </label>
          <select
            value={act}
            onChange={(e) => setAct(e.target.value as NotarialAct)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-xs text-neutral-200 focus:outline-none focus:border-[#c9a84c]"
          >
            {ACT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* State */}
        <div className="space-y-1">
          <label className="font-mono text-xs text-neutral-400 uppercase tracking-wide">
            State
          </label>
          <select
            value={state}
            onChange={(e) => setState(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-xs text-neutral-200 focus:outline-none focus:border-[#c9a84c]"
          >
            <option value="florida">Florida</option>
            <option value="federal">Federal</option>
          </select>
        </div>

        {/* Destination type */}
        <div className="space-y-1">
          <label className="font-mono text-xs text-neutral-400 uppercase tracking-wide">
            Destination Type
          </label>
          <select
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-700 rounded px-3 py-2 font-mono text-xs text-neutral-200 focus:outline-none focus:border-[#c9a84c]"
          >
            {DESTINATION_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>

        {/* RON session */}
        <div className="space-y-1">
          <label className="font-mono text-xs text-neutral-400 uppercase tracking-wide">
            Session Type
          </label>
          <label className="flex items-center gap-2 cursor-pointer h-9 px-3 bg-neutral-900 border border-neutral-700 rounded">
            <input
              type="checkbox"
              checked={ronSession}
              onChange={(e) => setRonSession(e.target.checked)}
              className="accent-[#c9a84c]"
            />
            <span className="font-mono text-xs text-neutral-200">RON Session</span>
          </label>
        </div>
      </div>

      {/* Results */}
      {results.length === 0 ? (
        <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-5 py-8 text-center">
          <p className="font-mono text-xs text-neutral-500">
            No matching templates found for the selected parameters.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="font-mono text-xs text-neutral-500">
            {results.length} template{results.length !== 1 ? "s" : ""} matched.
          </p>
          {results.map((t) => (
            <TemplateCard key={t.id} template={t} />
          ))}
        </div>
      )}
=======
import { selectCertificate, type CertificateTemplate } from "@/lib/intelligence/certificateSelection";

const ACT_OPTIONS = ["acknowledgment", "jurat", "oath"];
const STATE_OPTIONS = ["FL"];

export function CertificateSelectionEngine() {
  const [state, setState] = useState("FL");
  const [act, setAct] = useState("acknowledgment");
  const [isRON, setIsRON] = useState(false);

  const result = selectCertificate({ state, act, isRON });

  const inputStyle = {
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "rgba(255,255,255,0.85)",
    fontFamily: "monospace",
    fontSize: "11px",
    padding: "6px 10px",
    borderRadius: "6px",
    outline: "none",
  } as React.CSSProperties;

  const TemplateCard = ({ template, highlight }: { template: CertificateTemplate; highlight?: boolean }) => (
    <div
      className="rounded p-3 space-y-1"
      style={{
        background: highlight ? "rgba(212,175,55,0.08)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${highlight ? "rgba(212,175,55,0.3)" : "rgba(255,255,255,0.08)"}`,
      }}
    >
      <p className="font-mono text-[10px] tracking-wide font-semibold" style={{ color: highlight ? "#D4AF37" : "rgba(255,255,255,0.7)" }}>
        {template.label}
      </p>
      <p className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.45)" }}>{template.description}</p>
      <div className="flex gap-2 pt-0.5">
        <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.2)" }}>
          {template.act}
        </span>
        {template.requiresRON && (
          <span className="font-mono text-[8px] px-1.5 py-0.5 rounded" style={{ background: "rgba(212,175,55,0.1)", color: "#D4AF37", border: "1px solid rgba(212,175,55,0.2)" }}>
            RON
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="rounded-lg p-4 space-y-4" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
        Certificate Selection Engine
      </p>

      <div className="flex flex-wrap gap-3">
        <div className="space-y-1">
          <label className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>State</label>
          <select value={state} onChange={e => setState(e.target.value)} style={inputStyle}>
            {STATE_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>Act Type</label>
          <select value={act} onChange={e => setAct(e.target.value)} style={inputStyle}>
            {ACT_OPTIONS.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>RON</label>
          <select value={isRON ? "yes" : "no"} onChange={e => setIsRON(e.target.value === "yes")} style={inputStyle}>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </div>
      </div>

      {result.recommended ? (
        <div className="space-y-2">
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>Recommended</p>
          <TemplateCard template={result.recommended} highlight />
        </div>
      ) : (
        <div className="rounded p-3" style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
          <p className="font-mono text-[10px]" style={{ color: "#f59e0b" }}>{result.reason}</p>
        </div>
      )}

      {result.alternatives.length > 0 && (
        <div className="space-y-2">
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>Alternatives</p>
          {result.alternatives.map(t => <TemplateCard key={t.id} template={t} />)}
        </div>
      )}

      <p className="font-mono text-[8px]" style={{ color: "rgba(255,255,255,0.25)" }}>
        System suggests. Operator approves.
      </p>
>>>>>>> claude/funny-maxwell-hlxQN
    </div>
  );
}
