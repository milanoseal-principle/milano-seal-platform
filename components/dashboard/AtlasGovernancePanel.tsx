"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ExternalLink, ChevronDown, ChevronUp, AlertTriangle, CheckCircle2, Search } from "lucide-react";
import { AtlasCountryReveal } from "@/components/animations/AtlasCountryReveal";

type CountryRow = {
  id: string;
  country_name: string;
  country_code: string | null;
  hague_member: boolean | null;
  apostille_authority: string | null;
  processing_time_days: number | null;
  notes_public: string | null;
  source_url: string | null;
  source_type: string | null;
  confidence_level: string | null;
  last_verified_at: string | null;
  verified_by: string | null;
  stale_after_days: number | null;
  manual_review_required: boolean | null;
  routing_status: string | null;
};

type AtlasData = {
  countries: CountryRow[];
  governance_columns_missing?: boolean;
};

function ConfidenceBadge({ level }: { level: string | null }) {
  const cfg: Record<string, { color: string; bg: string; border: string }> = {
    HIGH:       { color: "#3FA47A", bg: "rgba(63,164,122,0.08)",   border: "rgba(63,164,122,0.3)" },
    MEDIUM:     { color: "#C6A55A", bg: "rgba(198,165,90,0.08)",   border: "rgba(198,165,90,0.3)" },
    LOW:        { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.3)" },
    UNVERIFIED: { color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.3)" },
  };
  const key = (level ?? "UNVERIFIED").toUpperCase();
  const c = cfg[key] ?? cfg.UNVERIFIED;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
      fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", color: c.color,
    }}>
      {key}
    </span>
  );
}

function RoutingBadge({ status }: { status: string | null }) {
  const cfg: Record<string, { color: string; bg: string; border: string }> = {
    ACTIVE:        { color: "#3FA47A", bg: "rgba(63,164,122,0.08)",   border: "rgba(63,164,122,0.3)" },
    MANUAL_REVIEW: { color: "#F59E0B", bg: "rgba(245,158,11,0.08)",   border: "rgba(245,158,11,0.3)" },
    UNKNOWN:       { color: "#6B7280", bg: "rgba(107,114,128,0.08)", border: "rgba(107,114,128,0.3)" },
    SUSPENDED:     { color: "#EF4444", bg: "rgba(239,68,68,0.08)",   border: "rgba(239,68,68,0.3)" },
  };
  const key = (status ?? "UNKNOWN").toUpperCase();
  const c = cfg[key] ?? cfg.UNKNOWN;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", padding: "2px 8px",
      background: c.bg, border: `1px solid ${c.border}`, borderRadius: 4,
      fontSize: 10, fontFamily: "monospace", letterSpacing: "0.1em", color: c.color,
    }}>
      {key.replace("_", " ")}
    </span>
  );
}

