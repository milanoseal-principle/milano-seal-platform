"use client";

<<<<<<< HEAD
import { useEffect, useState, useCallback } from "react";

interface Authority {
  id: string;
  authority_name: string;
  authority_type: string;
  country: string;
  city?: string | null;
  address?: string | null;
  accepted_document_types?: string[] | null;
  language_requirements?: string[] | null;
  apostille_required?: boolean | null;
  legalization_required?: boolean | null;
  translation_required?: boolean | null;
  document_age_limit_days?: number | null;
  ron_accepted?: string | null;
  rejection_triggers?: string[] | null;
  source_url?: string | null;
  source_type?: string | null;
  confidence_level?: string | null;
  last_verified_at?: string | null;
  verified_by?: string | null;
  stale_after_days?: number | null;
  manual_review_required?: boolean | null;
  routing_status?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

const ROUTING_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  ACTIVE:        { bg: "rgba(74,158,107,0.1)",  text: "#4a9e6b", border: "rgba(74,158,107,0.3)"  },
  MANUAL_REVIEW: { bg: "rgba(245,158,11,0.1)",  text: "#f59e0b", border: "rgba(245,158,11,0.3)"  },
  UNKNOWN:       { bg: "rgba(100,116,139,0.1)", text: "#94a3b8", border: "rgba(100,116,139,0.3)" },
  SUSPENDED:     { bg: "rgba(239,68,68,0.1)",   text: "#ef4444", border: "rgba(239,68,68,0.3)"   },
};

const CONFIDENCE_COLORS: Record<string, { text: string }> = {
  HIGH:       { text: "#4a9e6b" },
  MEDIUM:     { text: "#C6A55A" },
  LOW:        { text: "#f59e0b" },
  UNVERIFIED: { text: "#94a3b8" },
};

const AUTHORITY_TYPES = [
  "apostille", "consulate", "embassy", "court", "university",
  "bank", "registry", "immigration", "corporate_registry", "foreign_counsel",
];

const ROUTING_STATUSES = ["ACTIVE", "MANUAL_REVIEW", "UNKNOWN", "SUSPENDED"];

function Badge({
  label,
  colorScheme,
}: {
  label: string;
  colorScheme: { bg: string; text: string; border: string };
}) {
  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: "monospace",
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        padding: "2px 8px",
        borderRadius: 99,
        background: colorScheme.bg,
        color: colorScheme.text,
        border: `1px solid ${colorScheme.border}`,
      }}
    >
      {label}
    </span>
  );
}

function Indicator({ label, value }: { label: string; value: boolean | null | undefined }) {
  const color = value === true ? "#4a9e6b" : value === false ? "#94a3b8" : "#94a3b8";
  const icon = value === true ? "✓" : "—";
  return (
    <span style={{ fontSize: 10, color, marginRight: 8 }}>
      {icon} {label}
    </span>
  );
}

