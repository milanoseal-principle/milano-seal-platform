"use client";

import { useState } from "react";
import { Card, SectionHeader, Select, Input, GoldBtn, GhostBtn, Badge } from "./SalesLabShared";
import { PLATFORMS, LEAD_SOURCES, LEAD_STATUSES } from "./constants";
import type { Lead, LeadStatus, LeadScoreOutput } from "./types";

const scoreTone = (s: number) => (s >= 75 ? "green" : s >= 50 ? "gold" : "gray");

export function LeadCapture({ leads, setLeads }: { leads: Lead[]; setLeads: (l: Lead[]) => void }) {
  const [filter, setFilter] = useState<"all" | LeadStatus>("all");
  const [form, setForm] = useState({ name: "", email: "", platform: PLATFORMS[0], source: LEAD_SOURCES[0], message: "" });
  const [scoring, setScoring] = useState(false);

  async function addLead() {
    if (!form.name.trim()) return;
    setScoring(true);
    let scored: LeadScoreOutput = { score: 50, reasoning: "", priority: "medium" };
    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "lead_score", lead: form }),
      });
      const json = await res.json();
      scored = json.output as LeadScoreOutput;
    } finally {
      setScoring(false);
    }
    const lead: Lead = {
      id: `lead-${leads.length + 1}-${form.email || form.name}`,
      name: form.name, email: form.email, platform: form.platform, source: form.source, message: form.message,
      score: scored.score, reasoning: scored.reasoning, status: "new",
      created: new Date().toISOString().slice(0, 10), demo: true,
    };
    setLeads([lead, ...leads]);
    setForm({ name: "", email: "", platform: PLATFORMS[0], source: LEAD_SOURCES[0], message: "" });
  }

  const setStatus = (id: string, status: LeadStatus) => setLeads(leads.map((l) => (l.id === id ? { ...l, status } : l)));
  const shown = filter === "all" ? leads : leads.filter((l) => l.status === filter);

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <SectionHeader title="Add Lead" subtitle="Scored via server AI (fallback if key absent)." />
        <div className="space-y-2.5">
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name" />
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <Select value={form.platform} onChange={(e) => setForm({ ...form, platform: e.target.value as typeof form.platform })}>
            {PLATFORMS.map((p) => <option key={p}>{p}</option>)}
          </Select>
          <Select value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value as typeof form.source })}>
            {LEAD_SOURCES.map((s) => <option key={s}>{s}</option>)}
          </Select>
          <Input value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="Message / matter note" />
          <GoldBtn onClick={addLead} disabled={scoring}>{scoring ? "Scoring…" : "Add & Score"}</GoldBtn>
        </div>
      </Card>

      <div>
        <div className="mb-3 flex flex-wrap gap-2">
          {(["all", ...LEAD_STATUSES] as const).map((f) => (
            <GhostBtn key={f} onClick={() => setFilter(f)}>{f}</GhostBtn>
          ))}
        </div>
        <div className="space-y-2.5">
          {shown.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-[#E8E4DC]">{l.name}</p>
                    <Badge tone={scoreTone(l.score)}>Score {l.score}</Badge>
                    {l.demo && <Badge tone="gray">demo</Badge>}
                  </div>
                  <p className="mt-1 text-[12px] text-[#8A8A8A]">{l.platform} · {l.source} · {l.created}</p>
                  <p className="mt-1 text-[12.5px] text-[#E8E4DC]/80">{l.message}</p>
                </div>
                <Select value={l.status} onChange={(e) => setStatus(l.id, e.target.value as LeadStatus)} className="w-32 shrink-0">
                  {LEAD_STATUSES.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </div>
            </Card>
          ))}
          {!shown.length && <Card><p className="text-[12px] text-[#8A8A8A]">No leads in this view.</p></Card>}
        </div>
      </div>
    </div>
  );
}
