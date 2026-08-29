import type { SeoEvidenceRecord } from "@/lib/seo/evidence/types";
export function SourceNote({ evidence }: { evidence: SeoEvidenceRecord[] }) {
  const latest = evidence.map((item) => item.verifiedAt).sort().at(-1);
  return <aside className="border-t border-white/10 pt-6 text-xs leading-6 text-zinc-500"><p className="uppercase tracking-[0.22em] text-zinc-400">Source posture</p><p>Route intelligence reviewed against official authority sources. Final receiving requirements remain matter-specific. Last reviewed: {latest ?? "Review required"}.</p><ul className="mt-2">{evidence.map((item) => <li key={item.id}><a className="text-[#C6A55A] hover:underline" href={item.sourceUrl} rel="noreferrer" target="_blank">{item.sourceTitle}</a></li>)}</ul></aside>;
}
