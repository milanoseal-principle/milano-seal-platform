import { governanceResponse,governanceSnapshot,governanceMutation } from '@/lib/control-plane/governance/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export async function GET(request:Request){return governanceResponse(()=>governanceSnapshot(request));}
export async function POST(request:Request){return governanceResponse(()=>governanceMutation(request));}
