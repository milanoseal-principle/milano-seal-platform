'use client';

import { useState } from 'react';

type Review = {
  id: string; matter_id: string | null; country: string | null; document_type: string | null;
  question: string; status: string; operator_response: string | null; created_at: string;
};

export function ReviewQueueClient({ initialReviews }: { initialReviews: Review[] }) {
  const [reviews, setReviews] = useState(initialReviews);
  const [busy, setBusy] = useState<string | null>(null);
  async function move(id: string, status: string) {
    setBusy(id);
    try {
      const response = await fetch(`/api/review-requests/${id}`, {
        method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const body = await response.json();
      if (response.ok) setReviews((items) => items.map((item) => item.id === id ? body.review : item));
    } finally { setBusy(null); }
  }
  return <div className="space-y-3">
    {reviews.length === 0 && <div className="rounded-xl border border-white/10 bg-white/[0.02] p-6 text-sm text-zinc-500">No human review requests.</div>}
    {reviews.map((review) => <article key={review.id} className="rounded-xl border border-white/10 bg-zinc-950 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><div className="font-mono text-[10px] text-amber-400">{review.matter_id ?? review.id}</div><h2 className="mt-1 text-sm font-semibold text-white">{review.country ?? 'Country pending'} · {review.document_type ?? 'Document pending'}</h2></div>
        <span className="rounded-full border border-amber-500/30 px-2 py-1 text-[10px] text-amber-300">{review.status}</span>
      </div>
      <p className="mt-3 text-sm text-zinc-300">{review.question}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {review.status === 'REQUESTED' && <button disabled={busy === review.id} onClick={() => void move(review.id,'ACKNOWLEDGED')} className="rounded border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300">Acknowledge</button>}
        {review.status === 'ACKNOWLEDGED' && <button disabled={busy === review.id} onClick={() => void move(review.id,'IN_REVIEW')} className="rounded border border-blue-500/40 px-3 py-1.5 text-xs text-blue-300">Start Review</button>}
        {review.status === 'IN_REVIEW' && <button disabled={busy === review.id} onClick={() => void move(review.id,'RESOLVED')} className="rounded border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300">Resolve</button>}
        {review.status !== 'CLOSED' && review.status !== 'RESOLVED' && <button disabled={busy === review.id} onClick={() => void move(review.id,'CLOSED')} className="rounded border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400">Close</button>}
      </div>
    </article>)}
  </div>;
}
