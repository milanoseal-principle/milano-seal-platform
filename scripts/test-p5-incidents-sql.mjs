// Isolated actual-migration regression; no hosted records or statutory facts.
import { PGlite } from '@electric-sql/pglite';
import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';
const db=new PGlite();
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;
create schema auth;create table auth.users(id uuid primary key,raw_app_meta_data jsonb,banned_until timestamptz);
create function auth.uid() returns uuid language sql as $$select null::uuid$$;
create function auth.jwt() returns jsonb language sql as $$select '{}'::jsonb$$;
create function auth.email() returns text language sql as $$select ''::text$$;
create table public.deals(id uuid primary key,email text,execution_truth jsonb,witnesses int default 0,status text,deal_status text);
grant usage on schema public to anon,authenticated,service_role;`);
for(const name of ['025_execution_qa_and_witness_network.sql','034_compliance_incidents.sql','037_identifier_lock_document_versions.sql','062_bluenotary_ron_production_reconciliation.sql','063_ron_document_storage_bucket.sql','083_ron_provider_capability_evidence.sql'])await db.exec(readFileSync('supabase/migrations/'+name,'utf8'));
await db.exec(`alter table public.compliance_incidents
  add column if not exists matter_id uuid,
  add column if not exists release_frozen boolean not null default true,
  add column if not exists summary text,
  add column if not exists opened_by uuid,
  add column if not exists closed_by uuid,
  add column if not exists closed_at timestamptz;
alter table public.compliance_incidents alter column title drop not null;
alter table public.incident_audit_log alter column actor drop not null;
alter table public.incident_audit_log
  add column if not exists matter_id uuid,
  add column if not exists from_status text,
  add column if not exists to_status text,
  add column if not exists actor_id uuid;
alter table public.compliance_incidents
  drop constraint if exists compliance_incidents_severity_check,
  drop constraint if exists compliance_incidents_status_check;
