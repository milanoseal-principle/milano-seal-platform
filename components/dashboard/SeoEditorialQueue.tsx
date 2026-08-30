"use client";
import { useEffect, useState } from "react";

type Row = { countrySlug: string; documentSlug: string; primaryQuery: string; indexStatus: string; evidenceIds: string[]; editorialReview?: { status: string; reviewed_at: string | null } | null };

export function SeoEditorialQueue() {
  const [rows, setRows] = useState<Row[]>([]);
  const [failed, setFailed] = useState(false);
  useEffect(() => { void fetch("/api/admin/seo/editorial", { cache: "no-store" }).then(async (response) => { if (!response.ok) throw new Error(); setRows((await response.json() as { records: Row[] }).records); }).catch(() => setFailed(true)); }, []);
  return <section className="space-y-5"><div><p className="font-mono text-[9px] uppercase tracking-[0.3em] text-[#C6A55A]/60">SEO Authority Review</p><h1 className="mt-2 font-serif text-3xl text-white">Editorial certification queue</h1><p className="mt-2 text-sm text-white/40">Unreviewed routes remain NOINDEX. Search and revenue signals never override evidence failure.</p></div>{failed ? <p className="text-red-300">Editorial review data unavailable.</p> : <div className="grid gap-3">{rows.map((row) => <article className="grid gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4 md:grid-cols-[1fr_1fr_2fr_auto]" key={`${row.countrySlug}:${row.documentSlug}`}><div><p className="text-xs text-white/30">COUNTRY</p><p className="mt-1 text-white">{row.countrySlug}</p></div><div><p className="text-xs text-white/30">DOCUMENT</p><p className="mt-1 text-white">{row.documentSlug}</p></div><div><p className="text-xs text-white/30">PRIMARY QUERY</p><p className="mt-1 text-white/65">{row.primaryQuery}</p><p className="mt-2 text-xs text-white/30">Evidence: {row.evidenceIds.length} required · Search Console: governed separately · Paid Matter: canonical reporting only</p></div><div className="flex items-center gap-2"><span className="rounded-full border border-amber-500/20 px-2 py-1 text-[10px] text-amber-300">{row.editorialReview?.status ?? "REVIEW_REQUIRED"}</span><span className="rounded-full border border-white/10 px-2 py-1 text-[10px] text-white/45">{row.indexStatus}</span></div></article>)}</div>}</section>;
}