function AuthorityCard({
  authority,
  onUpdated,
}: {
  authority: Authority;
  onUpdated: () => void;
}) {
  const [expanded, setExpanded] = useState(false);

  const routingColors =
    ROUTING_COLORS[authority.routing_status ?? "UNKNOWN"] ?? ROUTING_COLORS.UNKNOWN;
  const confidenceColor =
    CONFIDENCE_COLORS[authority.confidence_level ?? "UNVERIFIED"] ??
    CONFIDENCE_COLORS.UNVERIFIED;

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(198,165,90,0.1)",
        borderRadius: 6,
        padding: "16px 18px",
        cursor: "pointer",
        transition: "border-color 0.2s",
      }}
      onClick={() => setExpanded((v) => !v)}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(198,165,90,0.25)")
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLDivElement).style.borderColor =
          "rgba(198,165,90,0.1)")
      }
    >
      {/* Card header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              marginBottom: 3,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {authority.authority_name}
          </div>
          <div
            style={{
              fontSize: 10,
              color: "rgba(255,255,255,0.4)",
              fontFamily: "monospace",
            }}
          >
            {authority.country}
            {authority.city ? ` · ${authority.city}` : ""}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
          <Badge
            label={authority.routing_status ?? "UNKNOWN"}
            colorScheme={routingColors}
          />
          <span
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              textTransform: "uppercase",
              color: confidenceColor.text,
            }}
          >
            {authority.confidence_level ?? "UNVERIFIED"}
          </span>
        </div>
      </div>

      {/* Type + indicators row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: "monospace",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "rgba(198,165,90,0.6)",
            padding: "1px 7px",
            border: "1px solid rgba(198,165,90,0.15)",
            borderRadius: 3,
          }}
        >
          {authority.authority_type}
        </span>
        <Indicator label="Apostille" value={authority.apostille_required} />
        <Indicator label="RON" value={authority.ron_accepted === "yes"} />
      </div>

      {/* Expanded details */}
      {expanded && (
        <div
          style={{
            marginTop: 16,
            borderTop: "1px solid rgba(255,255,255,0.06)",
            paddingTop: 14,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "8px 16px",
              marginBottom: 12,
            }}
          >
            {[
              ["Legalization Required", authority.legalization_required ? "Yes" : "No"],
              ["Translation Required", authority.translation_required ? "Yes" : "No"],
              ["RON Accepted", authority.ron_accepted ?? "Unknown"],
              ["Source Type", authority.source_type ?? "—"],
              ["Stale After", authority.stale_after_days ? `${authority.stale_after_days} days` : "—"],
              ["Manual Review", authority.manual_review_required ? "Yes" : "No"],
              ["Last Verified", authority.last_verified_at ? new Date(authority.last_verified_at).toLocaleDateString() : "—"],
              ["Verified By", authority.verified_by ?? "—"],
            ].map(([label, value]) => (
              <div key={label as string}>
                <div
                  style={{
                    fontSize: 8,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.25)",
                    marginBottom: 2,
                  }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.65)" }}>
                  {value as string}
                </div>
              </div>
            ))}
          </div>

          {authority.accepted_document_types?.length ? (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 4,
                }}
              >
                Accepted Document Types
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {authority.accepted_document_types.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: 9,
                      fontFamily: "monospace",
                      color: "rgba(198,165,90,0.7)",
                      background: "rgba(198,165,90,0.06)",
                      border: "1px solid rgba(198,165,90,0.12)",
                      borderRadius: 3,
                      padding: "2px 6px",
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {authority.language_requirements?.length ? (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 4,
                }}
              >
                Language Requirements
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>
                {authority.language_requirements.join(", ")}
              </div>
            </div>
          ) : null}

          {authority.rejection_triggers?.length ? (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 4,
                }}
              >
                Rejection Triggers
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                {authority.rejection_triggers.map((t) => (
                  <div
                    key={t}
                    style={{
                      fontSize: 10,
                      color: "#f59e0b",
                      padding: "2px 0",
                    }}
                  >
                    ⚠ {t}
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {authority.source_url && (
            <div style={{ marginBottom: 10 }}>
              <div
                style={{
                  fontSize: 8,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.25)",
                  marginBottom: 2,
                }}
              >
                Source
              </div>
              <a
                href={authority.source_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 11, color: "#C6A55A", textDecoration: "underline" }}
                onClick={(e) => e.stopPropagation()}
              >
                {authority.source_url}
              </a>
            </div>
          )}

          <p
            style={{
              fontSize: 9,
              color: "rgba(255,255,255,0.2)",
              marginTop: 10,
              fontStyle: "italic",
            }}
          >
            Requirements subject to change. Confirm at intake.
          </p>
        </div>
      )}

      {!expanded && (
        <p
          style={{
            fontSize: 9,
            color: "rgba(255,255,255,0.18)",
            marginTop: 10,
            marginBottom: 0,
            fontStyle: "italic",
          }}
        >
          Requirements subject to change. Confirm at intake.
        </p>
      )}
    </div>
  );
}

interface AddFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

