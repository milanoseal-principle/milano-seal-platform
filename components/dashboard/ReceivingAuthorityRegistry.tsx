"use client";

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
          ))}
        </div>
      )}
    </div>
  );
}
