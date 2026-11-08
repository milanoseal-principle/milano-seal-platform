import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import { getClientStatusLabel } from '@/lib/bluenotary/status';
import { resolvePresetForDocumentType } from '@/lib/bluenotary/tags';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { RONSessionControlPanel } from '@/components/ron/RONSessionControlPanel';
import { RONStatutoryEvidencePanel } from '@/components/ron/RONStatutoryEvidencePanel';
import { evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

export const metadata: Metadata = { title: 'RON Session — The Milano Seal™', robots: { index: false, follow: false } };

async function getSessionDetail(sessionId: string) {
  const supabase = createAdminClient();
  const { data: session } = await supabase.from('ron_sessions').select('*').eq('id', sessionId).single();
  if (!session) return null;

  const [{ data: signers }, { data: documents }, { data: auditEvents }, { data: deal }] = await Promise.all([
    supabase.from('ron_signers').select('id, signer_index, first_name, middle_name, last_name, email, phone, state, authentication_type, signing_url_released, identity_status, kba_status, biometric_status, joined_at, left_at, completed_at').eq('ron_session_id', sessionId).order('signer_index'),
    supabase.from('ron_documents').select('id, document_name, document_type, storage_bucket, blue_notary_document_name, template_id, smart_tags_applied, uploaded_to_bluenotary, signed_document_received, document_status, created_at').eq('ron_session_id', sessionId),
    supabase.from('ron_audit_events').select('id, event_type, description, actor_role, source, created_at, metadata').eq('ron_session_id', sessionId).order('created_at', { ascending: false }).limit(50),
    supabase.from('deals').select('id, deal_id, client_name, email, phone, document_type, destination_country, origin_state, execution_truth, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_paid, amount_due, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue').eq('id', session.matter_id).single(),
  ]);
  return { session, signers: signers ?? [], documents: documents ?? [], auditEvents: auditEvents ?? [], deal: deal ?? null };
}

function StatusBadge({ status }: { status: string }) {
  const good = ['PASSED', 'UNLOCKED', 'AVAILABLE', 'UPLOADED', 'SIGNED', 'AUTHORIZED'].includes(status);
  const bad = ['FAILED', 'LOCKED', 'BLOCKED'].includes(status);
  return <span className={`rounded-full border px-2 py-0.5 font-mono text-xs ${good ? 'border-emerald-500/25 bg-emerald-500/[0.06] text-emerald-300' : bad ? 'border-[#E0876E]/30 bg-[#C0563E]/[0.06] text-[#E0876E]' : 'border-white/[0.08] bg-white/[0.025] text-white/45'}`}>{status}</span>;
}

function authorityLabel(method: ReturnType<typeof evaluateSchedulingGate>['paymentRequirementMethod']) {
  if (method === 'verified_payment') return 'Wise verified · scheduling authorized';
  if (method === 'wise_submission_observed') return 'Wise submitted · scheduling authorized';
  if (method === 'complimentary_authorization') return 'Complimentary authorization · scheduling authorized';
  return 'Scheduling payment authority not satisfied';
}

export default async function RONSessionDetailPage({ params }: { params: Promise<{ session_id: string }> }) {
  await requireDashboardAccess();
  const { session_id } = await params;
  const data = await getSessionDetail(session_id);
  if (!data) notFound();

  const { session, signers, documents, auditEvents, deal } = data;
  const ronStatus = session.milano_ron_status as MilanoRONStatus;
  // Provider completion is not Milano completion; only the verified lifecycle is.
  const lifecycle = String(session.ron_lifecycle_state ?? 'REQUESTED');
  const isCompleted = lifecycle === 'COMPLETED';
  const providerCompleted = lifecycle === 'PROVIDER_SESSION_COMPLETED' || lifecycle === 'EVIDENCE_PENDING';
  const isExpired = ronStatus === 'RON_EXPIRED';
  const paymentConfirmed = deal?.payment_confirmed === true;
  const schedulingGate = deal ? evaluateSchedulingGate({ matter: deal }) : null;
  const schedulingAuthorized = schedulingGate?.schedulingEligible === true;
  const paymentAuthority = schedulingGate ? authorityLabel(schedulingGate.paymentRequirementMethod) : 'Scheduling authority unavailable';
  const truth = (deal?.execution_truth ?? {}) as Record<string, unknown>;
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const signerComplete = signers.length > 0 && signers.every((signer) => Boolean(signer.first_name && signer.last_name && signer.email && signer.phone && signer.state));
  const ronTruthComplete = truth.execution_method === 'ron' && truth.notarization_requirement === 'required' && Boolean(truth.signer_location) && Boolean(truth.notary_jurisdiction) && notarialAct !== 'review_required' && notarialAct !== 'unknown';
  const suggestedPreset = deal?.document_type ? resolvePresetForDocumentType(deal.document_type) : null;
  const pendingDocumentIds = documents.filter((doc) => !doc.uploaded_to_bluenotary).map((doc) => doc.id);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-5 sm:p-6 lg:p-8">
      <header className="overflow-hidden rounded-2xl border border-[var(--ms-gold)]/20 bg-[radial-gradient(circle_at_85%_0%,rgba(198,165,90,.11),transparent_34%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_24px_80px_rgba(0,0,0,.3)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/55">{deal?.deal_id ?? session.matter_id} · {session.notarization_id}</p><h1 className="mt-1 font-serif text-2xl text-[#F6F1E6]">{deal?.client_name ?? 'RON Session'}</h1><p className="mt-1 text-sm text-white/38">{deal?.email} · {deal?.phone ?? 'phone missing'}</p></div>
          <div className="text-left sm:text-right"><span className="text-sm font-semibold text-[#E8CF8B]">{getClientStatusLabel(ronStatus)}</span><p className="mt-1 font-mono text-[9px] text-white/25">{ronStatus}</p></div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2">
        <div className={`rounded-2xl border p-4 ${schedulingAuthorized ? 'border-emerald-500/25 bg-emerald-500/[0.05]' : 'border-[#E0876E]/25 bg-[#C0563E]/[0.05]'}`}><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">Scheduling authority</p><p className={`mt-1 text-base font-medium ${schedulingAuthorized ? 'text-emerald-200' : 'text-[#E0876E]'}`}>{schedulingAuthorized ? 'Payment is not the blocker' : 'Scheduling authority blocked'}</p><p className="mt-1 text-xs leading-5 text-white/42">{paymentAuthority}</p></div>
        <div className={`rounded-2xl border p-4 ${ronTruthComplete ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.04]'}`}><p className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/30">RON execution truth</p><p className={`mt-1 text-base font-medium ${ronTruthComplete ? 'text-emerald-200' : 'text-[#F6E8B8]'}`}>{ronTruthComplete ? 'Execution facts confirmed' : 'Execution review required'}</p><p className="mt-1 text-xs leading-5 text-white/42">Notarial act: {notarialAct === 'review_required' ? 'operator confirmation required' : notarialAct.replace(/_/g, ' ')}</p></div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5">
        <h2 className="mb-4 font-serif text-lg text-white/85">Matter + Session Truth</h2>
        <div className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-2 md:grid-cols-3">
          {[
            ['Matter ID', deal?.deal_id ?? session.matter_id], ['Document Type', deal?.document_type ?? '—'], ['Destination', deal?.destination_country ?? '—'],
            ['Execution', String(truth.execution_method ?? '—')], ['Notarial Act', notarialAct === 'review_required' ? 'Operator review required' : notarialAct.replace(/_/g, ' ')], ['Notary Jurisdiction', String(truth.notary_jurisdiction ?? '—')],
            ['Session Type', session.session_type ?? 'ron'], ['Scheduled', session.session_timing ? new Date(session.session_timing).toLocaleString() : '—'], ['Created', new Date(session.created_at).toLocaleString()],
          ].map(([label, value]) => <div key={label} className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.1em] text-white/28">{label}</p><p className="mt-1 break-all text-sm text-white/70">{value}</p></div>)}
        </div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5">
        <div className="flex flex-wrap items-center gap-3 text-xs"><StatusBadge status={schedulingAuthorized ? 'AUTHORIZED' : 'LOCKED'} /><span className={schedulingAuthorized ? 'text-emerald-300' : 'text-[#E0876E]'}>{paymentAuthority}</span><span className="text-white/32">Paid truth: {paymentConfirmed ? 'verified' : 'not verified'} · ${deal?.amount_paid ?? 0} / Due: ${deal?.amount_due ?? '—'}</span></div>
      </section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5"><h2 className="mb-4 font-serif text-lg text-white/85">Signer Readiness</h2>{signers.length === 0 ? <p className="text-xs text-white/35">No signers recorded</p> : <div className="space-y-3">{signers.map((signer) => <div key={signer.id} className="border-b border-white/[0.06] pb-3 text-xs"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-white/82">{signer.first_name} {signer.middle_name ? `${signer.middle_name} ` : ''}{signer.last_name}</p><p className="text-white/35">{signer.email} · {signer.phone ?? 'phone missing'} · {signer.state ?? 'state missing'}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={signer.identity_status} /><StatusBadge status={signer.kba_status} /><StatusBadge status={signer.biometric_status} /><span className={signer.signing_url_released ? 'text-emerald-300' : 'text-white/28'}>{signer.signing_url_released ? 'Link Released' : 'Link Held'}</span></div></div></div>)}</div>}</section>

      <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5"><h2 className="mb-4 font-serif text-lg text-white/85">Document Package</h2>{suggestedPreset && <div className="mb-4 rounded-xl border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.04] p-3 text-xs"><p className="font-semibold text-[#E8CF8B]">Suggested Preset: {suggestedPreset.preset}</p><p className="mt-1 text-white/42">{suggestedPreset.description}</p>{suggestedPreset.requiresOperatorReview && <p className="mt-1 text-[#E0876E]">Operator review required before provider upload</p>}</div>}{documents.length === 0 ? <p className="text-xs text-white/35">No documents attached</p> : <div className="space-y-2">{documents.map((doc) => <div key={doc.id} className="flex items-center justify-between gap-3 border-b border-white/[0.06] pb-2 text-xs"><div><p className="text-white/65">{doc.document_name}</p><p className="font-mono text-[10px] text-white/25">{doc.storage_bucket}</p></div><div className="flex flex-wrap gap-2"><StatusBadge status={doc.document_status} />{doc.uploaded_to_bluenotary && <span className="text-emerald-300">BlueNotary uploaded</span>}{doc.signed_document_received && <span className="text-[#E8CF8B]">Signed</span>}</div></div>)}</div>}</section>

      <RONSessionControlPanel matterId={session.matter_id} sessionId={session.id} currentStatus={ronStatus} documentIds={pendingDocumentIds} gates={{ schedulingAuthorized: { met: schedulingAuthorized, reason: schedulingGate?.reason ?? 'Scheduling authority unavailable.' }, sessionExists: { met: true }, sessionNotExpired: { met: !isExpired }, signerComplete: { met: signerComplete, reason: 'Signer phone/state or identity fields are incomplete.' }, ronTruthComplete: { met: ronTruthComplete, reason: notarialAct === 'review_required' ? 'Confirm acknowledgment vs jurat.' : 'RON execution truth incomplete.' }, documentReady: { met: documents.length > 0, reason: 'Matter document package missing.' }, sessionCompleted: { met: providerCompleted, reason: 'The provider must report session completion before signed documents can be retrieved.' }, ronCompleted: { met: isCompleted, reason: 'Milano must verify statutory RON evidence, record QC and complete the session first.' } }} />

      <RONStatutoryEvidencePanel sessionId={session.id} />

      {(ronStatus === 'SIGNED_DOCS_RETRIEVED' || ronStatus === 'READY_FOR_APOSTILLE') && <section className="rounded-2xl border border-[var(--ms-gold)]/30 bg-[var(--ms-gold)]/[0.04] p-5"><h2 className="mb-2 font-serif text-lg text-[#E8CF8B]">Next Step: Apostille QA Review</h2><p className="text-xs text-white/42">Signed documents are secured. {isCompleted ? 'Statutory RON evidence is verified.' : 'Statutory RON evidence verification is still required.'} Apostille QA remains an explicit operator step and is not auto-advanced.</p></section>}

      <section className="rounded-2xl border border-white/[0.07] bg-[#090909] p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-serif text-lg text-white/85">Audit Events</h2><Link href={`/dashboard/matters/${session.matter_id}/execution`} className="text-xs text-[#E8CF8B] hover:underline">Open Matter execution →</Link></div>{auditEvents.length === 0 ? <p className="text-xs text-white/35">No audit events recorded</p> : <div className="space-y-2">{auditEvents.map((event) => <div key={event.id} className="flex items-start gap-3 border-b border-white/[0.06] pb-2 text-xs"><span className="whitespace-nowrap font-mono text-[10px] text-white/25">{new Date(event.created_at).toLocaleString()}</span><div><span className="font-mono text-[#E8CF8B]">{event.event_type}</span>{event.description && <p className="mt-0.5 text-white/42">{event.description}</p>}<span className="text-[10px] text-white/25">via {event.source} / {event.actor_role}</span></div></div>)}</div>}</section>
    </div>
  );
}
