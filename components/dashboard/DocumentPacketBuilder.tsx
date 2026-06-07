"use client";

import { useState } from "react";
<<<<<<< HEAD
import { ChevronDown, ChevronRight, Printer } from "lucide-react";
import { listPackets, getPacket } from "@/lib/intelligence/packetBuilder";
import type { DocumentPacket, PacketRequirement } from "@/lib/intelligence/packetBuilder";

const PACKETS_LIST = listPackets();

function SectionBlock({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-[rgba(198,165,90,0.12)] rounded-md overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 bg-[#0a0a0c] hover:bg-[#0d0d10] transition-colors text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="font-mono text-xs uppercase tracking-widest text-[rgba(198,165,90,0.75)]">
          {title}
        </span>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-4 py-3 bg-[#060608] border-t border-[rgba(198,165,90,0.08)]">
          {children}
        </div>
      )}
    </div>
  );
}

function ChecklistItems({
  items,
  checkKey,
  checked,
  onToggle,
}: {
  items: PacketRequirement[];
  checkKey: string;
  checked: Set<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div className="space-y-2">
      {items.map((item) => {
        const key = `${checkKey}__${item.id}`;
        const isChecked = checked.has(key);
        return (
          <label key={item.id} className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => onToggle(key)}
              className="mt-0.5 w-4 h-4 rounded border border-[rgba(198,165,90,0.3)] bg-transparent accent-[rgba(198,165,90,0.8)] cursor-pointer flex-shrink-0"
            />
            <div className="flex flex-col gap-0.5 min-w-0">
              <span
                className={`text-sm transition-colors ${
                  isChecked ? "line-through text-muted-foreground/50" : "text-foreground"
                }`}
              >
                {item.label}
                {item.required ? (
                  <span className="ml-1 text-[10px] text-red-400/60 font-mono">required</span>
                ) : (
                  <span className="ml-1 text-[10px] text-muted-foreground/40 font-mono">optional</span>
                )}
              </span>
              {item.notes && (
                <span className="text-xs text-muted-foreground/70 italic">{item.notes}</span>
              )}
            </div>
          </label>
        );
      })}
    </div>
  );
}

export function DocumentPacketBuilder() {
  const [selectedId, setSelectedId] = useState<string>("");
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const packet: DocumentPacket | null = selectedId ? getPacket(selectedId) : null;

  function handleToggle(key: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function handlePacketChange(id: string) {
    setSelectedId(id);
    setChecked(new Set());
  }

  return (
    <div className="space-y-6">
      {/* Select */}
      <div className="flex flex-col gap-2">
        <label className="text-[11px] uppercase tracking-widest text-[rgba(198,165,90,0.7)] font-mono">
          Select Packet Type
        </label>
        <select
          value={selectedId}
          onChange={(e) => handlePacketChange(e.target.value)}
          className="w-full max-w-md bg-[#0a0a0c] border border-[rgba(198,165,90,0.25)] rounded-md px-3 py-2 text-sm text-foreground font-mono focus:outline-none focus:border-[rgba(198,165,90,0.6)] transition-colors"
        >
          <option value="">— Choose a packet type —</option>
          {PACKETS_LIST.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        {packet && (
          <p className="text-xs text-muted-foreground max-w-lg">{packet.description}</p>
        )}
=======
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
    <div className="rounded-lg p-4 space-y-4" style={{ background: "rgba(6,4,2,0.98)", border: "1px solid rgba(212,175,55,0.15)" }}>
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
>>>>>>> claude/funny-maxwell-hlxQN
      </div>

      {packet && (
        <>
<<<<<<< HEAD
          {/* Print button */}
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-mono text-muted-foreground/60 italic">
              This is a preparation guide. All routing confirmed by operator at execution.
            </p>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 text-xs font-mono text-[rgba(198,165,90,0.7)] hover:text-[rgba(198,165,90,1)] border border-[rgba(198,165,90,0.2)] hover:border-[rgba(198,165,90,0.5)] rounded px-3 py-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Print Checklist
            </button>
          </div>

          <div className="space-y-2">
            {/* Required Documents */}
            <SectionBlock title="Required Documents">
              <ChecklistItems
                items={packet.document_requirements}
                checkKey="docs"
                checked={checked}
                onToggle={handleToggle}
              />
            </SectionBlock>

            {/* Signer Requirements */}
            <SectionBlock title="Signer Requirements">
              <ChecklistItems
                items={packet.signer_requirements}
                checkKey="signers"
                checked={checked}
                onToggle={handleToggle}
              />
            </SectionBlock>

            {/* Certificate Requirements */}
            <SectionBlock title="Certificate Requirements">
              <ChecklistItems
                items={packet.certificate_requirements}
                checkKey="certs"
                checked={checked}
                onToggle={handleToggle}
              />
            </SectionBlock>

            {/* Apostille Path */}
            <SectionBlock title="Apostille Path">
              <p className="text-sm text-foreground leading-relaxed">{packet.apostille_path}</p>
            </SectionBlock>

            {/* Translation */}
            <SectionBlock title="Translation">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-mono px-2 py-0.5 rounded border ${
                      packet.translation_required
                        ? "bg-amber-950/40 border-amber-600/40 text-amber-400"
                        : "bg-[rgba(198,165,90,0.08)] border-[rgba(198,165,90,0.2)] text-[rgba(198,165,90,0.7)]"
                    }`}
                  >
                    {packet.translation_required ? "Translation Required" : "No Translation Required"}
                  </span>
                </div>
                {packet.translation_notes && (
                  <p className="text-xs text-muted-foreground">{packet.translation_notes}</p>
                )}
              </div>
            </SectionBlock>

            {/* Courier Notes */}
            <SectionBlock title="Courier Notes">
              <p className="text-sm text-foreground leading-relaxed">{packet.courier_notes}</p>
            </SectionBlock>

            {/* Release Checklist */}
            <SectionBlock title="Release Checklist">
              <ChecklistItems
                items={packet.release_checklist}
                checkKey="release"
                checked={checked}
                onToggle={handleToggle}
              />
            </SectionBlock>
          </div>
=======
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
>>>>>>> claude/funny-maxwell-hlxQN
        </>
      )}
    </div>
  );
}
