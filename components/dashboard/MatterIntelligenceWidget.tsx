"use client";

import { useState } from "react";
import type { MatterIntelligenceResult } from "@/lib/matterIntelligence";

interface Props {
  defaultCountry?: string;
  defaultDocument?: string;
}

const MATTER_TYPES = [
  { value: "citizenship_by_descent", label: "Citizenship by Descent" },
  { value: "vital_records", label: "Vital Records" },
  { value: "power_of_attorney", label: "Power of Attorney" },
  { value: "corporate", label: "Corporate" },
  { value: "immigration", label: "Immigration" },
  { value: "academic", label: "Academic" },
  { value: "general", label: "General" },
];

const GOLD = "#C6A55A";

const label: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "10px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: GOLD,
  display: "block",
  marginBottom: "4px",
};

const inputStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(198,165,90,0.25)",
  borderRadius: "2px",
  color: "#e8e4dc",
  fontFamily: "monospace",
  fontSize: "13px",
  padding: "6px 10px",
  width: "100%",
  outline: "none",
};

const sectionTitle: React.CSSProperties = {
  fontFamily: "monospace",
  fontSize: "10px",
  letterSpacing: "0.2em",
  textTransform: "uppercase" as const,
  color: GOLD,
  marginBottom: "8px",
  borderBottom: "1px solid rgba(198,165,90,0.15)",
  paddingBottom: "4px",
};

