import { governanceResponse,governanceActor,sameOrigin } from '@/lib/control-plane/governance/server';
import { runGovernanceJob } from '@/lib/control-plane/governance/runtime';
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime='nodejs';export const maxDuration=60;
export async function POST(request:Request){return governanceResponse(async()=>{sameOrigin(request);await governanceActor(true);return runGovernanceJob(createAdminClient());});}
