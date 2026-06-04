"use client";

import { useState } from "react";
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
      </div>

      {packet && (
        <>
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
        </>
      )}
    </div>
  );
}
