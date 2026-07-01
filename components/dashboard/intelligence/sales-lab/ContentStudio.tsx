"use client";

import { useState } from "react";
import { Card, SectionHeader, Select, Input, GoldBtn, GhostBtn, Notify, Badge } from "./SalesLabShared";
import { CONTENT_TYPES } from "./constants";
import type { ContentOutput } from "./types";

export function ContentStudio() {
  const [contentType, setContentType] = useState(CONTENT_TYPES[0]);
  const [topic, setTopic] = useState("");
  const [out, setOut] = useState<ContentOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("");
  const [copied, setCopied] = useState("");

  async function generate() {
    setLoading(true);
    try {
      const res = await fetch("/api/intelligence/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "content", contentType, topic }),
      });
      const json = await res.json();
      setOut(json.output as ContentOutput);
      setSource(json.source ?? "");
    } finally {
      setLoading(false);
    }
  }
  const copy = async (k: string, v: string) => {
    try { await navigator.clipboard.writeText(v); setCopied(k); setTimeout(() => setCopied(""), 1500); } catch {}
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
      <Card>
        <SectionHeader title="Content Studio" subtitle="Premium content prompts for international document execution." />
        <label className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#8A8A8A]">Content type</label>
        <Select value={contentType} onChange={(e) => setContentType(e.target.value)}>
          {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </Select>
        <label className="mb-1 mt-3 block text-[11px] uppercase tracking-[0.14em] text-[#8A8A8A]">Topic</label>
        <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. apostille for Italian citizenship" />
        <div className="mt-4"><GoldBtn onClick={generate} disabled={loading}>{loading ? "Drafting…" : "Generate Content"}</GoldBtn></div>
      </Card>

      <div className="space-y-3">
        {!out && <Card><Notify message="Generate to see hook, caption, CTA, and hashtags." /></Card>}
        {out && (
          <>
            {source && <Badge tone={source === "anthropic" ? "green" : "gray"}>{source === "anthropic" ? "AI draft" : "Fallback draft"}</Badge>}
            {(["hook", "caption", "cta"] as const).map((k) => (
              <Card key={k}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]">{k}</span>
                  <GhostBtn onClick={() => copy(k, out[k])}>{copied === k ? "Copied" : "Copy"}</GhostBtn>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-[#E8E4DC]/90">{out[k]}</p>
              </Card>
            ))}
            <Card>
              <div className="mb-1.5 flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#C6A55A]">Hashtags</span>
                <GhostBtn onClick={() => copy("tags", (out.hashtags ?? []).join(" "))}>{copied === "tags" ? "Copied" : "Copy"}</GhostBtn>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(out.hashtags ?? []).map((h) => <Badge key={h}>{h}</Badge>)}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
