import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getClientStatusLabel } from '@/lib/bluenotary/status';
import { resolvePresetForDocumentType } from '@/lib/bluenotary/tags';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { RONSessionControlPanel } from '@/components/ron/RONSessionControlPanel';

export const metadata: Metadata = { title: 'RON Session — The Milano Seal™', robots: { index: false, follow: false } };

async function getSessionDetail(sessionId: string) {
  const supabase = createAdminClient();
  const { data: session } = await supabase.from('ron_sessions').select('*').eq('id', sessionId).single();
  if (!session) return null;

  const [{ data: signers }, { data: documents }, { data: auditEvents }, { data: deal }] = await Promise.all([
    supabase.from('ron_signers').select('id, signer_index, first_name, middle_name, last_name, email, phone, state, authentication_type, signing_url_released, identity_status, kba_status, biometric_status, joined_at, left_at, completed_at').eq('ron_session_id', sessionId).order('signer_index'),
    supabase.from('ron_documents').select('id, document_name, document_type, storage_bucket, blue_notary_document_name, template_id, smart_tags_applied, uploaded_to_bluenotary, signed_document_received, document_status, created_at').eq('ron_session_id', sessionId),
    supabase.from('ron_audit_events').select('id, event_type, description, actor_role, source, created_at, metadata').eq('ron_session_id', sessionId).order('created_at', { ascending: false }).limit(50),
    supabase.from('deals').select('deal_id, client_name, email, phone, document_type, destination_country, origin_state, execution_truth, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, amount_paid, amount_due').eq('id', session.matter_id).single(),
  ]);
  return { session, signers: signers ?? [], documents: documents ?? [], auditEvents: auditEvents ?? [], deal: deal ?? null };
}

