import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { getClientStatusLabel } from '@/lib/bluenotary/status';
import { evaluateSchedulingGate } from '@/lib/scheduling/complimentarySchedulingGate';

export const metadata: Metadata = {
  title: 'Signing Room — The Milano Seal™',
  robots: { index: false, follow: false },
};

const QUEUE_DEFINITIONS: { label: string; statuses: MilanoRONStatus[]; tone: string }[] = [
  { label: 'Ready for RON', statuses: ['READY_FOR_RON'], tone: 'border-[var(--ms-gold)]/35' },
  { label: 'Sessions Created', statuses: ['RON_SESSION_CREATED', 'SIGNER_INVITED', 'SIGNING_LINK_RELEASED'], tone: 'border-[var(--ms-gold)]/25' },
  { label: 'Identity Verification', statuses: ['IDENTITY_STARTED', 'PHOTO_ID_PASSED', 'PHOTO_ID_FAILED', 'BIOMETRICS_PASSED', 'KBA_STARTED', 'KBA_PASSED', 'KBA_FAILED'], tone: 'border-sky-400/25' },
  { label: 'In Session', statuses: ['NOTARY_ACCEPTED', 'SESSION_JOINED', 'SESSION_STARTED'], tone: 'border-emerald-400/25' },
  { label: 'Processing Signed Documents', statuses: ['SESSION_PROCESSING', 'RON_COMPLETED'], tone: 'border-violet-400/25' },
  { label: 'Completed / Awaiting Apostille Review', statuses: ['SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'], tone: 'border-[var(--ms-gold)]/25' },
  { label: 'Failed / Review Required', statuses: ['RON_REVIEW_REQUIRED'], tone: 'border-[#E0876E]/35' },
  { label: 'Expired / Reschedule Required', statuses: ['RON_EXPIRED'], tone: 'border-white/10' },
];

interface SessionRow {
  id: string;
  matter_id: string;
  notarization_id: string;
  milano_ron_status: MilanoRONStatus;
  identity_status: string;
  kba_status: string;
  payment_gate_status: string;
  session_timing: string | null;
  created_at: string;
  deals: {
    deal_id: string | null;
    client_name: string | null;
    email: string | null;
    document_type: string | null;
    destination_country: string | null;
    payment_status: string | null;
    payment_confirmed: boolean | null;
    payment_settlement_status: string | null;
  } | null;
}

interface PreSessionMatter {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  email: string | null;
  phone: string | null;
  document_type: string | null;
  destination_country: string | null;
  payment_status: string | null;
  payment_confirmed: boolean | null;
  payment_settlement_status: string | null;
  payment_observed_at: string | null;
  payment_observed_amount: number | null;
  payment_observed_currency: string | null;
  payment_observed_reference: string | null;
  currency: string | null;
  wise_reference: string | null;
  amount_due: number | null;
  amount_paid: number | null;
  is_platform_fee_only: boolean | null;
  payment_disposition: string | null;
  comp_authorized: boolean | null;
  comp_authorization_id: string | null;
  comp_authorized_at: string | null;
  comp_revoked_at: string | null;
  verified_revenue: number | null;
  execution_truth: Record<string, unknown> | null;
}

async function getRONData() {
  const supabase = createAdminClient();
  const [{ data: sessions, error }, { data: matters }] = await Promise.all([
    supabase.from('ron_sessions').select(`
      id, matter_id, notarization_id, milano_ron_status, identity_status, kba_status,
      payment_gate_status, session_timing, created_at,
      deals:matter_id (deal_id, client_name, email, document_type, destination_country, payment_status, payment_confirmed, payment_settlement_status)
    `).order('created_at', { ascending: false }).limit(200),
    supabase.from('deals').select('id, deal_id, client_name, email, phone, document_type, destination_country, payment_status, payment_confirmed, payment_settlement_status, payment_observed_at, payment_observed_amount, payment_observed_currency, payment_observed_reference, currency, wise_reference, amount_due, amount_paid, is_platform_fee_only, payment_disposition, comp_authorized, comp_authorization_id, comp_authorized_at, comp_revoked_at, verified_revenue, execution_truth').order('created_at', { ascending: false }).limit(200),
  ]);

  const safeSessions = error ? [] : ((sessions ?? []) as unknown as SessionRow[]);
  const sessionMatterIds = new Set(safeSessions.map((session) => session.matter_id));
  const preSessionMatters = ((matters ?? []) as unknown as PreSessionMatter[]).filter((matter) => {
    const truth = matter.execution_truth ?? {};
    return !sessionMatterIds.has(matter.id) && (truth.execution_method === 'ron' || truth.notarization_requirement === 'required');
  });
  return { sessions: safeSessions, preSessionMatters };
}

