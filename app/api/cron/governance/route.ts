import {timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {runGovernanceJob,governanceRuntimeStatus} from '@/lib/control-plane/governance/runtime';
export const runtime='nodejs';export const maxDuration=60;
export async function GET(request:Request){
 const secret=process.env.CRON_SECRET;if(!secret)return NextResponse.json({error:'CRON_UNCONFIGURED'},{status:503});
 const actual=Buffer.from(request.headers.get('authorization')??''),expected=Buffer.from(`Bearer ${secret}`);
 if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return NextResponse.json({error:'UNAUTHORIZED'},{status:401});
 if(!governanceRuntimeStatus().execution_available)return NextResponse.json({status:'NOT_ACTIVATED'});
 try{const admin=createAdminClient();const queued=await admin.rpc('governance_enqueue_briefs');if(queued.error)throw Error('SCHEDULER_FAILED');return NextResponse.json({...await runGovernanceJob(admin),scheduled:queued.data});}catch{return NextResponse.json({error:'GOVERNANCE_JOB_NOT_CONFIRMED',owner:'MILANO'},{status:503});}
}