export function AtlasGovernancePanel() {
  const [data, setData] = useState<AtlasData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Record<string, Partial<CountryRow>>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [bulkWorking, setBulkWorking] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard/atlas-governance");
      if (!res.ok) throw new Error("Failed to load Atlas data");
      const json: AtlasData = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = search.toLowerCase();
    if (!q) return data.countries;
    return data.countries.filter((c) =>
      c.country_name.toLowerCase().includes(q) ||
      (c.country_code ?? "").toLowerCase().includes(q)
    );
  }, [data, search]);

  async function handleSave(row: CountryRow) {
    const patch = editing[row.id];
    if (!patch) return;
    setSaving(row.id);
    try {
      const res = await fetch("/api/dashboard/atlas-governance", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: row.id, ...patch }),
      });
      if (!res.ok) throw new Error("Save failed");
      const json = await res.json();
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          countries: prev.countries.map((c) => c.id === row.id ? { ...c, ...json.country } : c),
        };
      });
      setEditing((prev) => { const n = { ...prev }; delete n[row.id]; return n; });
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  async function handleBulkManualReview() {
    if (selected.size === 0) return;
    setBulkWorking(true);
    try {
      await Promise.all(
        Array.from(selected).map((id) =>
          fetch("/api/dashboard/atlas-governance", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, manual_review_required: true }),
          })
        )
      );
      await fetchData();
      setSelected(new Set());
    } catch {
      alert("Bulk update failed for some entries");
    } finally {
      setBulkWorking(false);
    }
  }

  function patchEdit(id: string, key: string, value: unknown) {
    setEditing((prev) => ({ ...prev, [id]: { ...prev[id], [key]: value } }));
  }

  if (loading) {
    return (
      <div style={{ padding: 32, textAlign: "center", color: "#A8A29A", fontFamily: "monospace", fontSize: 12 }}>
        Loading Atlas data...
      </div>
    );
  }

  if (error && !data) {
    return <div style={{ padding: 32, color: "#EF4444", fontFamily: "monospace", fontSize: 12 }}>{error}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header */}
      <div>
        <div style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.2em", textTransform: "uppercase", color: "#A8A29A", marginBottom: 8 }}>
          / ATLAS SOURCE GOVERNANCE /
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 400, fontFamily: "var(--font-playfair, Georgia, serif)", color: "#F6F1E6", margin: 0 }}>
          Atlas Source Governance
        </h1>
      </div>

      {data?.governance_columns_missing && (
        <div style={{ padding: "12px 16px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: 6, fontSize: 12, color: "#F59E0B", fontFamily: "monospace", display: "flex", gap: 8 }}>
          <AlertTriangle size={14} style={{ flexShrink: 0, marginTop: 1 }} />
          <span>Governance columns not yet applied. Run migration 024 to enable full governance features.</span>
        </div>
      )}

      {/* Search + bulk */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", flex: 1 }}>
          <Search size={13} color="#A8A29A" style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder="Search countries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%", padding: "9px 12px 9px 32px",
              background: "#0d0d0d", border: "1px solid rgba(198,165,90,0.15)",
              borderRadius: 6, color: "#F6F1E6", fontSize: 13,
              fontFamily: "monospace", outline: "none", boxSizing: "border-box",
            }}
          />
        </div>
        {selected.size > 0 && (
          <button
            onClick={handleBulkManualReview}
            disabled={bulkWorking}
            style={{
              padding: "9px 16px", background: "rgba(245,158,11,0.08)",
              border: "1px solid rgba(245,158,11,0.3)", borderRadius: 5,
              color: "#F59E0B", fontSize: 11, fontFamily: "monospace",
              letterSpacing: "0.08em", cursor: "pointer",
            }}
          >
            {bulkWorking ? "UPDATING..." : `MARK ${selected.size} AS MANUAL REVIEW`}
          </button>
        )}
      </div>

      {/* Table */}
      <div style={{ background: "#0d0d0d", border: "1px solid rgba(198,165,90,0.1)", borderRadius: 8, overflow: "hidden" }}>
        {/* Header row */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "32px 1fr 80px 110px 110px 130px 32px",
          gap: 12, padding: "10px 16px",
          borderBottom: "1px solid rgba(198,165,90,0.1)",
          background: "rgba(198,165,90,0.03)",
        }}>
          <div />
          {["Country", "Hague", "Confidence", "Routing", "Last Verified", ""].map((h) => (
            <div key={h} style={{ fontSize: 10, fontFamily: "monospace", letterSpacing: "0.15em", color: "#A8A29A", textTransform: "uppercase" }}>
              {h}
            </div>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: 32, textAlign: "center", color: "#A8A29A", fontSize: 13 }}>
            {search ? "No matching countries." : "No countries loaded."}
          </div>
        ) : (
          filtered.map((row) => {
            const isExpanded = expandedId === row.id;
            const isSelected = selected.has(row.id);
            const editPatch = editing[row.id] ?? {};

            return (
              <div key={row.id} style={{ borderBottom: "1px solid rgba(198,165,90,0.06)" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "32px 1fr 80px 110px 110px 130px 32px",
                    gap: 12, padding: "12px 16px",
                    alignItems: "center",
                    background: isSelected ? "rgba(198,165,90,0.03)" : "transparent",
                    cursor: "pointer",
                  }}
                  onClick={() => setExpandedId(isExpanded ? null : row.id)}
                >
                  <div onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const n = new Set(prev);
                          if (e.target.checked) n.add(row.id); else n.delete(row.id);
                          return n;
                        });
                      }}
                      style={{ accentColor: "#C6A55A" }}
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, color: "#F6F1E6", fontWeight: 500 }}>
                      {row.country_name}
                    </div>
                    {row.country_code && (
                      <div style={{ fontSize: 10, color: "#A8A29A", fontFamily: "monospace", marginTop: 2 }}>
                        {row.country_code}
                      </div>
                    )}
                  </div>
                  <div>
                    {row.hague_member ? (
                      <CheckCircle2 size={14} color="#3FA47A" />
                    ) : (
                      <span style={{ fontSize: 11, color: "#6B7280", fontFamily: "monospace" }}>—</span>
                    )}
                  </div>
                  <div><ConfidenceBadge level={row.confidence_level} /></div>
                  <div><RoutingBadge status={row.routing_status} /></div>
                  <div style={{ fontSize: 11, fontFamily: "monospace", color: "#A8A29A" }}>
                    {row.last_verified_at
                      ? new Date(row.last_verified_at).toLocaleDateString()
                      : "Never"}
                    {row.manual_review_required && (
                      <div style={{ marginTop: 2 }}>
                        <span style={{ fontSize: 10, color: "#F59E0B" }}>⚑ Manual Review</span>
                      </div>
                    )}
                  </div>
                  <div style={{ color: "#A8A29A" }}>
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </div>
                </div>

                {/* Expanded detail + edit */}
                <AtlasCountryReveal
                  isVisible={isExpanded}
                  countryName={row.country_name}
                  hagueMember={row.hague_member ?? false}
                  apostilleRequired={row.apostille_authority != null ? true : null}
                  routingStatus={
                    (row.routing_status === "ACTIVE" || row.routing_status === "MANUAL_REVIEW")
                      ? row.routing_status
                      : "UNKNOWN"
                  }
                >
                  <div style={{
                    padding: "0",
                  }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", marginBottom: 6 }}>SOURCE URL</div>
                        {row.source_url ? (
                          <a href={row.source_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: "#C6A55A", display: "flex", alignItems: "center", gap: 4 }}>
                            <ExternalLink size={11} />
                            {row.source_url.length > 60 ? row.source_url.slice(0, 60) + "…" : row.source_url}
                          </a>
                        ) : (
                          <span style={{ fontSize: 12, color: "#6B7280" }}>Not set</span>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", marginBottom: 6 }}>SOURCE TYPE</div>
                        <span style={{ fontSize: 12, color: "#F6F1E6", fontFamily: "monospace" }}>{row.source_type ?? "manual"}</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", marginBottom: 6 }}>STALE AFTER</div>
                        <span style={{ fontSize: 12, color: "#F6F1E6", fontFamily: "monospace" }}>{row.stale_after_days ?? 90} days</span>
                      </div>
                      <div>
                        <div style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", marginBottom: 6 }}>APOSTILLE AUTHORITY</div>
                        <span style={{ fontSize: 12, color: "#F6F1E6" }}>{row.apostille_authority ?? "—"}</span>
                      </div>
                    </div>

                    {/* Edit form */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", display: "block", marginBottom: 5 }}>
                          SOURCE URL
                        </label>
                        <input
                          type="text"
                          defaultValue={row.source_url ?? ""}
                          onChange={(e) => patchEdit(row.id, "source_url", e.target.value)}
                          style={{
                            width: "100%", padding: "7px 10px",
                            background: "#111", border: "1px solid rgba(198,165,90,0.2)",
                            borderRadius: 4, color: "#F6F1E6", fontSize: 12,
                            fontFamily: "monospace", outline: "none", boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", display: "block", marginBottom: 5 }}>
                          CONFIDENCE LEVEL
                        </label>
                        <select
                          defaultValue={row.confidence_level ?? "UNVERIFIED"}
                          onChange={(e) => patchEdit(row.id, "confidence_level", e.target.value)}
                          style={{
                            width: "100%", padding: "7px 10px",
                            background: "#111", border: "1px solid rgba(198,165,90,0.2)",
                            borderRadius: 4, color: "#F6F1E6", fontSize: 12,
                            fontFamily: "monospace", outline: "none",
                          }}
                        >
                          {["UNVERIFIED", "LOW", "MEDIUM", "HIGH"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", display: "block", marginBottom: 5 }}>
                          ROUTING STATUS
                        </label>
                        <select
                          defaultValue={row.routing_status ?? "UNKNOWN"}
                          onChange={(e) => patchEdit(row.id, "routing_status", e.target.value)}
                          style={{
                            width: "100%", padding: "7px 10px",
                            background: "#111", border: "1px solid rgba(198,165,90,0.2)",
                            borderRadius: 4, color: "#F6F1E6", fontSize: 12,
                            fontFamily: "monospace", outline: "none",
                          }}
                        >
                          {["UNKNOWN", "ACTIVE", "MANUAL_REVIEW", "SUSPENDED"].map((v) => (
                            <option key={v} value={v}>{v}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: 10, fontFamily: "monospace", color: "#A8A29A", letterSpacing: "0.12em", display: "block", marginBottom: 5 }}>
                          MANUAL REVIEW REQUIRED
                        </label>
                        <select
                          defaultValue={row.manual_review_required ? "true" : "false"}
                          onChange={(e) => patchEdit(row.id, "manual_review_required", e.target.value === "true")}
                          style={{
                            width: "100%", padding: "7px 10px",
                            background: "#111", border: "1px solid rgba(198,165,90,0.2)",
                            borderRadius: 4, color: "#F6F1E6", fontSize: 12,
                            fontFamily: "monospace", outline: "none",
                          }}
                        >
                          <option value="false">No</option>
                          <option value="true">Yes</option>
                        </select>
                      </div>
                    </div>

                    {Object.keys(editPatch).length > 0 && (
                      <button
                        onClick={() => handleSave(row)}
                        disabled={saving === row.id}
                        style={{
                          marginTop: 14, padding: "8px 18px",
                          background: "rgba(198,165,90,0.1)",
                          border: "1px solid rgba(198,165,90,0.4)",
                          borderRadius: 5, color: "#C6A55A",
                          fontSize: 11, fontFamily: "monospace",
                          letterSpacing: "0.1em", cursor: "pointer",
                        }}
                      >
                        {saving === row.id ? "SAVING..." : "SAVE CHANGES"}
                      </button>
                    )}
                  </div>
                </AtlasCountryReveal>
              </div>
            );
          })
        )}
      </div>

      {/* Footer note */}
      <div style={{ padding: "12px 16px", background: "rgba(198,165,90,0.03)", border: "1px solid rgba(198,165,90,0.08)", borderRadius: 6 }}>
        <p style={{ fontSize: 11, color: "#A8A29A", margin: 0, fontFamily: "monospace" }}>
          Atlas claims are for reference only. All routing confirmed at intake by operator.
        </p>
      </div>
    </div>
  );
}