function paymentLabel(matter: PreSessionMatter) {
  const gate = evaluateSchedulingGate({ matter });
  if (gate.paymentRequirementMethod === 'verified_payment') return 'Wise verified · scheduling authorized';
  if (gate.paymentRequirementMethod === 'wise_submission_observed') return 'Wise submitted · scheduling authorized';
  if (gate.paymentRequirementMethod === 'complimentary_authorization') return 'Complimentary authorization · scheduling authorized';
  return gate.reason;
}

function getRONBlockers(matter: PreSessionMatter) {
  const truth = matter.execution_truth ?? {};
  const schedulingGate = evaluateSchedulingGate({ matter });
  const notarialAct = String(truth.notarial_act ?? '').trim().toLowerCase();
  const blockers: string[] = [];
  if (!schedulingGate.schedulingEligible) blockers.push(schedulingGate.reason);
  if (!String(truth.signer_location ?? '').trim()) blockers.push('Signer location is required.');
  if (!String(truth.notary_jurisdiction ?? '').trim()) blockers.push('Notary jurisdiction is required.');
  if (!notarialAct || notarialAct === 'review_required' || notarialAct === 'unknown') blockers.push('Notarial act requires operator review.');
  if (!matter.document_type) blockers.push('Matter document type is unresolved.');
  return Array.from(new Set(blockers));
}

