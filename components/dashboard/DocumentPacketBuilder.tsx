"use client";

import { useState } from "react";
import { listPackets, getPacket, type DocumentPacket } from "@/lib/intelligence/packetBuilder";

const packets = listPackets();

export function DocumentPacketBuilder() {
  const [selectedId, setSelectedId] = useState(packets[0]?.id ?? "");
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});
  const [checkedRelease, setCheckedRelease] = useState<Record<string, boolean>>({});

  const packet: DocumentPacket | undefined = getPacket(selectedId);

  const toggleDoc = (key: string) => setCheckedDocs(p => ({ ...p, [key]: !p[key] }));
  const toggleRelease = (key: string) => setCheckedRelease(p => ({ ...p, [key]: !p[key] }));

  const inputStyle = {
    background: "rgba(212,175,55,0.07)",
    border: "1px solid rgba(212,175,55,0.2)",
    color: "rgba(255,255,255,0.85)",
    fontFamily: "monospace",
    fontSize: "11px",
    padding: "6px 10px",
    borderRadius: "6px",
    outline: "none",
    width: "100%",
  } as React.CSSProperties;

  const Section = ({ title, items, checked, toggle }: { title: string; items: string[]; checked?: Record<string, boolean>; toggle?: (k: string) => void }) => (
    <div className="space-y-1.5">
      <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>{title}</p>
      {items.map((item, i) => (
        <div key={i} className="flex items-start gap-2">
          {toggle && (
            <input
              type="checkbox"
              checked={!!checked?.[item]}
              onChange={() => toggle(item)}
              className="mt-0.5"
              style={{ accentColor: "#D4AF37" }}
            />
          )}
          <span className="font-mono text-[10px]" style={{ color: toggle ? (checked?.[item] ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.75)") : "rgba(255,255,255,0.7)" }}>
            {toggle && checked?.[item] ? <s>{item}</s> : item}
          </span>
        </div>
      ))}
    </div>
  );

  return (
    <div data-critical-card="" className="rounded-lg p-4 space-y-4" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.6)" }}>
          Document Packet Builder
        </p>
        <button
          onClick={() => window.print()}
          className="font-mono text-[9px] px-3 py-1 rounded tracking-widest uppercase"
          style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.25)", color: "#D4AF37", cursor: "pointer" }}
        >
          Print
        </button>
      </div>

      <div className="space-y-1">
        <label className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>Matter Type</label>
        <select value={selectedId} onChange={e => { setSelectedId(e.target.value); setCheckedDocs({}); setCheckedRelease({}); }} style={inputStyle}>
          {packets.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
        </select>
      </div>

      {packet && (
        <>
          <p className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>{packet.description}</p>

          <Section title="Required Documents" items={packet.requiredDocuments} checked={checkedDocs} toggle={toggleDoc} />
          <Section title="Signer Requirements" items={packet.signerRequirements} />
          <Section title="Certificate Requirements" items={packet.certificateRequirements} />

          <div className="rounded p-2.5" style={{ background: "rgba(212,175,55,0.05)", border: "1px solid rgba(212,175,55,0.15)" }}>
            <p className="font-mono text-[9px] tracking-widest uppercase mb-1" style={{ color: "rgba(212,175,55,0.5)" }}>Apostille Path</p>
            <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.7)" }}>{packet.apostillePath}</p>
          </div>

          {packet.translationRequired && (
            <div className="rounded p-2 flex items-center gap-2" style={{ background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.2)" }}>
              <span className="text-[10px]">⚠</span>
              <span className="font-mono text-[10px]" style={{ color: "#f59e0b" }}>Translation required</span>
            </div>
          )}

          <div className="space-y-1">
            <p className="font-mono text-[9px] tracking-widest uppercase" style={{ color: "rgba(212,175,55,0.5)" }}>Courier Note</p>
            <p className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.6)" }}>{packet.courierNote}</p>
          </div>

          <Section title="Release Checklist" items={packet.releaseChecklist} checked={checkedRelease} toggle={toggleRelease} />
        </>
      )}
    </div>
  );
}
