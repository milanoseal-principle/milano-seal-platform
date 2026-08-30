import type { Metadata } from 'next';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { createAdminClient } from '@/lib/supabase/admin';
import { ReviewQueueClient } from '@/components/dashboard/ReviewQueueClient';

export const metadata: Metadata = { title: 'Milano Review Queue — The Milano Seal™', robots: { index: false, follow: false } };

export default async function ReviewRequestsPage() {
  await requireDashboardAccess();
  const admin = createAdminClient();
  const { data } = await admin.from('review_requests')
    .select('id, matter_id, country, document_type, question, status, operator_response, created_at')
    .order('created_at', { ascending: false }).limit(250);
  return <main className="mx-auto max-w-6xl p-6">
    <div className="mb-6"><p className="font-mono text-xs uppercase tracking-[0.2em] text-amber-500">Human Review Control Plane</p><h1 className="mt-2 text-2xl font-semibold text-white">Milano Execution Desk Review Queue</h1><p className="mt-2 max-w-3xl text-sm text-zinc-400">Evidence-backed human handoff only. Operator presence and acknowledgement are never fabricated.</p></div>
    <ReviewQueueClient initialReviews={(data ?? []) as never} />
  </main>;
}
