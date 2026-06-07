"use client";

import { useState } from "react";
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
    </div>
  );
}
