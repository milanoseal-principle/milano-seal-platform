import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { routeOrbQuery, OrbChatRequest, OrbChatResponse } from '@/lib/orb/orbIntelligence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest): Promise<NextResponse> {
  // Auth guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const message = body.message as string | undefined;
  const role = body.role as OrbChatRequest['role'] | undefined;
  const matter_id = body.matter_id as string | null | undefined;

  if (!message || typeof message !== 'string') {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  if (message.length > 500) {
    return NextResponse.json({ error: 'Message too long (max 500 characters)' }, { status: 400 });
  }

  if (
    !role ||
    !['founder_admin', 'operator', 'client', 'va'].includes(role)
  ) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
  }

  // Fetch deal if matter_id provided
  let deal: Record<string, unknown> | null = null;
  if (matter_id) {
    const adminSupabase = await createClient();
    const { data } = await adminSupabase
      .from('deals')
      .select('id, deal_id, payment_status, amount_due, amount_paid, status')
      .eq('id', matter_id)
      .single();
    deal = data ?? null;
  }

  const orbReq: OrbChatRequest = { message, role, matter_id: matter_id ?? null };
  const response: OrbChatResponse = routeOrbQuery(orbReq, deal);

  return NextResponse.json(response);
}
