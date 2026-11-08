import {governanceActor,sameOrigin,readGovernanceJson,governanceResponse,governanceRateLimit} from '@/lib/control-plane/governance/server';
export const certificationActor=governanceActor;
export const certificationResponse=governanceResponse;
export async function certificationInput(request:Request){sameOrigin(request);const actor=await governanceActor();await governanceRateLimit(actor.id,'write');return readGovernanceJson(request);}
