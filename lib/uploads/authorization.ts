import {createHmac,timingSafeEqual} from 'node:crypto';
import type {NextRequest,NextResponse} from 'next/server';
const COOKIE='ms_intake_upload_v1';
export function issueUploadCapability(target:string,key:string,now=Date.now()) {
 if(!target||!key)throw Error('UPLOAD_AUTHORITY_UNCONFIGURED');const encoded=Buffer.from(JSON.stringify({target,scope:'intake_upload',expires:now+15*60*1000})).toString('base64url');
 return encoded+'.'+createHmac('sha256',key).update(encoded).digest('base64url');
}
export function verifyUploadCapability(token:string|undefined,target:string,key:string|undefined,now=Date.now()) {
 if(!token||!key||token.length>2048)return false;const [encoded,signature,...rest]=token.split('.');if(!encoded||!signature||rest.length)return false;
 const expected=createHmac('sha256',key).update(encoded).digest();const actual=Buffer.from(signature,'base64url');if(actual.length!==expected.length||!timingSafeEqual(actual,expected))return false;
 try{const claim=JSON.parse(Buffer.from(encoded,'base64url').toString());return claim.target===target&&claim.scope==='intake_upload'&&Number.isFinite(claim.expires)&&claim.expires>now&&claim.expires<=now+15*60*1000;}catch{return false;}
}
export async function bindIntakeUploadCapability(response:NextResponse) {
 if(!response.ok)return response;const body=await response.clone().json().catch(()=>null);
 if(body?.success&&typeof body.deal_id==='string'&&process.env.SUPABASE_SERVICE_ROLE_KEY)response.cookies.set(COOKIE,issueUploadCapability(body.deal_id,process.env.SUPABASE_SERVICE_ROLE_KEY),{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'strict',maxAge:900,path:'/api/intake/upload'});
 return response;
}
export async function authorizeMatterUpload(request:NextRequest,target:string,publicIntake=false) {
 if(request.headers.get('origin')!==new URL(request.url).origin||request.headers.get('sec-fetch-site')==='cross-site')return false;
 if(publicIntake&&verifyUploadCapability(request.cookies.get(COOKIE)?.value,target,process.env.SUPABASE_SERVICE_ROLE_KEY))return {actorId:'intake_capability'};
 const [{createClient},{resolveServerRole},{isRouteAllowedForRole},{getCurrentClientDeal}]=await Promise.all([import('@/lib/supabase/server'),import('@/lib/auth/server-role'),import('@/lib/auth/roleRedirect'),import('@/lib/portalAuth')]);
 const client=await createClient();const {data:{user}}=await client.auth.getUser();if(!user)return false;
 const role=await resolveServerRole(user);if(isRouteAllowedForRole('/dashboard',role))return {actorId:user.id};
 const context=await getCurrentClientDeal(target);return context?.deal?.id===target?{actorId:user.id}:false;
}
