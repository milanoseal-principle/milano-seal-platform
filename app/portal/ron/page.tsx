import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { portalRONProjection } from '@/lib/bluenotary/projection';
import { PortalRONStatusCard } from '@/components/ron/PortalRONStatusCard';
import type { RONSession, RONSigner } from '@/lib/bluenotary/types';

export const metadata: Metadata = {
  title: 'Remote Online Notarization — The Milano Seal™',
  description: 'Your secure online notarization session.',
};

export default async function PortalRONPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    redirect('/login?next=/portal/ron');
  }

  const email = user.email.toLowerCase();
  const admin = createAdminClient();

  // Find the matter linked to this portal user
  const { data: deal } = await admin
    .from('deals')
    .select('id, payment_status')
    .ilike('email', email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!deal) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-white mb-4">Remote Online Notarization</h1>
        <p className="text-zinc-400 text-sm">
          No active matter found. Please contact your coordinator if you believe this is an error.
        </p>
      </div>
    );
  }

  // Find the active RON session
  const { data: session } = await admin
    .from('ron_sessions')
    .select('*')
    .eq('matter_id', deal.id)
    .not('milano_ron_status', 'in', '("RON_EXPIRED")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <h1 className="text-2xl font-bold text-white mb-4">Remote Online Notarization</h1>
        <p className="text-zinc-400 text-sm leading-relaxed">
          Your online notarization session is coordinated through a secure execution process.
          Your coordinator will release session access when your matter is ready.
        </p>
        <p className="text-zinc-600 text-xs mt-4">
          No active notarization session at this time.
        </p>
      </div>
    );
  }

  // Load signers for projection
  const { data: signers } = await admin
    .from('ron_signers')
    .select('id, email, signing_url_encrypted, signing_url_released, identity_status, kba_status, biometric_status')
    .eq('ron_session_id', session.id);

  // Apply portal-safe projection — NEVER exposes internal BN fields
  const projection = portalRONProjection(
    session as RONSession,
    (signers ?? []) as RONSigner[],
    email
  );

  return (
    <div className="max-w-lg mx-auto px-4 py-16">
      <h1 className="text-2xl font-bold text-white mb-2">Remote Online Notarization</h1>
      <p className="text-zinc-500 text-sm mb-8">
        Your secure notarization session powered by The Milano Seal&trade; execution platform.
      </p>

      <PortalRONStatusCard projection={projection} />

      <p className="text-zinc-600 text-xs mt-6 leading-relaxed">
        Your online notarization session is coordinated through a secure execution process.
        Your coordinator will release session access when your matter is ready.
        If you have questions, please contact your assigned coordinator.
      </p>
    </div>
  );
}
