import { governanceResponse,governanceActor,sameOrigin,GovernanceHTTPError } from '@/lib/control-plane/governance/server';
import { createAdminClient } from '@/lib/supabase/admin';
export const runtime='nodejs';
export async function POST(request:Request){return governanceResponse(async()=>{sameOrigin(request);const actor=await governanceActor(true);const result=await createAdminClient().rpc('governance_metrics',{p_actor:actor.id});if(result.error)throw new GovernanceHTTPError('CANONICAL_FINANCE_UNAVAILABLE',503);return result.data;});}
