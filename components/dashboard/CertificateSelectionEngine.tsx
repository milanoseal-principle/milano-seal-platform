"use client";

import { useState } from "react";
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
    </div>
  );
}
