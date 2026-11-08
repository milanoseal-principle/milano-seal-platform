import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveServerRole } from '@/lib/auth/server-role';

export const runtime = 'nodejs';

const OPERATOR_ROLES = new Set(['founder_admin', 'admin_operator']);
const Input = z.object({
  reviewId: z.string().uuid(),
  sessionId: z.string().uuid(),
  // A governed evidence reference, not a raw identity document or provider URL.
  evidenceReference: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9:_./-]{2,255}$/),
}).strict();

const failureCodes = new Set([
  'RON_QA_REVIEW_NOT_FOUND',
  'RON_QA_REVIEW_NOT_EDITABLE',
  'GOVERNED_WITNESS_REQUIREMENT_MISSING',
  'RON_PROVIDER_COMPLETION_EVIDENCE_REQUIRED',
  'WITNESS_EVIDENCE_INCOMPLETE',
  'WITNESS_QA_VALIDATED_EVIDENCE_REFERENCE_REQUIRED',
]);

// Governed witness QA, not a manual status override. The database function
// checks the actual Matter requirement, provider session and witness records,
// and atomically appends the canonical Matter evidence event.
export async function POST(request: NextRequest, { params }: { params: Promise<{ matterId: string }> }) {
  const { matterId } = await params;
  if (!z.string().uuid().safeParse(matterId).success) {
    return NextResponse.json({ ok: false, code: 'INVALID_MATTER_ID' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ ok: false, code: 'UNAUTHORIZED' }, { status: 401 });
  }
  const role = await resolveServerRole(user);
  if (!OPERATOR_ROLES.has(role)) {
    return NextResponse.json({ ok: false, code: 'FORBIDDEN' }, { status: 403 });
  }

  const body = Input.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ ok: false, code: 'INVALID_WITNESS_QA_INPUT' }, { status: 422 });
  }

  const { data, error } = await createAdminClient().rpc('complete_ron_witness_qa', {
    p_matter: matterId,
    p_review: body.data.reviewId,
    p_session: body.data.sessionId,
    p_actor: user.id,
    p_reference: body.data.evidenceReference,
  });
  if (error || !data) {
    const candidate = String(error?.message ?? '').split(':')[0].trim();
    const code = failureCodes.has(candidate) ? candidate : 'WITNESS_QA_REVIEW_REQUIRED';
    return NextResponse.json({ ok: false, code }, { status: 409 });
  }

  return NextResponse.json({ ok: true, reviewId: data, witnessStatus: 'COMPLETE' });
}
