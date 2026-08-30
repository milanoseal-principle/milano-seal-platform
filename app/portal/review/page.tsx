import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAllClientDeals } from '@/lib/portalAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { clientReviewLabel, type ReviewStatus } from '@/lib/review/reviewWorkflow';

export const metadata: Metadata = { title: 'Milano Review — The Milano Seal™', robots: { index: false, follow: false } };

export default async function PortalReviewPage() {
  const ctx = await getAllClientDeals();
  if (!ctx) redirect('/login');
  const admin = createAdminClient();
  const ids = ctx.deals.map((deal) => deal.id);
  const { data } = ids.length ? await admin.from('review_requests')
    .select('id, matter_id, country, document_type, question, status, operator_response, created_at, acknowledged_at, resolved_at')
    .in('matter_id', ids).order('created_at', { ascending: false }) : { data: [] };
  return <main className="mx-auto max-w-4xl p-6 text-white">
    <div className="mb-6"><p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500">Human Review</p><h1 className="mt-2 text-2xl font-semibold">Milano Review Status</h1><p className="mt-2 text-sm text-zinc-400">This page reflects persisted operator state only. It does not simulate a live operator.</p></div>
    <div className="space-y-3">{(data ?? []).map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex flex-wrap justify-between gap-3"><div className="font-mono text-[10px] text-zinc-500">{review.matter_id}</div><span className="text-xs text-amber-300">{clientReviewLabel(review.status as ReviewStatus)}</span></div>
      <p className="mt-3 text-sm text-zinc-200">{review.question}</p>
      {review.operator_response && <div className="mt-4 rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3 text-sm text-emerald-100">{review.operator_response}</div>}
    </article>)}
    {(data ?? []).length === 0 && <div className="rounded-xl border border-white/10 p-6 text-sm text-zinc-500">No Milano Review requests are linked to your Matter.</div>}</div>
  </main>;
}