function StatusBadge({ status }: { status: string }) {
  const good = ['PASSED', 'UNLOCKED', 'AVAILABLE', 'UPLOADED', 'SIGNED'].includes(status);
  const bad = ['FAILED', 'LOCKED', 'BLOCKED'].includes(status);
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${good ? 'border-green-700/40 bg-green-950 text-green-400' : bad ? 'border-red-700/40 bg-red-950 text-red-400' : 'border-zinc-700 bg-zinc-800 text-zinc-400'}`}>{status}</span>;
}

export default async function RONSessionDetailPage({ params }: { params: Promise<{ session_id: string }> }) {
  await requireDashboardAccess();
  const { session_id } = await params;
  const data = await getSessionDetail(session_id);
  if (!data) notFound();

  const { session, signers, documents, auditEvents, deal } = data;
  const ronStatus = session.milano_ron_status as MilanoRONStatus;
  const isCompleted = ['RON_COMPLETED', 'SESSION_PROCESSING', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(ronStatus);
  const isExpired = ronStatus === 'RON_EXPIRED';
  const paymentConfirmed = deal?.payment_confirmed === true;
  const paymentObserved = deal?.payment_settlement_status === 'observed_pending' || Boolean(deal?.payment_observed_at);
  const truth = (deal?.execution_truth ?? {}) as Record<string, unknown>;
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const signerComplete = signers.length > 0 && signers.every((signer) => Boolean(signer.first_name && signer.last_name && signer.email && signer.phone && signer.state));
  const ronTruthComplete = truth.execution_method === 'ron' && truth.notarization_requirement === 'required' && Boolean(truth.signer_location) && Boolean(truth.notary_jurisdiction) && notarialAct !== 'review_required' && notarialAct !== 'unknown';
  const suggestedPreset = deal?.document_type ? resolvePresetForDocumentType(deal.document_type) : null;
  const pendingDocumentIds = documents.filter((doc) => !doc.uploaded_to_bluenotary).map((doc) => doc.id);

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-1 font-mono text-xs text-zinc-500">{deal?.deal_id ?? session.matter_id} · {session.notarization_id}</p>
          <h1 className="text-xl font-bold text-white">{deal?.client_name ?? 'RON Session'}</h1>
          <p className="text-sm text-zinc-400">{deal?.email} · {deal?.phone ?? 'phone missing'}</p>
        </div>
        <div className="text-right"><span className="text-sm font-semibold text-amber-400">{getClientStatusLabel(ronStatus)}</span><p className="mt-1 font-mono text-xs text-zinc-600">{ronStatus}</p></div>
      </div>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Matter + Session Truth</h2>
        <div className="grid grid-cols-2 gap-3 text-xs md:grid-cols-3">
          {[
            ['Matter ID', deal?.deal_id ?? session.matter_id],
            ['Document Type', deal?.document_type ?? '—'],
            ['Destination', deal?.destination_country ?? '—'],
            ['Execution', String(truth.execution_method ?? '—')],
            ['Notarial Act', notarialAct === 'review_required' ? 'Operator review required' : notarialAct.replace(/_/g, ' ')],
            ['Notary Jurisdiction', String(truth.notary_jurisdiction ?? '—')],
            ['Session Type', session.session_type ?? 'ron'],
            ['Scheduled', session.session_timing ? new Date(session.session_timing).toLocaleString() : '—'],
            ['Created', new Date(session.created_at).toLocaleString()],
          ].map(([label, value]) => <div key={label}><p className="text-zinc-600">{label}</p><p className="break-all font-mono text-[11px] text-zinc-200">{value}</p></div>)}
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-3 text-sm font-semibold text-zinc-300">Canonical Payment Gate</h2>
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <StatusBadge status={paymentConfirmed ? 'UNLOCKED' : 'LOCKED'} />
          <span className={paymentConfirmed ? 'text-green-400' : paymentObserved ? 'text-amber-400' : 'text-red-400'}>{paymentConfirmed ? 'Payment verified' : paymentObserved ? 'Retainer submitted · Wise processing' : 'Payment not verified'}</span>
          <span className="text-zinc-500">Paid: ${deal?.amount_paid ?? 0} / Due: ${deal?.amount_due ?? '—'}</span>
        </div>
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Signer Readiness</h2>
        {signers.length === 0 ? <p className="text-xs text-zinc-500">No signers recorded</p> : <div className="space-y-3">{signers.map((signer) => (
          <div key={signer.id} className="border-b border-zinc-800 pb-3 text-xs">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div><p className="text-white">{signer.first_name} {signer.middle_name ? `${signer.middle_name} ` : ''}{signer.last_name}</p><p className="text-zinc-500">{signer.email} · {signer.phone ?? 'phone missing'} · {signer.state ?? 'state missing'}</p></div>
              <div className="flex flex-wrap gap-2"><StatusBadge status={signer.identity_status} /><StatusBadge status={signer.kba_status} /><StatusBadge status={signer.biometric_status} /><span className={signer.signing_url_released ? 'text-green-400' : 'text-zinc-600'}>{signer.signing_url_released ? 'Link Released' : 'Link Held'}</span></div>
            </div>
          </div>
        ))}</div>}
      </section>

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <h2 className="mb-4 text-sm font-semibold text-zinc-300">Document Package</h2>
        {suggestedPreset && <div className="mb-4 rounded border border-amber-600/30 bg-amber-950/30 p-3 text-xs"><p className="font-semibold text-amber-400">Suggested Preset: {suggestedPreset.preset}</p><p className="mt-1 text-zinc-400">{suggestedPreset.description}</p>{suggestedPreset.requiresOperatorReview && <p className="mt-1 text-red-400">Operator review required before provider upload</p>}</div>}
        {documents.length === 0 ? <p className="text-xs text-zinc-500">No documents attached</p> : <div className="space-y-2">{documents.map((doc) => <div key={doc.id} className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-2 text-xs"><div><p className="text-zinc-300">{doc.document_name}</p><p className="font-mono text-[10px] text-zinc-600">{doc.storage_bucket}</p></div><div className="flex gap-2"><StatusBadge status={doc.document_status} />{doc.uploaded_to_bluenotary && <span className="text-green-400">BlueNotary uploaded</span>}{doc.signed_document_received && <span className="text-amber-400">Signed</span>}</div></div>)}</div>}
      </section>

      <RONSessionControlPanel
        matterId={session.matter_id}
        sessionId={session.id}
        currentStatus={ronStatus}
        documentIds={pendingDocumentIds}
        gates={{
          paymentConfirmed: { met: paymentConfirmed, reason: paymentObserved ? 'Retainer submitted; Wise settlement is still processing.' : 'Verified payment required.' },
          sessionExists: { met: true },
          sessionNotExpired: { met: !isExpired },
          signerComplete: { met: signerComplete, reason: 'Signer phone/state or identity fields are incomplete.' },
          ronTruthComplete: { met: ronTruthComplete, reason: notarialAct === 'review_required' ? 'Confirm acknowledgment vs jurat.' : 'RON execution truth incomplete.' },
          documentReady: { met: documents.length > 0, reason: 'Matter document package missing.' },
          sessionCompleted: { met: isCompleted },
        }}
      />

      {(ronStatus === 'SIGNED_DOCS_RETRIEVED' || ronStatus === 'READY_FOR_APOSTILLE') && <section className="rounded-lg border border-amber-600/40 bg-amber-950/20 p-5"><h2 className="mb-2 text-sm font-semibold text-amber-400">Next Step: Apostille QA Review</h2><p className="text-xs text-zinc-400">Signed documents are secured. Apostille QA remains an explicit operator step and is not auto-advanced.</p></section>}

      <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
        <div className="mb-4 flex items-center justify-between"><h2 className="text-sm font-semibold text-zinc-300">Audit Events</h2><Link href={`/dashboard/matters/${session.matter_id}/execution`} className="text-xs text-amber-400 hover:underline">Open Matter execution →</Link></div>
        {auditEvents.length === 0 ? <p className="text-xs text-zinc-500">No audit events recorded</p> : <div className="space-y-2">{auditEvents.map((event) => <div key={event.id} className="flex items-start gap-3 border-b border-zinc-800 pb-2 text-xs"><span className="whitespace-nowrap font-mono text-[10px] text-zinc-600">{new Date(event.created_at).toLocaleString()}</span><div><span className="font-mono text-amber-400">{event.event_type}</span>{event.description && <p className="mt-0.5 text-zinc-400">{event.description}</p>}<span className="text-[10px] text-zinc-600">via {event.source} / {event.actor_role}</span></div></div>)}</div>}
      </section>
    </div>
  );
}