export function MatterIntelligenceWidget({
  defaultCountry = "",
  defaultDocument = "",
}: Props) {
  const [country, setCountry] = useState(defaultCountry);
  const [document, setDocument] = useState(defaultDocument);
  const [matterType, setMatterType] = useState("general");
  const [authoritySlug, setAuthoritySlug] = useState("");
  const [result, setResult] = useState<MatterIntelligenceResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFetch() {
    if (!country || !document || !matterType) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const params = new URLSearchParams({
        country,
        document,
        matter_type: matterType,
      });
      if (authoritySlug) params.set("authority", authoritySlug);

      const res = await fetch(`/api/matter-intelligence?${params.toString()}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError((body as { error?: string }).error ?? "Request failed.");
        return;
      }
      const body = (await res.json()) as { intelligence: MatterIntelligenceResult };
      setResult(body.intelligence);
    } catch {
      setError("Could not load intelligence.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: "2px",
        padding: "1.5rem",
        color: "#e8e4dc",
        fontFamily: "sans-serif",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "10px",
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: GOLD,
            marginBottom: "4px",
          }}
        >
          Matter Intelligence Core
        </p>
        <h2
          style={{
            fontFamily: "serif",
            fontSize: "20px",
            color: "#e8e4dc",
            margin: 0,
            fontWeight: "normal",
          }}
        >
          Execution Intelligence
        </h2>
      </div>

      {/* Form */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: "12px",
          marginBottom: "12px",
        }}
      >
        <div>
          <span style={label}>Country slug</span>
          <input
            style={inputStyle}
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            placeholder="e.g. italy"
          />
        </div>
        <div>
          <span style={label}>Document slug</span>
          <input
            style={inputStyle}
            value={document}
            onChange={(e) => setDocument(e.target.value)}
            placeholder="e.g. birth-certificate"
          />
        </div>
        <div>
          <span style={label}>Matter type</span>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={matterType}
            onChange={(e) => setMatterType(e.target.value)}
          >
            {MATTER_TYPES.map((t) => (
              <option key={t.value} value={t.value} style={{ background: "#0d0a05" }}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <span style={label}>Authority slug (optional)</span>
          <input
            style={inputStyle}
            value={authoritySlug}
            onChange={(e) => setAuthoritySlug(e.target.value)}
            placeholder="e.g. comune-di-roma"
          />
        </div>
      </div>

      <button
        onClick={handleFetch}
        disabled={loading || !country || !document}
        style={{
          background: "transparent",
          border: `1px solid ${GOLD}`,
          color: GOLD,
          fontFamily: "monospace",
          fontSize: "11px",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          padding: "8px 20px",
          borderRadius: "2px",
          cursor: loading ? "wait" : "pointer",
          opacity: !country || !document ? 0.4 : 1,
          marginBottom: "1.5rem",
        }}
      >
        {loading ? "Loading..." : "Run Intelligence"}
      </button>

      {error && (
        <p style={{ color: "#e05a5a", fontFamily: "monospace", fontSize: "12px" }}>
          {error}
        </p>
      )}

      {result && <IntelligenceResult result={result} />}
    </div>
  );
}

function IntelligenceResult({ result }: { result: MatterIntelligenceResult }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
      {/* Identity + corridor */}
      <div>
        <p style={sectionTitle}>Corridor</p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "15px", color: "#e8e4dc" }}>
            {result.country_name} / {result.document_name}
          </span>
          <CorridorBadge type={result.corridor_type} />
          <DerivedBadge isDerived={result.is_derived} />
        </div>
      </div>

      {/* Operator summary */}
      <div>
        <p style={sectionTitle}>Operator Summary</p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "12px",
            color: "#b8b0a0",
            lineHeight: 1.6,
            margin: 0,
          }}
        >
          {result.operator_summary}
        </p>
      </div>

      {/* Next operator action */}
      <div>
        <p style={sectionTitle}>Next Action — Operator</p>
        <p
          style={{
            fontFamily: "monospace",
            fontSize: "13px",
            color: GOLD,
            fontWeight: "bold",
            margin: 0,
          }}
        >
          {result.next_action_operator}
        </p>
      </div>

      {/* Execution path */}
      {result.execution_path.length > 0 && (
        <div>
          <p style={sectionTitle}>Execution Path</p>
          <ol style={{ margin: 0, padding: "0 0 0 20px" }}>
            {result.execution_path.map((step, i) => (
              <li
                key={i}
                style={{
                  fontFamily: "monospace",
                  fontSize: "12px",
                  color: "#c8c0b0",
                  marginBottom: "4px",
                }}
              >
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Required items */}
      {result.required_items.length > 0 && (
        <div>
          <p style={sectionTitle}>Required Items</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            {result.required_items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "13px",
                    color:
                      item.status === "provided"
                        ? "#6abf69"
                        : item.status === "missing"
                          ? "#e05a5a"
                          : "#888",
                  }}
                >
                  {item.status === "provided" ? "✓" : item.status === "missing" ? "✗" : "?"}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "12px",
                    color: item.status === "missing" ? "#e05a5a" : "#c8c0b0",
                  }}
                >
                  {item.item}
                </span>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "10px",
                    color: "#666",
                    letterSpacing: "0.1em",
                  }}
                >
                  {item.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Authority chain */}
      {result.authority_chain && result.authority_chain.status !== "NO_CHAIN" && (
        <div>
          <p style={sectionTitle}>Authority Chain</p>
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
            <span
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                padding: "2px 8px",
                border: "1px solid rgba(198,165,90,0.3)",
                borderRadius: "2px",
                color: GOLD,
              }}
            >
              {result.authority_chain.status}
            </span>
            <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#888" }}>
              {result.authority_chain.chain_length} node
              {result.authority_chain.chain_length !== 1 ? "s" : ""}
            </span>
            {result.authority_chain.bottleneck_authority && (
              <span style={{ fontFamily: "monospace", fontSize: "11px", color: "#e05a5a" }}>
                Bottleneck: {result.authority_chain.bottleneck_authority}
              </span>
            )}
          </div>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "11px",
              color: "#888",
              marginTop: "6px",
              marginBottom: 0,
            }}
          >
            {result.authority_chain.operator_summary}
          </p>
        </div>
      )}

      {/* Timeline */}
      {result.estimated_timeline_days !== null && (
        <div>
          <p style={sectionTitle}>Timeline Estimate</p>
          <p
            style={{
              fontFamily: "monospace",
              fontSize: "13px",
              color: "#e8e4dc",
              margin: 0,
            }}
          >
            ~{result.estimated_timeline_days} days
            {result.timeline_note && (
              <span style={{ color: "#888", marginLeft: "8px", fontSize: "11px" }}>
                ({result.timeline_note})
              </span>
            )}
          </p>
        </div>
      )}
    </div>
  );
}

function CorridorBadge({ type }: { type: "hague" | "consular" | "unknown" }) {
  const colors: Record<string, string> = {
    hague: "#6abf69",
    consular: "#e0a85a",
    unknown: "#888",
  };
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "10px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        padding: "2px 7px",
        border: `1px solid ${colors[type] ?? "#888"}`,
        borderRadius: "2px",
        color: colors[type] ?? "#888",
      }}
    >
      {type === "hague" ? "Hague" : type === "consular" ? "Consular" : "Unknown Corridor"}
    </span>
  );
}

function DerivedBadge({ isDerived }: { isDerived: boolean }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: "10px",
        letterSpacing: "0.15em",
        textTransform: "uppercase",
        padding: "2px 7px",
        border: isDerived
          ? "1px solid rgba(224,90,90,0.4)"
          : "1px solid rgba(106,191,105,0.4)",
        borderRadius: "2px",
        color: isDerived ? "#e05a5a" : "#6abf69",
      }}
    >
      {isDerived ? "Derived" : "Authority-Sourced"}
    </span>
  );
}
