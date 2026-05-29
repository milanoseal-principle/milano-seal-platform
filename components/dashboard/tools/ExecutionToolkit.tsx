"use client";

import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ToolResult<T = Record<string, unknown>> {
  result: T;
  confidence: "high" | "medium" | "low" | "manual_review";
  source_type: "static_registry" | "db_lookup" | "computed" | "manual";
  manual_review_flag: boolean;
  next_action: string;
  operator_note: string;
  client_summary: string;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function ConfidenceBadge({ level }: { level: ToolResult["confidence"] }) {
  const map: Record<
    ToolResult["confidence"],
    { label: string; className: string }
  > = {
    high: {
      label: "HIGH CONFIDENCE",
      className:
        "text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-sm bg-emerald-950/60 text-emerald-400 border border-emerald-800/60",
    },
    medium: {
      label: "MEDIUM CONFIDENCE",
      className:
        "text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-sm bg-amber-950/60 text-amber-400 border border-amber-700/60",
    },
    low: {
      label: "LOW CONFIDENCE",
      className:
        "text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-sm bg-orange-950/60 text-orange-400 border border-orange-700/60",
    },
    manual_review: {
      label: "MANUAL REVIEW",
      className:
        "text-[9px] font-mono tracking-wider px-2 py-0.5 rounded-sm bg-red-950/60 text-red-400 border border-red-800/60 animate-pulse",
    },
  };
  const { label, className } = map[level] ?? map.manual_review;
  return <span className={className}>{label}</span>;
}

function ManualReviewBanner() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-sm border border-amber-600/50 bg-amber-950/30 mt-3">
      <span className="text-amber-400 text-[9px] font-mono tracking-[0.2em] font-semibold">
        ⚠ MANUAL REVIEW REQUIRED
      </span>
    </div>
  );
}

function ResultField({
  label,
  value,
}: {
  label: string;
  value: string | boolean | number | null | string[];
}) {
  if (value === null || value === undefined) return null;
  const display = Array.isArray(value)
    ? value.join(", ") || "—"
    : typeof value === "boolean"
      ? value
        ? "Yes"
        : "No"
      : String(value) || "—";

  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[9px] font-mono tracking-[0.15em] text-white/30 uppercase">
        {label}
      </span>
      <span className="text-xs text-white/70">{display}</span>
    </div>
  );
}

interface ResultPanelProps {
  data: ToolResult;
  fields: { label: string; key: string }[];
}

