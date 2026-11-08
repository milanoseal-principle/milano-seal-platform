import { ronEvidenceFailure } from '@/lib/bluenotary/evidenceFailures';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { resolveServerRole } from '@/lib/auth/server-role';
import { canPerformProtectedMatterTransition } from '@/lib/auth/protectedMatterTransitions';
const ronEvidenceRequestSchema = z.object({expected_evidence_id:z.string().uuid(),reason:z.string().trim().min(10).max(500)}).strict();

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await createClient();
  const { data: { user } } = await session.auth.getUser();
  if (!user) return NextResponse.json({ error:'UNAUTHENTICATED' },{ status:401 });
  if (!canPerformProtectedMatterTransition(await resolveServerRole(user))) return NextResponse.json({ error:'FORBIDDEN' },{ status:403 });
  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) return NextResponse.json({error:'INVALID_SESSION_ID'},{status:400});
  const parsed = ronEvidenceRequestSchema.safeParse(await request.json().catch(()=>null));
  if (!parsed.success) return NextResponse.json({error:'EVIDENCE_REVIEW_REQUIRED',fields:parsed.error.issues.map(i=>i.path.join('.'))},{status:400});
  const { data,error } = await createAdminClient().rpc('reopen_ron_statutory_evidence', {
    p_session_id:id,p_actor_id:user.id,p_expected_evidence_id:parsed.data.expected_evidence_id,
    p_reason:parsed.data.reason,
  });
  if (error || !data || typeof data.evidence_id !== 'string') return NextResponse.json(ronEvidenceFailure(error),{status:error?.code==='42501'?403:error?.code==='40001'?409:422});
  return NextResponse.json({ok:true,...data});
}
