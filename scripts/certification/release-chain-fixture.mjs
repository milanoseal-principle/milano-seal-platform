import {randomUUID,createHash} from 'node:crypto';
// Synthetic Florida -> France apostille Matter, paid and in apostille_processing, with
// governed document-version builders. Shared by P22 (authentication/release) and the
// P23 concurrency harness. Every connection-taking helper defaults to `db`, so a
// concurrency worker can issue the same canonical call from its own backend session.
// Synthetic authority evidence only: no government submission, no courier, no provider I/O.
export async function prepareAuthenticationMatter(db,f,actor){
 const matter=await f.create();
 const authority=(await db.query("select id from state_authorities where state_code='FL' limit 1")).rows[0].id;
 await db.query("update state_authorities set status='VERIFIED',confidence='OFFICIAL_SOURCE',official_source_url='https://dos.fl.gov/simulation-only',source_verified_at=now(),next_review_at=now()+interval '1 year',verified_by=$1 where id=$2",[actor,authority]);
 const facts={origin_state:'Florida',destination_country:'France',document_type:'Power of Attorney',apostille_required:true,execution_truth:{execution_method:'in_person',authority_packet:{authority_id:authority,route_type:'florida_dos_apostille',dispatch_ready_at:'2026-11-09T00:00:00Z',dispatch_approved_by:actor,qa:{document_count_confirmed:true,official_form_confirmed:true,authority_confirmed:true,fees_confirmed:true,payment_instrument_confirmed:true,return_shipping_confirmed:true,destination_confirmed:true,paper_out_confirmed:true}}}};
 const setFacts=async(patch,conn=db)=>{const keys=Object.keys(patch);if(!keys.every(k=>/^[a-z_]+$/.test(k)))throw Error('UNSAFE_FACT_KEY');await conn.query(`update deals set ${keys.map((k,i)=>`${k}=$${i+1}`).join(',')} where id=$${keys.length+1}`,[...Object.values(patch),matter]);};
 await setFacts(facts);
 await setFacts({final_total:100});const attempt=await f.begin(matter),resource=randomUUID();await f.observe(matter,attempt,resource,'SETTLED');await f.confirm(matter,resource);
 for(const state of ['scheduled','in_execution','apostille_processing'])await db.query('update deals set status=$1,deal_status=$1 where id=$2',[state,matter]);
 const bytes=new Map();
 const insert=async(stage,parent=null,metadata={submission_reference:'SIM-AUTHORITY-SUBMISSION'},target=matter)=>{const id=randomUUID(),data=Buffer.from('Synthetic '+id),hash=createHash('sha256').update(data).digest('hex'),path='simulation/'+id+'.pdf';bytes.set(path,data);await db.query('insert into document_versions(id,matter_id,stage,parent_version_id,file_hash,actor,source_file,storage_path,metadata) values($1,$2,$3,$4,$5,$6,$7,$7,$8)',[id,target,stage,parent,hash,actor,path,metadata]);return id;};
 const approve=async(id,conn=db,by=actor)=>{const v=(await db.query('select * from document_versions where id=$1',[id])).rows[0];return conn.query('select approve_document_version($1,$2,$3,$4)',[by,id,v.file_hash,'Synthetic founder review of exact artifact and authority evidence']);};
 const release=(ids,conn=db,by=actor)=>conn.query('select record_document_release($1,$2,$3) result',[by,matter,ids]);
 // Full exact chain: executed source -> submitted packet -> returned apostille -> final packet.
 const chain=async()=>{const source=await insert('executed');await approve(source);const submitted=await insert('apostille_packet',source);await approve(submitted);
  const returned=await insert('apostilled',submitted);await approve(returned);const final=await insert('final_packet',returned);await approve(final);return {source,submitted,returned,final};};
 return {matter,authority,facts,setFacts,bytes,insert,approve,release,chain};
}
