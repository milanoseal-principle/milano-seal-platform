import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getClientStatusLabel } from '@/lib/bluenotary/status';
import { TAG_PRESETS, resolvePresetForDocumentType } from '@/lib/bluenotary/tags';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';

export const metadata: Metadata = {
  title: 'RON Session — The Milano Seal™',
  robots: { index: false, follow: false },
};

async function getSessionDetail(sessionId: string) {
  const supabase = createAdminClient();

  const { data: session } = await supabase
    .from('ron_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();

  if (!session) return null;

  const [{ data: signers }, { data: documents }, { data: auditEvents }, { data: deal }] =
    await Promise.all([
      supabase
        .from('ron_signers')
        .select('id, signer_index, first_name, last_name, email, authentication_type, signing_url_released, identity_status, kba_status, biometric_status, joined_at, left_at, completed_at')
        .eq('ron_session_id', sessionId)
        .order('signer_index'),
      supabase
        .from('ron_documents')
        .select('id, document_name, document_type, blue_notary_document_name, template_id, smart_tags_applied, uploaded_to_bluenotary, signed_document_received, document_status, created_at')
        .eq('ron_session_id', sessionId),
      supabase
        .from('ron_audit_events')
        .select('id, event_type, description, actor_role, source, created_at, metadata')
        .eq('ron_session_id', sessionId)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('deals')
        .select('client_name, email, document_type, destination_country, payment_status, amount_paid, amount_due')
        .eq('id', session.matter_id)
        .single(),
    ]);

  return { session, signers: signers ?? [], documents: documents ?? [], auditEvents: auditEvents ?? [], deal: deal ?? null };
}

function StatusBadge({ status }: { status: string }) {
  const isGood = ['PASSED', 'UNLOCKED', 'AVAILABLE', 'UPLOADED', 'SIGNED'].includes(status);
  const isBad = ['FAILED', 'LOCKED', 'BLOCKED'].includes(status);
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-mono ${
        isGood
          ? 'bg-green-950 text-green-400 border border-green-700/40'
          : isBad
          ? 'bg-red-950 text-red-400 border border-red-700/40'
          : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
      }`}
    >
      {status}
    </span>
  );
}

export default async function RONSessionDetailPage({
  params,
}: {
  params: Promise<{ session_id: string }>;
}) {
  await requireDashboardAccess();
  const { session_id } = await params;
  const data = await getSessionDetail(session_id);

  if (!data) notFound();

  const { session, signers, documents, auditEvents, deal } = data;
  const ronStatus = session.milano_ron_status as MilanoRONStatus;
  const isCompleted = ['RON_COMPLETED', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(ronStatus);
  const isExpired = ronStatus === 'RON_EXPIRED';
  const paymentConfirmed = session.payment_gate_status === 'UNLOCKED';

  const suggestedPreset = deal?.document_type
    ? resolvePresetForDocumentType(deal.document_type)
    : null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-zinc-500 font-mono mb-1">{session.notarization_id}</p>
          <h1 className="text-xl font-bold text-white">{deal?.client_name ?? 'RON Session'}</h1>
          <p className="text-sm text-zinc-400">{deal?.email}</p>
        </div>
        <div className="text-right">
          <span className="text-sm text-amber-400 font-semibold">
            {getClientStatusLabel(ronStatus)}
          </span>
          <p className="text-xs text-zinc-600 mt-1 font-mono">{ronStatus}</p>
        </div>
      </div>

      {/* Session Overview */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Session Overview</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          {[
            ['Matter ID', session.matter_id],
            ['Document Type', deal?.document_type ?? '—'],
            ['Destination', deal?.destination_country ?? '—'],
            ['Session Type', session.session_type ?? 'ron'],
            ['Timing Type', session.notarization_timing_type ?? '—'],
            ['Scheduled', session.session_timing ? new Date(session.session_timing).toLocaleString() : '—'],
            ['Started', session.started_at ? new Date(session.started_at).toLocaleString() : '—'],
            ['Completed', session.completed_at ? new Date(session.completed_at).toLocaleString() : '—'],
            ['Created', new Date(session.created_at).toLocaleString()],
          ].map(([label, value]) => (
            <div key={label}>
              <p className="text-zinc-600">{label}</p>
              <p className="text-zinc-200 font-mono text-[11px] break-all">{value}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Payment Gate */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-3">Payment Gate</h2>
        <div className="flex items-center gap-3 text-xs">
          <StatusBadge status={session.payment_gate_status} />
          <span className="text-zinc-400">
            Payment Status: <span className={deal?.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'}>{deal?.payment_status ?? '—'}</span>
          </span>
          {deal?.amount_paid != null && (
            <span className="text-zinc-500">
              Paid: ${deal.amount_paid} / Due: ${deal.amount_due ?? '—'}
            </span>
          )}
        </div>
      </section>

      {/* Signer Readiness */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Signer Readiness</h2>
        {signers.length === 0 ? (
          <p className="text-xs text-zinc-500">No signers recorded</p>
        ) : (
          <div className="space-y-3">
            {signers.map((signer) => (
              <div key={signer.id} className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                <div>
                  <p className="text-white">{signer.first_name} {signer.last_name}</p>
                  <p className="text-zinc-500">{signer.email}</p>
                </div>
                <div className="flex gap-2">
                  <StatusBadge status={signer.identity_status} />
                  <StatusBadge status={signer.kba_status} />
                  <StatusBadge status={signer.biometric_status} />
                  <span className={signer.signing_url_released ? 'text-green-400' : 'text-zinc-600'}>
                    {signer.signing_url_released ? 'Link Released' : 'Link Held'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Document Readiness + Smart Tags */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Document Readiness &amp; Smart Tags</h2>
        {suggestedPreset && (
          <div className="mb-4 p-3 bg-amber-950/30 border border-amber-600/30 rounded text-xs">
            <p className="text-amber-400 font-semibold mb-1">
              Suggested Preset: {suggestedPreset.preset}
            </p>
            <p className="text-zinc-400 mb-2">{suggestedPreset.description}</p>
            {suggestedPreset.requiresOperatorReview && (
              <p className="text-red-400">Operator review required before upload</p>
            )}
            {suggestedPreset.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {suggestedPreset.tags.map((tag) => (
                  <code key={tag} className="bg-zinc-800 text-zinc-300 px-1 py-0.5 rounded text-[10px]">{tag}</code>
                ))}
              </div>
            )}
          </div>
        )}
        {documents.length === 0 ? (
          <p className="text-xs text-zinc-500">No documents attached</p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between text-xs border-b border-zinc-800 pb-2">
                <span className="text-zinc-300">{doc.document_name}</span>
                <div className="flex gap-2">
                  <StatusBadge status={doc.document_status} />
                  {doc.uploaded_to_bluenotary && <span className="text-green-400">Uploaded</span>}
                  {doc.signed_document_received && <span className="text-amber-400">Signed</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Identity + KBA Timeline */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Identity &amp; KBA Status</h2>
        <div className="grid grid-cols-3 gap-4 text-xs text-center">
          {[
            ['Identity', session.identity_status],
            ['KBA', session.kba_status],
            ['Biometric', session.biometric_status],
          ].map(([label, status]) => (
            <div key={label}>
              <p className="text-zinc-600 mb-1">{label}</p>
              <StatusBadge status={status} />
            </div>
          ))}
        </div>
      </section>

      {/* Operator Actions */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Operator Actions</h2>
        <p className="text-xs text-zinc-500 mb-3">
          Actions performed via API. Use with care — all actions are audited.
        </p>
        <div className="flex flex-wrap gap-3 text-xs">
          <div className="p-2 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">
            {!paymentConfirmed && <p className="text-red-400 text-[10px] mb-1">Payment not confirmed</p>}
            <code className="text-amber-400">POST /api/dashboard/ron/sessions</code>
            <p className="text-zinc-600 mt-0.5">Create Session</p>
          </div>
          <div className="p-2 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">
            {isExpired && <p className="text-red-400 text-[10px] mb-1">Session expired</p>}
            <code className="text-amber-400">PUT .../reschedule</code>
            <p className="text-zinc-600 mt-0.5">Reschedule</p>
          </div>
          <div className="p-2 bg-zinc-800 rounded border border-zinc-700 text-zinc-400">
            <code className="text-amber-400">PUT .../expire</code>
            <p className="text-zinc-600 mt-0.5">Expire Session</p>
          </div>
          {isCompleted && (
            <div className="p-2 bg-amber-950/40 rounded border border-amber-700/40 text-zinc-400">
              <code className="text-amber-400">POST .../signed-documents</code>
              <p className="text-zinc-600 mt-0.5">Retrieve Signed Documents</p>
            </div>
          )}
        </div>
      </section>

      {/* Apostille QA Next Step */}
      {(ronStatus === 'SIGNED_DOCS_RETRIEVED' || ronStatus === 'READY_FOR_APOSTILLE') && (
        <section className="bg-amber-950/20 border border-amber-600/40 rounded-lg p-5">
          <h2 className="text-sm font-semibold text-amber-400 mb-2">Next Step: Apostille QA Review</h2>
          <p className="text-xs text-zinc-400">
            Signed documents have been secured in the vault. The operator must complete
            Apostille QA Review before proceeding. This step is NOT automated.
          </p>
        </section>
      )}

      {/* Audit Events */}
      <section className="bg-zinc-900 border border-zinc-800 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-zinc-300 mb-4">Audit Events</h2>
        {auditEvents.length === 0 ? (
          <p className="text-xs text-zinc-500">No audit events recorded</p>
        ) : (
          <div className="space-y-2">
            {auditEvents.map((event) => (
              <div key={event.id} className="flex items-start gap-3 text-xs border-b border-zinc-800 pb-2">
                <span className="text-zinc-600 whitespace-nowrap font-mono text-[10px]">
                  {new Date(event.created_at).toLocaleString()}
                </span>
                <div>
                  <span className="text-amber-400 font-mono">{event.event_type}</span>
                  {event.description && (
                    <p className="text-zinc-400 mt-0.5">{event.description}</p>
                  )}
                  <span className="text-zinc-600 text-[10px]">via {event.source} / {event.actor_role}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
