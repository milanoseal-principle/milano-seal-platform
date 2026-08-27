"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { deriveClientReturnProjection, type CompletedMatterHistory } from "@/lib/intelligence/controlCenter";

type DealRow = Record<string, unknown> & {
  id?: string;
  deal_id?: string;
  client_id?: string;
  client_email?: string;
  email?: string;
  client_name?: string;
  completed_at?: string;
  destination_country?: string;
  document_type?: string;
  referral_source?: string;
  status?: string;
};

export function ClientReturnIntelligence() {
  const [rows, setRows] = useState<DealRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const response = await fetch("/api/deals?limit=500", { cache: "no-store" });
        if (!response.ok) throw new Error(`Matter read failed (${response.status})`);
        const data = await response.json() as DealRow[];
        if (active) setRows(Array.isArray(data) ? data : []);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Unable to load client return context.");
      }
    })();
    return () => { active = false; };
  }, []);

  const projections = useMemo(() => {
    const groups = new Map<string, { label: string; history: CompletedMatterHistory[] }>();
    for (const row of rows) {
      const clientId = String(row.client_id ?? row.client_email ?? row.email ?? "").trim().toLowerCase();
      if (!clientId) continue;
      const bucket = groups.get(clientId) ?? { label: row.client_name ?? row.client_email ?? row.email ?? clientId, history: [] };
      bucket.history.push({
        matterId: String(row.id ?? row.deal_id ?? "unknown"),
        completedAt: row.completed_at ?? null,
        destinationCountry: row.destination_country ?? null,
        documentCategory: row.document_type ?? null,
        referralSource: row.referral_source ?? null,
        open: !row.completed_at && !["completed", "closed"].includes(String(row.status ?? "").toLowerCase()),
      });
      groups.set(clientId, bucket);
    }
    return [...groups.entries()].map(([clientId, value]) => ({ label: value.label, ...deriveClientReturnProjection(clientId, value.history) })).filter((item) => item.eligibleReturnContext).sort((a, b) => (b.lastCompletedAt ?? "").localeCompare(a.lastCompletedAt ?? ""));
  }, [rows]);

  return (
    <section className="mt-8 rounded-3xl border border-white/10 bg-[#0d0d0d] p-5 md:p-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-[0.18em] text-[var(--ms-gold)]">Growth · Client Return</div>
          <h2 className="mt-2 text-2xl font-semibold text-white">Completed-Matter return intelligence</h2>
          <p className="mt-2 max-w-4xl text-sm leading-6 text-white/50">Derived only from completed Matter evidence. This does not auto-contact clients, infer demand, fabricate lifetime value, or bypass a new canonical intake.</p>
        </div>
        <Link href="/intake" className="rounded-full border border-[var(--ms-gold)]/30 px-4 py-2 text-xs font-semibold text-[var(--ms-gold)]">Start governed Matter intake →</Link>
      </div>
      {error ? <div className="mt-4 text-sm text-red-200">{error}</div> : null}
      {!error ? <div className="mt-5 grid gap-3 xl:grid-cols-2">{projections.slice(0, 50).map((item) => <article key={item.clientId} className="rounded-2xl border border-white/8 bg-black/25 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div className="font-medium text-white">{item.label}</div><div className="text-xs text-[var(--ms-gold)]">{item.completedMatterCount} completed</div></div><div className="mt-3 grid gap-1 text-xs text-white/40"><div>Last completed: {item.lastCompletedAt ?? "—"}</div><div>Destinations: {item.previousDestinationCountries.join(", ") || "—"}</div><div>Documents: {item.documentCategories.join(", ") || "—"}</div><div>Prior governed source: {item.priorReferralSources.join(", ") || "—"}</div><div>Open Matter: {item.hasOpenMatter ? "YES" : "NO"}</div></div></article>)}</div> : null}
      {!error && projections.length === 0 ? <div className="mt-5 rounded-xl border border-white/8 bg-black/25 p-4 text-sm text-white/35">No completed-Matter return context is currently available from the loaded canonical Matter set.</div> : null}
    </section>
  );
}