function AddAuthorityForm({ onSaved, onCancel }: AddFormProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    authority_name: "",
    authority_type: "apostille",
    country: "",
    city: "",
    apostille_required: false,
    legalization_required: false,
    translation_required: false,
    ron_accepted: "unknown",
    routing_status: "UNKNOWN",
    confidence_level: "UNVERIFIED",
    source_type: "manual",
  });

  const set = (k: string, v: unknown) =>
    setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.authority_name.trim() || !form.country.trim()) {
      setError("Authority name and country are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/dashboard/receiving-authorities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Failed to save.");
        return;
      }
      onSaved();
    } catch {
      setError("Network error.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(198,165,90,0.15)",
    borderRadius: 4,
    padding: "7px 10px",
    fontSize: 12,
    color: "rgba(255,255,255,0.85)",
    outline: "none",
    fontFamily: "monospace",
  };

  const labelStyle = {
    fontSize: 9,
    letterSpacing: "0.14em",
    textTransform: "uppercase" as const,
    color: "rgba(255,255,255,0.3)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: "1px solid rgba(198,165,90,0.2)",
        borderRadius: 6,
        padding: "20px 22px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 11,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color: "#C6A55A",
          marginBottom: 16,
          fontFamily: "monospace",
        }}
      >
        Add Receiving Authority
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={labelStyle}>Authority Name *</label>
          <input
            style={inputStyle}
            value={form.authority_name}
            onChange={(e) => set("authority_name", e.target.value)}
            placeholder="e.g. Florida Secretary of State"
          />
        </div>
        <div>
          <label style={labelStyle}>Country *</label>
          <input
            style={inputStyle}
            value={form.country}
            onChange={(e) => set("country", e.target.value)}
            placeholder="e.g. United States"
          />
        </div>
        <div>
          <label style={labelStyle}>Authority Type *</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.authority_type}
            onChange={(e) => set("authority_type", e.target.value)}
          >
            {AUTHORITY_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label style={labelStyle}>City</label>
          <input
            style={inputStyle}
            value={form.city}
            onChange={(e) => set("city", e.target.value)}
            placeholder="e.g. Miami"
          />
        </div>
        <div>
          <label style={labelStyle}>RON Accepted</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.ron_accepted}
            onChange={(e) => set("ron_accepted", e.target.value)}
          >
            <option value="yes">Yes</option>
            <option value="no">No</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>
        <div>
          <label style={labelStyle}>Routing Status</label>
          <select
            style={{ ...inputStyle, cursor: "pointer" }}
            value={form.routing_status}
            onChange={(e) => set("routing_status", e.target.value)}
          >
            {ROUTING_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div
        style={{ display: "flex", gap: 16, marginBottom: 12, flexWrap: "wrap" }}
      >
        {[
          ["apostille_required", "Apostille Required"],
          ["legalization_required", "Legalization Required"],
          ["translation_required", "Translation Required"],
        ].map(([key, label]) => (
          <label
            key={key}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={!!form[key as keyof typeof form]}
              onChange={(e) => set(key, e.target.checked)}
              style={{ accentColor: "#C6A55A" }}
            />
            {label}
          </label>
        ))}
      </div>

      {error && (
        <div
          style={{
            fontSize: 11,
            color: "#ef4444",
            marginBottom: 10,
          }}
        >
          {error}
        </div>
      )}

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            letterSpacing: "0.06em",
            padding: "7px 16px",
            borderRadius: 4,
            background: saving ? "rgba(198,165,90,0.3)" : "rgba(198,165,90,0.15)",
            border: "1px solid rgba(198,165,90,0.4)",
            color: "#C6A55A",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Saving…" : "Save Authority"}
        </button>
        <button
          onClick={onCancel}
          style={{
            fontSize: 11,
            fontFamily: "monospace",
            padding: "7px 14px",
            borderRadius: 4,
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.4)",
            cursor: "pointer",
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export function ReceivingAuthorityRegistry() {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  // Filters
  const [filterCountry, setFilterCountry] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filterCountry) params.set("country", filterCountry);
      if (filterType) params.set("authority_type", filterType);
      if (filterStatus) params.set("routing_status", filterStatus);
      const res = await fetch(
        `/api/dashboard/receiving-authorities?${params.toString()}`
      );
      if (!res.ok) throw new Error("Failed to load");
      const data = (await res.json()) as { authorities: Authority[] };
      setAuthorities(data.authorities ?? []);
    } catch {
      setError("Failed to load authorities.");
    } finally {
      setLoading(false);
    }
  }, [filterCountry, filterType, filterStatus]);

  useEffect(() => {
    void load();
  }, [load]);

  const inputStyle = {
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(198,165,90,0.12)",
    borderRadius: 4,
    padding: "6px 10px",
    fontSize: 11,
    color: "rgba(255,255,255,0.8)",
    outline: "none",
    fontFamily: "monospace",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0A0A0A",
        padding: "32px 40px",
        color: "rgba(255,255,255,0.75)",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 8,
          }}
        >
          Milano Seal — Operator
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <h1
            style={{
              fontSize: 20,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              margin: 0,
              letterSpacing: "-0.01em",
            }}
          >
            Receiving Authority Registry
          </h1>
          <button
            onClick={() => setShowAdd((v) => !v)}
            style={{
              fontSize: 11,
              fontFamily: "monospace",
              letterSpacing: "0.06em",
              padding: "7px 14px",
              borderRadius: 4,
              background: "rgba(198,165,90,0.1)",
              border: "1px solid rgba(198,165,90,0.3)",
              color: "#C6A55A",
              cursor: "pointer",
            }}
          >
            {showAdd ? "Cancel" : "+ Add Authority"}
          </button>
        </div>
      </div>

      {/* Add form */}
      {showAdd && (
        <AddAuthorityForm
          onSaved={() => {
            setShowAdd(false);
            void load();
          }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {/* Filter row */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 20,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <input
          style={{ ...inputStyle, minWidth: 160 }}
          placeholder="Filter by country…"
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
        />
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">All types</option>
          {AUTHORITY_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {ROUTING_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <span
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.25)",
            fontFamily: "monospace",
          }}
        >
          {loading ? "Loading…" : `${authorities.length} result${authorities.length !== 1 ? "s" : ""}`}
        </span>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            color: "#ef4444",
            fontSize: 12,
            marginBottom: 16,
            padding: "10px 14px",
            background: "rgba(239,68,68,0.07)",
            border: "1px solid rgba(239,68,68,0.2)",
            borderRadius: 4,
          }}
        >
          {error}
        </div>
      )}

      {/* Grid */}
      {!loading && authorities.length === 0 && !error ? (
        <div
          style={{
            textAlign: "center",
            color: "rgba(255,255,255,0.25)",
            padding: "60px 0",
            fontSize: 13,
          }}
        >
          No authorities found. Adjust filters or add one above.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 12,
          }}
        >
          {authorities.map((a) => (
            <AuthorityCard key={a.id} authority={a} onUpdated={load} />
=======
import { useEffect, useState } from "react";

interface Authority {
  id: string;
  name: string;
  country: string;
  accepted_documents?: string[];
  language_rules?: string;
  apostille_required?: boolean;
  legalization_required?: boolean;
  translation_required?: boolean;
  ron_accepted?: boolean;
  confidence_level?: "high" | "medium" | "low";
}

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

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

export function ReceivingAuthorityRegistry() {
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [countryFilter, setCountryFilter] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newAuth, setNewAuth] = useState({ name: "", country: "" });

  useEffect(() => {
    fetch("/api/dashboard/receiving-authorities")
      .then(r => r.json())
      .then(data => { setAuthorities(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const countries = Array.from(new Set(authorities.map(a => a.country))).sort();

  const filtered = authorities.filter(a => {
    const matchSearch = !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.country.toLowerCase().includes(search.toLowerCase());
    const matchCountry = !countryFilter || a.country === countryFilter;
    return matchSearch && matchCountry;
  });

  const Flag = ({ val }: { val?: boolean }) => (
    <span className="font-mono text-[9px]" style={{ color: val ? "#22c55e" : "rgba(255,255,255,0.25)" }}>
      {val ? "YES" : "NO"}
    </span>
  );

  return (
    <div className="rounded-lg p-4 space-y-4" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
          Receiving Authority Registry
        </p>
        <button
          onClick={() => setShowAdd(s => !s)}
          className="font-mono text-[9px] px-3 py-1 rounded tracking-widest uppercase"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37", cursor: "pointer" }}
        >
          + Add
        </button>
      </div>

      <div className="flex gap-2">
        <input
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ ...inputStyle, flex: 1 }}
        />
        <select value={countryFilter} onChange={e => setCountryFilter(e.target.value)} style={inputStyle}>
          <option value="">All countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {showAdd && (
        <div className="rounded p-3 space-y-2" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.2)" }}>
          <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>New Authority</p>
          <input placeholder="Name" value={newAuth.name} onChange={e => setNewAuth(p => ({ ...p, name: e.target.value }))} style={{ ...inputStyle, width: "100%" }} />
          <input placeholder="Country" value={newAuth.country} onChange={e => setNewAuth(p => ({ ...p, country: e.target.value }))} style={{ ...inputStyle, width: "100%" }} />
          <button
            className="font-mono text-[9px] px-3 py-1 rounded tracking-widest uppercase"
            style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#D4AF37", cursor: "pointer" }}
            onClick={() => {
              if (newAuth.name && newAuth.country) {
                setAuthorities(p => [...p, { id: Date.now().toString(), ...newAuth }]);
                setNewAuth({ name: "", country: "" });
                setShowAdd(false);
              }
            }}
          >
            Save
          </button>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-10 rounded animate-pulse" style={{ background: "rgba(212,175,55,0.05)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>No authorities found.</p>
      ) : (
        <div className="space-y-1">
          {filtered.map(a => (
            <div key={a.id} className="rounded overflow-hidden" style={{ border: "1px solid rgba(212,175,55,0.1)" }}>
              <button
                onClick={() => setExpanded(e => e === a.id ? null : a.id)}
                className="w-full flex items-center justify-between px-3 py-2.5"
                style={{ cursor: "pointer", background: "transparent" }}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.75)" }}>{a.name}</span>
                  <span className="font-mono text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(59,130,246,0.1)", color: "#3b82f6", border: "1px solid rgba(59,130,246,0.15)" }}>{a.country}</span>
                  {a.confidence_level && (
                    <span className="font-mono text-[8px]" style={{ color: CONFIDENCE_COLOR[a.confidence_level] ?? "#94a3b8" }}>
                      {a.confidence_level.toUpperCase()}
                    </span>
                  )}
                </div>
                <span className="font-mono text-xs" style={{ color: "rgba(212,175,55,0.4)" }}>{expanded === a.id ? "▴" : "▾"}</span>
              </button>

              {expanded === a.id && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t" style={{ borderColor: "rgba(212,175,55,0.08)" }}>
                  {a.accepted_documents && a.accepted_documents.length > 0 && (
                    <div>
                      <p className="font-mono text-[8px] tracking-widest uppercase mb-1" style={{ color: "rgba(212,175,55,0.4)" }}>Accepted Documents</p>
                      {a.accepted_documents.map((d, i) => <p key={i} className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>— {d}</p>)}
                    </div>
                  )}
                  {a.language_rules && (
                    <div>
                      <p className="font-mono text-[8px] tracking-widest uppercase mb-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>Language Rules</p>
                      <p className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.55)" }}>{a.language_rules}</p>
                    </div>
                  )}
                  <div className="flex gap-4">
                    <div>
                      <p className="font-mono text-[8px] uppercase mb-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>Apostille</p>
                      <Flag val={a.apostille_required} />
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase mb-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>Legalization</p>
                      <Flag val={a.legalization_required} />
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase mb-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>Translation</p>
                      <Flag val={a.translation_required} />
                    </div>
                    <div>
                      <p className="font-mono text-[8px] uppercase mb-0.5" style={{ color: "rgba(212,175,55,0.4)" }}>RON</p>
                      <Flag val={a.ron_accepted} />
                    </div>
                  </div>
                </div>
              )}
            </div>
>>>>>>> claude/funny-maxwell-hlxQN
          ))}
        </div>
      )}
    </div>
  );
}
