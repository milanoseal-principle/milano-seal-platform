import { NextResponse } from 'next/server';
import { getCurrentClientDeal } from '@/lib/portalAuth';
import { createAdminClient } from '@/lib/supabase/admin';
export const dynamic='force-dynamic';
export async function GET(request:Request) {
 const url=new URL(request.url);const ctx=await getCurrentClientDeal(url.searchParams.get('deal_id'));if(!ctx?.deal)return NextResponse.json({error:'UNAUTHORIZED'},{status:403});
 const {data,error}=await createAdminClient().from('notifications').select('id,type,subject,delivery_status,queued_at,provider_accepted_at,delivered_at,failed_at,bounced_at,suppressed_at,created_at').eq('deal_id',ctx.deal.id).eq('recipient_email',ctx.email).order('created_at',{ascending:false}).order('id',{ascending:false}).limit(50);
 if(error)return NextResponse.json({error:'NOTIFICATION_STATUS_UNAVAILABLE',next_action:'Your Matter remains available in the portal. Contact your coordinator if a message is missing.'},{status:503});
 return NextResponse.json({notifications:data??[],scope:'LATEST_50_FOR_THIS_RECIPIENT',next_action:'Provider acceptance is separate from delivery. Review Matter details in the portal even when email delivery needs attention.'},{headers:{'Cache-Control':'private, no-store'}});
}
