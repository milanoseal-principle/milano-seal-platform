"use client";
import { useState } from 'react';

import { Card, SectionHeader, Select, Input, GoldBtn, GhostBtn, Notify, Badge } from "./SalesLabShared";
import { DM_TRIGGERS } from "./constants";
import type { DMOutput } from "./types";

export function DMBuilder() {
  const [trigger, setTrigger] = useState(DM_TRIGGERS[0]);
  const [context, setContext] = useState("");
  const [out, setOut] = useState<DMOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<string>("");
  const [copied, setCopied] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "dm", trigger, context }),
      });
      const json = await res.json();
      setOut(json.output as DMOutput);
      setSource(json.source ?? "");
    } finally {
      setLoading(false);
    }
  }
  const copy = async (k: string, v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {}
  };

  const panels: { k: keyof DMOutput; label: string }[] = [
    { k: "full_message", label: "Full Message" },
    { k: "opener", label: "Opener" },
    { k: "authority", label: "Authority Line" },
    { k: "pivot", label: "Soft Pivot" },
    { k: "followup", label: "48h Follow-Up" },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <SectionHeader title="DM Builder" subtitle="Draft outreach in the Milano Seal liaison voice." />
        <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#8A8A8A]">Trigger</label>
        <Select value={trigger} onChange={(e) => setTrigger(e.target.value)}>
          {DM_TRIGGERS.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <label className="mb-1 mt-3 block text-[11px] uppercase tracking-[0.14em] text-[#8A8A8A]">Context</label>
        <Input value={context} onChange={(e) => setContext(e.target.value)} placeholder="e.g. Italian citizenship POA, needs apostille" />
        <div className="mt-4">
          <GoldBtn onClick={generate} disabled={loading}>{loading ? "Drafting…" : "Generate DM"}</GoldBtn>
        </div>
        <p className="mt-3 text-[10px] text-[#8A8A8A]">No legal advice, no guaranteed acceptance, no government-affiliation claims.</p>
      </Card>

      <div className="space-y-3">
        {!out && <Card><Notify message="Generate a draft to see output panels." /></Card>}
        {out && (
          <>
            {source && <Badge tone={source === "anthropic" ? "green" : "gray"}>{source === "anthropic" ? "AI draft" : "Fallback draft"}</Badge>}
            {panels.map((p) => (
              <Card key={p.k}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]">{p.label}</span>
                  <GhostBtn onClick={() => copy(p.k, out[p.k] as string)}>{copied === p.k ? "Copied" : "Copy"}</GhostBtn>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#E8E4DC]/90">{out[p.k] as string}</p>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