function PreSessionMatterCard({ matter }: { matter: PreSessionMatter }) {
  const truth = matter.execution_truth ?? {};
  const notarialAct = String(truth.notarial_act ?? 'review_required');
  const schedulingGate = evaluateSchedulingGate({ matter });
  const blockers = getRONBlockers(matter);
  const ready = blockers.length === 0;
  const paymentSatisfied = schedulingGate.schedulingEligible;
  const notarialReview = notarialAct === 'review_required' || notarialAct === 'unknown';

  return (
    <article className={`overflow-hidden rounded-2xl border bg-[linear-gradient(180deg,#0d0d0d_0%,#070707_100%)] shadow-[0_20px_60px_rgba(0,0,0,.28)] ${ready ? 'border-emerald-500/25' : 'border-[var(--ms-gold)]/20'}`}>
      <div className="border-b border-white/[0.055] p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0"><p className="truncate font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/55">{matter.deal_id ?? matter.id}</p><p className="mt-1 truncate text-base font-semibold text-white/90">{matter.client_name ?? 'Unknown client'}</p><p className="mt-1 truncate text-xs text-white/35">{matter.email || 'email missing'} · {matter.phone || 'phone missing'}</p></div>
          <span className={`shrink-0 rounded-full border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] ${ready ? 'border-emerald-500/30 bg-emerald-500/[0.07] text-emerald-300' : 'border-[var(--ms-gold)]/30 bg-[var(--ms-gold)]/[0.055] text-[#E8CF8B]'}`}>{ready ? 'Ready to create' : `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}`}</span>
        </div>
      </div>
      <div className="space-y-4 p-4 sm:p-5">
        <div className="grid gap-2 sm:grid-cols-2">
          <div className={`rounded-xl border p-3 ${paymentSatisfied ? 'border-emerald-500/20 bg-emerald-500/[0.04]' : 'border-[#E0876E]/20 bg-[#C0563E]/[0.04]'}`}><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Scheduling authority</p><p className={`mt-1 text-sm ${paymentSatisfied ? 'text-emerald-300' : 'text-[#E0876E]'}`}>{paymentSatisfied ? 'Payment is not the blocker' : 'Payment authority blocked'}</p><p className="mt-1 text-[11px] leading-4 text-white/38">{paymentLabel(matter)}</p></div>
          <div className={`rounded-xl border p-3 ${notarialReview ? 'border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.04]' : 'border-emerald-500/15 bg-emerald-500/[0.03]'}`}><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Execution decision</p><p className={`mt-1 text-sm ${notarialReview ? 'text-[#F6E8B8]' : 'text-emerald-300'}`}>{notarialReview ? 'Confirm notarial act' : notarialAct.replace(/_/g, ' ')}</p><p className="mt-1 text-[11px] leading-4 text-white/38">Never inferred from document title.</p></div>
        </div>
        <div className="grid gap-2 sm:grid-cols-2"><div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Document</p><p className="mt-1 text-sm text-white/72">{matter.document_type ?? 'Review required'}</p></div><div className="rounded-xl border border-white/[0.05] bg-white/[0.015] p-3"><p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/30">Destination</p><p className="mt-1 text-sm text-white/72">{matter.destination_country ?? 'Review required'}</p></div></div>
        {ready ? <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.045] p-3.5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-emerald-300">Ready for BlueNotary</p><p className="mt-1 text-xs leading-5 text-white/48">Scheduling authority and required RON execution facts are present. Review the package and create the provider session.</p></div> : <div className="rounded-xl border border-[var(--ms-gold)]/18 bg-[var(--ms-gold)]/[0.035] p-3.5"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#E8CF8B]">Resolve before session creation</p><ul className="mt-2 space-y-1.5">{blockers.map((blocker) => <li key={blocker} className="flex gap-2 text-xs leading-5 text-white/58"><span aria-hidden="true" className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ms-gold)]" /><span>{blocker}</span></li>)}</ul></div>}
        <Link href={`/dashboard/matters/${matter.id}/execution`} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-[var(--ms-gold)]/35 bg-[var(--ms-gold)]/[0.07] px-4 py-2.5 text-sm font-semibold text-[#E8CF8B] transition hover:-translate-y-px hover:border-[var(--ms-gold)]/55 hover:bg-[var(--ms-gold)]/[0.1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/55">{ready ? 'Open RON Readiness → Create BlueNotary Session' : 'Open RON Readiness → Resolve Blockers'}</Link>
      </div>
    </article>
  );
}

function MatterCard({ session }: { session: SessionRow }) {
  const deal = session.deals;
  return <article className="rounded-2xl border border-white/[0.07] bg-[#090909] p-4 transition hover:border-[var(--ms-gold)]/30"><div className="mb-3 flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate font-mono text-[9px] uppercase tracking-[0.12em] text-[var(--ms-gold)]/45">{session.notarization_id}</p><p className="mt-1 truncate text-sm font-semibold text-white/88">{deal?.client_name ?? 'Unknown Client'}</p><p className="truncate text-xs text-white/32">{deal?.email}</p></div><span className="shrink-0 whitespace-nowrap rounded-full border border-[var(--ms-gold)]/25 bg-[var(--ms-gold)]/[0.04] px-2 py-1 text-[10px] text-[#E8CF8B]">{getClientStatusLabel(session.milano_ron_status)}</span></div><div className="mb-4 grid grid-cols-1 gap-2 text-xs text-white/45 sm:grid-cols-2"><p><span className="text-white/25">Doc </span>{deal?.document_type ?? '—'}</p><p><span className="text-white/25">Destination </span>{deal?.destination_country ?? '—'}</p><p className="sm:col-span-2"><span className="text-white/25">Settlement </span>{deal?.payment_confirmed ? 'Wise verified' : deal?.payment_settlement_status === 'observed_pending' ? 'Wise submitted · settlement pending' : 'Not verified'}</p><p><span className="text-white/25">Identity </span>{session.identity_status}</p><p><span className="text-white/25">KBA </span>{session.kba_status}</p></div><Link href={`/dashboard/ron/${session.id}`} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.02] px-3 py-2 text-xs font-semibold text-white/80 transition hover:border-[var(--ms-gold)]/30 hover:text-[#F6E8B8]">Open Session</Link></article>;
}

export default async function RONSigningRoomPage() {
  await requireDashboardAccess();
  const { sessions, preSessionMatters } = await getRONData();
  const grouped = QUEUE_DEFINITIONS.map((queue) => ({ ...queue, sessions: sessions.filter((s) => queue.statuses.includes(s.milano_ron_status)) }));
  const totalActive = sessions.filter((s) => !['RON_EXPIRED', 'RON_COMPLETED', 'SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'].includes(s.milano_ron_status)).length;
  const readyCount = preSessionMatters.filter((matter) => getRONBlockers(matter).length === 0).length;
  const blockedCount = preSessionMatters.length - readyCount;
  return <div className="mx-auto max-w-screen-2xl space-y-8 px-4 py-5 sm:p-6 lg:p-8"><header className="overflow-hidden rounded-2xl border border-[var(--ms-gold)]/20 bg-[radial-gradient(circle_at_80%_0%,rgba(198,165,90,.12),transparent_35%),linear-gradient(135deg,#070707,#0b0b0b)] p-5 shadow-[0_26px_90px_rgba(0,0,0,.36)] sm:p-6"><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex flex-wrap items-center gap-2"><span className="rounded-full border border-[var(--ms-gold)]/30 bg-[var(--ms-gold)]/[0.055] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.16em] text-[#E8CF8B]">RON-01</span><span className="font-mono text-[9px] uppercase tracking-[0.14em] text-white/28">Operator execution surface</span></div><h1 className="font-serif text-3xl text-[#F6F1E6]">BlueNotary Signing Room</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-white/42">One governed view from Matter readiness through provider session completion. Scheduling authority, execution truth, identity, documents, and settlement remain separate controls.</p></div><div className="grid grid-cols-3 gap-2 sm:min-w-[390px]">{[["Ready", readyCount], ["Blocked", blockedCount], ["Active", totalActive]].map(([label, value]) => <div key={String(label)} className="rounded-xl border border-white/[0.06] bg-black/25 p-3 text-center"><p className="text-xl font-semibold text-[#E8CF8B]">{value}</p><p className="mt-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/28">{label}</p></div>)}</div></div></header><section><div className="mb-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/55">Pre-session command</p><h2 className="mt-1 font-serif text-2xl text-white/90">Matters awaiting RON action</h2><p className="mt-1 text-xs text-white/35">No hover required. Every blocker and next action remains visible on mobile.</p></div>{preSessionMatters.length === 0 ? <div className="rounded-2xl border border-white/[0.06] bg-[#090909] p-8 text-center text-sm text-white/35">No pre-session RON Matters require action.</div> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{preSessionMatters.map((matter) => <PreSessionMatterCard key={matter.id} matter={matter} />)}</div>}</section><section><div className="mb-4"><p className="font-mono text-[9px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/55">Provider lifecycle</p><h2 className="mt-1 font-serif text-2xl text-white/90">Active and completed sessions</h2></div><div className="space-y-6">{grouped.map((queue) => queue.sessions.length > 0 && <div key={queue.label}><div className="mb-3 flex items-center gap-2"><span className={`h-2 w-2 rounded-full border ${queue.tone}`} /><h3 className="text-sm font-semibold text-white/65">{queue.label}</h3><span className="font-mono text-[9px] text-white/25">{queue.sessions.length}</span></div><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{queue.sessions.map((session) => <MatterCard key={session.id} session={session} />)}</div></div>)}{sessions.length === 0 && <div className="rounded-2xl border border-white/[0.06] bg-[#090909] p-8 text-center text-sm text-white/35">No BlueNotary sessions have been created yet.</div>}</div></section></div>;
}