alter table public.compliance_incidents
  add constraint compliance_incidents_severity_check check (
    severity in ('low','medium','high','critical','LOW','MODERATE','HIGH','CRITICAL')
  ),
  add constraint compliance_incidents_status_check check (
    status in (
      'OPEN','INVESTIGATING','REMEDIATION_IN_PROGRESS','PENDING_CLIENT','RESOLVED','CLOSED','FROZEN',
      'INCIDENT_OPENED','RECORDS_PRESERVED','ROOT_CAUSE_REVIEW','CLIENT_IMPACT_REVIEW',
      'CORRECTION_PLAN_DRAFTED','FOUNDER_APPROVED_RESPONSE','CLIENT_NOTIFIED',
      'CORRECTION_EXECUTED','DISCOUNT_OR_COURTESY_REVIEW','FINAL_QA_COMPLETED',
      'MATTER_RESTORED_OR_CLOSED'
    )
  );`);
await db.exec(readFileSync('supabase/migrations/20261108041000_ron_incident_enum_extensions.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261108042000_p4_ron_statutory_evidence.sql','utf8'));
await db.exec(readFileSync('supabase/migrations/20261108090916_ron_incident_evidence_controls.sql','utf8'));
const actor=crypto.randomUUID(),client=crypto.randomUUID(),matter=crypto.randomUUID(),session=crypto.randomUUID(),incident=crypto.randomUUID();
await db.query(`insert into auth.users values ($1,'{"role":"admin_operator"}',null),($2,'{"role":"client"}',null)`,[actor,client]);
await db.query(`insert into deals(id,execution_truth) values($1,'{"notary_jurisdiction":"FL"}')`,[matter]);
await db.query(`insert into ron_sessions(id,matter_id,notarization_id) values($1,$2,'incident-fixture')`,[session,matter]);
const detected='2026-01-01T12:00:00Z';
const evidence={category:'JOURNAL',containment:'OPEN',authority_basis_reference:'fixture:notification-review',responsible_operator:actor,required_authorities:['FLORIDA_DEPARTMENT_OF_STATE','LAW_ENFORCEMENT'],notifications:{}};
const record=async(e=evidence,status='INCIDENT_OPENED',who=actor,date=detected,sid=session)=>db.query('select record_ron_security_incident($1,$2,$3,$4,$5,$6,$7)',[who,incident,sid,date,'Controlled journal compromise fixture',status,e]);
let passed=0;
async function denied(fn,message){await assert.rejects(fn,undefined,message);passed++;}
await denied(()=>record(evidence,'INCIDENT_OPENED',client),'client cannot record incidents');
await denied(()=>record(null),'null incident evidence cannot bypass controls');
await denied(()=>record(evidence,'INCIDENT_OPENED',actor,'2999-01-01T12:00:00Z'),'future detection rejected');
await record();passed++;
await record();passed++;
assert.equal((await db.query('select count(*)::int n from incident_audit_log where incident_id=$1',[incident])).rows[0].n,1);passed++;
await denied(()=>db.query("update compliance_incidents set status='ROOT_CAUSE_REVIEW' where id=$1",[incident]),'direct writes cannot skip the audit transaction');
await denied(()=>record(evidence,'CLOSED'),'closure needs evidence');
await denied(()=>record(evidence,'OPEN',actor,'2026-01-02T12:00:00Z'),'detection cannot move the deadline');
await denied(()=>record({...evidence,notifications:{LAW_ENFORCEMENT:{sent_at:detected}}}),'notification needs evidence reference');
await denied(()=>record({...evidence,notifications:{LAW_ENFORCEMENT:{sent_at:'2999-01-01T12:00:00Z',reference:'fixture:future'}}}),'future notification is not sent');
await denied(()=>record({...evidence,notifications:{LAW_ENFORCEMENT:{sent_at:'2025-01-01T12:00:00Z',reference:'fixture:prior'}}}),'notification cannot predate detection');
await denied(()=>record({...evidence,required_authorities:[null]}),'null authority rejected');
await denied(()=>record({...evidence,required_authorities:['LAW_ENFORCEMENT','LAW_ENFORCEMENT']}),'duplicate authority rejected');
await denied(()=>record(evidence,null),'null status rejected');
await denied(()=>record({...evidence,required_authorities:['unknown']}),'unknown authority rejected');
await denied(()=>record({...evidence,notifications:{UNKNOWN:{sent_at:detected,reference:'fixture:authority'}}}),'unknown recipient rejected');
await denied(()=>db.query('delete from compliance_incidents where id=$1',[incident]),'incident history cannot delete');
await denied(()=>db.query('update compliance_incidents set ron_security_evidence=null where id=$1',[incident]),'cannot strip controls');
const notified={...evidence,containment:'CONTAINED',notifications:{LAW_ENFORCEMENT:{sent_at:'2026-01-02T12:00:00Z',reference:'fixture:police'}}};
await record(notified,'ROOT_CAUSE_REVIEW');passed++;
await denied(()=>record(evidence,'ROOT_CAUSE_REVIEW'),'sent notification cannot be erased');
await denied(()=>record({...notified,required_authorities:['LAW_ENFORCEMENT']},'ROOT_CAUSE_REVIEW'),'required authorities cannot be removed');
const closed={...notified,containment:'REMEDIATED',notifications:{...notified.notifications,FLORIDA_DEPARTMENT_OF_STATE:{sent_at:'2026-01-03T12:00:00Z',reference:'fixture:dos'}},remediation_reference:'fixture:remediation',credential_action_reference:'fixture:revocation',closure_reference:'fixture:closure'};
await record(closed,'CLOSED');passed++;
await denied(()=>record(closed,'INCIDENT_OPENED'),'closed incident cannot be silently reopened');
assert.equal((await db.query('select count(*)::int n from incident_audit_log where incident_id=$1',[incident])).rows[0].n,3);passed++;
assert.equal((await db.query("select metadata->>'notification_due_at' due from incident_audit_log where incident_id=$1 limit 1",[incident])).rows[0].due,'2026-01-08T12:00:00+00:00');passed++;
await denied(()=>db.query("delete from incident_audit_log where incident_id=$1",[incident]),'audit deletion denied');
await denied(()=>db.query("update incident_audit_log set metadata='{}' where incident_id=$1",[incident]),'audit rewrite denied');
await db.exec('grant select on compliance_incidents to authenticated;set role authenticated');
assert.equal((await db.query('select count(*)::int n from compliance_incidents')).rows[0].n,0);passed++;
await denied(()=>record(),'browser cannot invoke privileged incident RPC');
await db.exec('reset role');
await db.query("update auth.users set raw_app_meta_data=raw_app_meta_data||'{\"disabled\":true}' where id=$1",[actor]);
await denied(()=>record(),'disabled operator cannot invoke');
console.log(`PASS ${passed} RON incident database checks; isolated fixtures, no authority notifications sent.`);
await db.close();
