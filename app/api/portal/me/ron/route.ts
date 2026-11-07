import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { portalRONProjection } from '@/lib/bluenotary/projection';
import type { RONSession, RONSigner } from '@/lib/bluenotary/types';
import { emailsMatch, normalizeEmail } from '@/lib/auth/clientAccount';

// GET /api/portal/me/ron — client-safe RON status for logged-in portal user
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = normalizeEmail(user.email);
  const emailPattern = email.replace(/[\\%_]/g, "\\  const email = user.email.toLowerCase();");
  const admin = createAdminClient();

  // Find the matter linked to this portal user
  const { data: deal } = await admin
    .from('deals')
    .select('id, email, payment_status')
    .ilike('email', emailPattern)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!deal || !emailsMatch(deal.email, email)) {
    return NextResponse.json({ ron_session: null });
  }

  // Find the active RON session for this matter
  const { data: session } = await admin
    .from('ron_sessions')
    .select('*')
    .eq('matter_id', deal.id)
    .not('milano_ron_status', 'in', '("RON_EXPIRED")')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!session) {
    return NextResponse.json({ ron_session: null });
  }

  // Load signers
  const { data: signers } = await admin
    .from('ron_signers')
    .select('id, email, signing_url_encrypted, signing_url_released, identity_status, kba_status, biometric_status')
    .eq('ron_session_id', session.id);

  // Apply portal-safe projection — NEVER exposes raw BN status, base64, or internal fields
  const projection = portalRONProjection(
    session as RONSession,
    (signers ?? []) as RONSigner[],
    email
  );

  return NextResponse.json({ ron_session: projection });
}