function ResultPanel({ data, fields }: ResultPanelProps) {
  const [operatorNoteOpen, setOperatorNoteOpen] = useState(false);

  return (
    <div className="mt-4 space-y-3">
      {/* Confidence + manual review */}
      <div className="flex items-center gap-2 flex-wrap">
        <ConfidenceBadge level={data.confidence} />
        <span className="text-[9px] font-mono text-white/25 tracking-wider">
          {data.source_type}
        </span>
      </div>

      {data.manual_review_flag && <ManualReviewBanner />}

      {/* Result fields */}
      <div className="grid grid-cols-1 gap-2.5 pt-1">
        {fields.map((f) => {
          const val = (data.result as Record<string, unknown>)[f.key];
          return (
            <ResultField
              key={f.key}
              label={f.label}
              value={val as string | boolean | number | null | string[]}
            />
          );
        })}
      </div>

      {/* Next action */}
      <div className="pt-1 border-t border-white/5">
        <span className="text-[9px] font-mono tracking-[0.15em] text-white/30 uppercase block mb-1">
          Next Action
        </span>
        <p className="text-xs text-white/60">{data.next_action}</p>
      </div>

      {/* Client summary */}
      <div>
        <span className="text-[9px] font-mono tracking-[0.15em] text-white/30 uppercase block mb-1">
          Client Summary
        </span>
        <p className="text-xs text-white/45 italic">{data.client_summary}</p>
      </div>

      {/* Operator note — collapsible */}
      <div>
        <button
          onClick={() => setOperatorNoteOpen((p) => !p)}
          className="text-[9px] font-mono tracking-[0.15em] text-white/25 uppercase hover:text-white/40 transition-colors cursor-pointer"
        >
          {operatorNoteOpen ? "▾" : "▸"} Operator Note
        </button>
        {operatorNoteOpen && (
          <p className="mt-1.5 text-[11px] text-white/35 leading-relaxed border-l-2 border-white/10 pl-3">
            {data.operator_note}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────

function ToolCard({
  chip,
  title,
  children,
}: {
  chip: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="flex flex-col rounded-sm p-5"
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="mb-3">
        <span
          className="text-[9px] font-mono tracking-[0.3em] uppercase"
          style={{ color: "rgba(212,175,55,0.7)" }}
        >
          {chip}
        </span>
        <h3
          className="font-serif text-sm font-light mt-1"
          style={{ color: "rgba(212,175,55,1)" }}
        >
          {title}
        </h3>
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

// Shared input style
const INPUT_CLS =
  "w-full text-xs bg-transparent border border-white/[0.08] rounded-sm px-3 py-2 text-white/70 placeholder-white/20 focus:outline-none focus:border-white/20 transition-colors";

// Shared select style
const SELECT_CLS =
  "w-full text-xs bg-[rgba(8,5,1,0.97)] border border-white/[0.08] rounded-sm px-3 py-2 text-white/70 focus:outline-none focus:border-white/20 transition-colors";

function CheckButton({
  loading,
  onClick,
}: {
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="mt-3 px-4 py-2 rounded-sm text-[10px] font-mono tracking-wider transition-opacity disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
      style={{
        background: loading
          ? "rgba(212,175,55,0.4)"
          : "rgba(212,175,55,0.9)",
        color: "rgba(8,5,1,0.97)",
      }}
    >
      {loading ? "CHECKING..." : "CHECK"}
    </button>
  );
}

// ─── Tool 1: Hague Checker ─────────────────────────────────────────────────

function HagueTool() {
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!country.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/hague", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 01" title="Hague Checker">
      <input
        className={INPUT_CLS}
        placeholder="Destination country (e.g. Italy)"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
      />
      <CheckButton loading={loading} onClick={run} />
      {error && (
        <p className="mt-2 text-[11px] text-red-400">{error}</p>
      )}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Country", key: "country" },
            { label: "Hague Member", key: "is_hague_member" },
            { label: "Apostille Route", key: "apostille_route" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 2: Legalization Validator ──────────────────────────────────────────

function LegalizationTool() {
  const [country, setCountry] = useState("");
  const [docType, setDocType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!country.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/legalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country, document_type: docType || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 02" title="Legalization Validator">
      <div className="space-y-2">
        <input
          className={INPUT_CLS}
          placeholder="Destination country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <input
          className={INPUT_CLS}
          placeholder="Document type (optional)"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        />
      </div>
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Country", key: "country" },
            { label: "Route", key: "route" },
            { label: "Sequence", key: "sequence" },
            { label: "Embassy Dependency", key: "embassy_dependency" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 3: Embassy Locator ──────────────────────────────────────────────────

function EmbassyTool() {
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!country.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/embassy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ country }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 03" title="Embassy Locator">
      <input
        className={INPUT_CLS}
        placeholder="Destination country"
        value={country}
        onChange={(e) => setCountry(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
      />
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Country", key: "country" },
            { label: "Embassy Notes", key: "embassy_notes" },
            { label: "Manual Review Required", key: "manual_review_required" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 4: RON Eligibility Checker ─────────────────────────────────────────

function RONTool() {
  const [state, setState] = useState("");
  const [docType, setDocType] = useState("");
  const [location, setLocation] = useState<
    "in_state" | "out_of_state" | "international" | "unknown" | ""
  >("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!state.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/ron", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signer_state: state,
          document_type: docType || undefined,
          signer_location: location || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 04" title="RON Eligibility Checker">
      <div className="space-y-2">
        <input
          className={INPUT_CLS}
          placeholder="US state name or code (e.g. Florida, us-fl)"
          value={state}
          onChange={(e) => setState(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <input
          className={INPUT_CLS}
          placeholder="Document type (optional)"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        />
        <select
          className={SELECT_CLS}
          value={location}
          onChange={(e) =>
            setLocation(
              e.target.value as
                | "in_state"
                | "out_of_state"
                | "international"
                | "unknown"
                | "",
            )
          }
        >
          <option value="">Signer location (optional)</option>
          <option value="in_state">In-state</option>
          <option value="out_of_state">Out of state</option>
          <option value="international">International</option>
          <option value="unknown">Unknown</option>
        </select>
      </div>
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "State", key: "state" },
            { label: "RON Authorized", key: "ron_authorized" },
            { label: "RON Status", key: "ron_status_note" },
            { label: "Signer Location Note", key: "signer_location_note" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 5: Signer Requirements ─────────────────────────────────────────────

function SignerTool() {
  const [jurisdiction, setJurisdiction] = useState("");
  const [docType, setDocType] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!jurisdiction.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/signer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jurisdiction,
          document_type: docType || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 05" title="Signer Requirements">
      <div className="space-y-2">
        <input
          className={INPUT_CLS}
          placeholder="Jurisdiction (e.g. Florida, Italy)"
          value={jurisdiction}
          onChange={(e) => setJurisdiction(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <input
          className={INPUT_CLS}
          placeholder="Document type (optional)"
          value={docType}
          onChange={(e) => setDocType(e.target.value)}
        />
      </div>
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Jurisdiction", key: "jurisdiction" },
            { label: "Signer Count", key: "signer_count" },
            { label: "Witness Required", key: "witness_required" },
            { label: "Witness Count", key: "witness_count" },
            { label: "ID Required", key: "id_required" },
            { label: "Witness Rules", key: "witness_rules_note" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 6: Translation Detector ────────────────────────────────────────────

function TranslationTool() {
  const [country, setCountry] = useState("");
  const [docLang, setDocLang] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!country.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/translation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_country: country,
          document_language: docLang || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 06" title="Translation Detector">
      <div className="space-y-2">
        <input
          className={INPUT_CLS}
          placeholder="Destination country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <input
          className={INPUT_CLS}
          placeholder="Document language (optional, e.g. English)"
          value={docLang}
          onChange={(e) => setDocLang(e.target.value)}
        />
      </div>
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Destination", key: "destination_country" },
            { label: "Translation Likely", key: "translation_likely" },
            { label: "Target Languages", key: "target_languages" },
            { label: "Sworn Translation Note", key: "sworn_translation_note" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Tool 7: Courier Matrix ───────────────────────────────────────────────────

function CourierTool() {
  const [country, setCountry] = useState("");
  const [urgent, setUrgent] = useState(false);
  const [signatureRequired, setSignatureRequired] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ToolResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (!country.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/tools/courier", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destination_country: country,
          urgent,
          signature_required: signatureRequired,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setResult(data as ToolResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ToolCard chip="Tool 07" title="Courier Matrix">
      <div className="space-y-2">
        <input
          className={INPUT_CLS}
          placeholder="Destination country"
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={urgent}
              onChange={(e) => setUrgent(e.target.checked)}
              className="w-3 h-3 accent-yellow-600"
            />
            <span className="text-[11px] text-white/50">Urgent</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={signatureRequired}
              onChange={(e) => setSignatureRequired(e.target.checked)}
              className="w-3 h-3 accent-yellow-600"
            />
            <span className="text-[11px] text-white/50">Signature required</span>
          </label>
        </div>
      </div>
      <CheckButton loading={loading} onClick={run} />
      {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
      {result && (
        <ResultPanel
          data={result}
          fields={[
            { label: "Destination", key: "destination_country" },
            { label: "International", key: "is_international" },
            { label: "Recommended Carriers", key: "recommended_carriers" },
            { label: "Customs Note Required", key: "customs_note_required" },
            { label: "Signature Requirement", key: "signature_requirement" },
            { label: "Courier Risk", key: "courier_risk" },
            { label: "Estimated Delivery", key: "delivery_estimate_days" },
          ]}
        />
      )}
    </ToolCard>
  );
}

// ─── Master layout ────────────────────────────────────────────────────────────

export function ExecutionToolkit() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p
          className="text-[11px] uppercase tracking-[0.25em] font-medium mb-2"
          style={{ color: "rgba(212,175,55,0.8)" }}
        >
          Operator Intelligence
        </p>
        <h1 className="font-serif text-4xl text-foreground">
          Global Execution Toolkit
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm">
          Operational reference tools for document execution routing.
          All results are guidance-only — requirements are confirmed with the
          receiving authority before submission.
        </p>
      </div>

      {/* Tool grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <HagueTool />
        <LegalizationTool />
        <EmbassyTool />
        <RONTool />
        <SignerTool />
        <TranslationTool />
        <CourierTool />
      </div>

      {/* Footer note */}
      <div
        className="flex items-start gap-2 px-4 py-3 rounded-sm border text-xs text-white/30"
        style={{ borderColor: "rgba(255,255,255,0.04)" }}
      >
        <span style={{ color: "rgba(212,175,55,0.4)" }}>·</span>
        <span>
          All toolkit outputs are for operator reference only. Receiving authority
          requirements are always verified before execution or submission.
          Nothing displayed here constitutes legal advice.
        </span>
      </div>
    </div>
  );
}
