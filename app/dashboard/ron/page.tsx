import type { Metadata } from 'next';
import Link from 'next/link';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireDashboardAccess } from '@/lib/dashboardAuth';
import type { MilanoRONStatus } from '@/lib/bluenotary/types';
import { getClientStatusLabel } from '@/lib/bluenotary/status';

export const metadata: Metadata = {
  title: 'Signing Room — The Milano Seal™',
  robots: { index: false, follow: false },
};

const QUEUE_DEFINITIONS: {
  label: string;
  statuses: MilanoRONStatus[];
  color: string;
}[] = [
  {
    label: 'Ready for RON',
    statuses: ['READY_FOR_RON'],
    color: 'border-amber-500',
  },
  {
    label: 'Sessions Created',
    statuses: ['RON_SESSION_CREATED', 'SIGNER_INVITED', 'SIGNING_LINK_RELEASED'],
    color: 'border-yellow-400',
  },
  {
    label: 'Identity Verification',
    statuses: ['IDENTITY_STARTED', 'PHOTO_ID_PASSED', 'PHOTO_ID_FAILED', 'BIOMETRICS_PASSED', 'KBA_STARTED', 'KBA_PASSED', 'KBA_FAILED'],
    color: 'border-blue-400',
  },
  {
    label: 'In Session',
    statuses: ['NOTARY_ACCEPTED', 'SESSION_JOINED', 'SESSION_STARTED'],
    color: 'border-green-400',
  },
  {
    label: 'Processing Signed Documents',
    statuses: ['SESSION_PROCESSING', 'RON_COMPLETED'],
    color: 'border-purple-400',
  },
  {
    label: 'Completed / Awaiting Apostille Review',
    statuses: ['SIGNED_DOCS_RETRIEVED', 'READY_FOR_APOSTILLE'],
    color: 'border-amber-400',
  },
  {
    label: 'Failed / Review Required',
    statuses: ['RON_REVIEW_REQUIRED'],
    color: 'border-red-500',
  },
  {
    label: 'Expired / Reschedule Required',
    statuses: ['RON_EXPIRED'],
    color: 'border-zinc-500',
  },
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
    client_name: string | null;
    email: string | null;
    document_type: string | null;
    destination_country: string | null;
    payment_status: string | null;
  } | null;
}

async function getRONQueues() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('ron_sessions')
    .select(`
      id,
      matter_id,
      notarization_id,
      milano_ron_status,
      identity_status,
      kba_status,
      payment_gate_status,
      session_timing,
      created_at,
      deals:matter_id (
        client_name,
        email,
        document_type,
        destination_country,
        payment_status
      )
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return [];
  return (data ?? []) as unknown as SessionRow[];
}

function MatterCard({ session }: { session: SessionRow }) {
  const deal = session.deals;
  const isPaymentConfirmed = session.payment_gate_status === 'UNLOCKED';
  const isExpired = session.milano_ron_status === 'RON_EXPIRED';
  const isCompleted =
    session.milano_ron_status === 'RON_COMPLETED' ||
    session.milano_ron_status === 'SIGNED_DOCS_RETRIEVED';

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-4 hover:border-amber-500/50 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-xs text-zinc-500 font-mono">{session.notarization_id}</p>
          <p className="text-sm font-semibold text-white mt-0.5">
            {deal?.client_name ?? 'Unknown Client'}
          </p>
          <p className="text-xs text-zinc-400">{deal?.email}</p>
        </div>
        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-amber-400 border border-amber-500/30 whitespace-nowrap">
          {getClientStatusLabel(session.milano_ron_status)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs text-zinc-400 mb-3">
        <div>
          <span className="text-zinc-600">Doc Type </span>
          {deal?.document_type ?? '—'}
        </div>
        <div>
          <span className="text-zinc-600">Destination </span>
          {deal?.destination_country ?? '—'}
        </div>
        <div>
          <span className="text-zinc-600">Payment </span>
          <span className={deal?.payment_status === 'paid' ? 'text-green-400' : 'text-red-400'}>
            {deal?.payment_status ?? '—'}
          </span>
        </div>
        <div>
          <span className="text-zinc-600">Identity </span>
          {session.identity_status}
        </div>
        <div>
          <span className="text-zinc-600">KBA </span>
          {session.kba_status}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Link
          href={`/dashboard/ron/${session.id}`}
          className="text-xs px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600"
        >
          View Session
        </Link>
        {!isExpired && !isCompleted && isPaymentConfirmed && (
          <button
            className="text-xs px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-900/60 text-amber-400 border border-amber-600/40"
            disabled
            title="Use session detail page for actions"
          >
            Actions
          </button>
        )}
      </div>
    </div>
  );
}

export default async function RONSigningRoomPage() {
  await requireDashboardAccess();
  const sessions = await getRONQueues();

  const grouped = QUEUE_DEFINITIONS.map((queue) => ({
    ...queue,
    sessions: sessions.filter((s) =>
      queue.statuses.includes(s.milano_ron_status)
    ),
  }));

  const totalActive = sessions.filter(
    (s) =>
      s.milano_ron_status !== 'RON_EXPIRED' &&
      s.milano_ron_status !== 'RON_COMPLETED' &&
      s.milano_ron_status !== 'SIGNED_DOCS_RETRIEVED' &&
      s.milano_ron_status !== 'READY_FOR_APOSTILLE'
  ).length;

  return (
    <div className="p-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Signing Room
          </h1>
          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-950 text-amber-400 border border-amber-600/40 font-mono">
            RON-01
          </span>
        </div>
        <p className="text-sm text-zinc-400">
          Remote Online Notarization — BlueNotary Integration
        </p>
        <p className="text-xs text-zinc-600 mt-1">
          {totalActive} active session{totalActive !== 1 ? 's' : ''} &bull;{' '}
          {sessions.length} total
        </p>
      </div>

      {/* Queue grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
        {grouped.map((queue) => (
          <div key={queue.label}>
            <div className={`flex items-center gap-2 mb-3 pb-2 border-b ${queue.color}`}>
              <h2 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                {queue.label}
              </h2>
              <span className="ml-auto text-xs text-zinc-500">
                {queue.sessions.length}
              </span>
            </div>

            {queue.sessions.length === 0 ? (
              <p className="text-xs text-zinc-600 italic">No sessions in this queue</p>
            ) : (
              <div className="space-y-3">
                {queue.sessions.map((s) => (
                  <MatterCard key={s.id} session={s} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Payment gate notice */}
      <div className="mt-8 p-3 bg-zinc-900 border border-amber-900/40 rounded-lg text-xs text-zinc-500">
        <span className="text-amber-600 font-semibold">Payment Gate: </span>
        All RON session creation, signing link release, and document retrieval
        require confirmed payment (status=paid, amount_paid &ge; amount_due).
        Buttons are disabled when gate conditions are not met.
      </div>
    </div>
  );
}
