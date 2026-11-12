// P23 stage 18: genuine parallel-session concurrency certification.
// Runs canonical SQL authority functions from independent PostgreSQL backends
// against a freshly created, disposable local database. It never connects to a
// hosted project, never calls providers, and refuses to run unless isolation is
// positively proven before the first write.
import {PsqlSession} from './psql-session.mjs';
import {randomUUID,randomBytes,createHash} from 'node:crypto';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {wiseFixtures} from './shared.mjs';
import {prepareAuthenticationMatter} from './release-chain-fixture.mjs';
import {prepareRonSession} from './ron-matter-fixture.mjs';

const started=Date.now();
const sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();
const tree=execFileSync('git',['rev-parse','HEAD^{tree}'],{encoding:'utf8'}).trim();
const report={phase:'P23_CONCURRENCY',run_id:randomUUID(),source_sha:sha,source_tree:tree,live_certification:false,
 database:{},isolation:[],scenarios:[],failures:[],status:'FAIL'};
const save=()=>{mkdirSync('artifacts/certification',{recursive:true});report.runtime_ms=Date.now()-started;
 writeFileSync('artifacts/certification/p23-concurrency.json',JSON.stringify(report,null,2)+'\n');};

// ---------------------------------------------------------------- isolation
// Only a Unix socket directory or a loopback host is accepted. The server must
// also report a loopback/socket address for this very session, so an SSH tunnel
// or port-forward to a hosted database is refused even when it listens locally.
const host=process.env.P23_CONCURRENCY_PGHOST??'';
const port=Number(process.env.P23_CONCURRENCY_PGPORT??5432);
const user=process.env.P23_CONCURRENCY_PGUSER??'postgres';
function guardTarget(){
 if(!host)throw Error('P23_CONCURRENCY_PGHOST_REQUIRED: a local socket directory or loopback host');
 const socket=host.startsWith('/'),loopback=['localhost','127.0.0.1','::1'].includes(host);
 if(!socket&&!loopback)throw Error('NON_LOCAL_DATABASE_REFUSED');
 for(const key of ['PGHOST','PGHOSTADDR','DATABASE_URL','SUPABASE_DB_URL','POSTGRES_URL'])
  if(process.env[key]&&/supabase|pooler|amazonaws|neon|render/i.test(process.env[key]))throw Error('HOSTED_DATABASE_ENVIRONMENT_REFUSED:'+key);
 report.isolation.push(socket?'target is a Unix socket directory':'target is a loopback host');
}
const connect=async database=>{const c=new PsqlSession({host,port,user,database});await c.query('select 1 ready');return c;};
async function provePositiveIdentity(admin){
 const r=(await admin.query("select inet_server_addr()::text addr,current_setting('server_version') v,current_setting('server_version_num')::int n,current_setting('listen_addresses') listen")).rows[0];
 // A GitHub Actions service container is reached through Docker's bridge (172.16.0.0/12).
 // That is accepted only inside Actions and only when the workflow declares the service.
 const dockerService=process.env.GITHUB_ACTIONS==='true'&&process.env.P23_CONCURRENCY_SERVICE_CONTAINER==='true'&&/^172\.(1[6-9]|2\d|3[01])\./.test(r.addr??'');
 if(r.addr&&!/^(127\.|::1)/.test(r.addr)&&!dockerService)throw Error('SERVER_REPORTS_NON_LOOPBACK_ADDRESS_REFUSED');
 if(dockerService)report.isolation.push('GitHub Actions disposable service container on the Docker bridge network');
 if(await admin.query("select 1 from pg_namespace where nspname='supabase_migrations'").then(x=>x.rowCount))throw Error('HOSTED_SUPABASE_CATALOG_REFUSED');
 report.database={engine:'PostgreSQL',version:r.v,version_num:r.n,listen_addresses:r.listen,server_addr:r.addr??'unix-socket'};
 report.isolation.push(`server session address ${r.addr??'unix-socket'}; no supabase_migrations catalog`);
}

// ------------------------------------------------------------ schema build
async function buildDatabase(dbname){
 const prelude=readFileSync('scripts/lib/migration-fixture.mjs','utf8').match(/db\.exec\(`([\s\S]*?)`\)/)[1];
 const statements=prelude.split(';').map(s=>s.trim()).filter(Boolean);
 const db=await connect(dbname);
 // Fresh database: the marker is created only after the target was proven local and empty.
 const tables=(await db.query("select count(*)::int n from pg_tables where schemaname='public'")).rows[0].n;
 if(tables!==0)throw Error('DISPOSABLE_DATABASE_NOT_EMPTY');
 await db.query('create table public.p23_concurrency_marker(run_id uuid primary key,created_at timestamptz default now())');
 await db.query('insert into public.p23_concurrency_marker(run_id) values($1)',[report.run_id]);
 await db.query('create extension if not exists pgcrypto');
 for(const s of statements.filter(s=>/^create role/i.test(s))){const role=s.match(/create role (\w+)/i)[1];
  if(!(await db.query('select 1 from pg_roles where rolname=$1',[role])).rowCount)await db.query(s);}
 for(const statement of statements.filter(s=>!/^create role/i.test(s)))await db.query(statement);
 const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json','utf8'));
 const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();
 const order=[...plan.fresh_database_prerequisites,...files.filter(f=>!plan.fresh_database_prerequisites.includes(f))];
 // Multi-statement migration files run through psql -f with ON_ERROR_STOP on the same disposable database.
 for(const f of order){try{execFileSync('psql',['-h',host,'-p',String(port),'-U',user,'-d',dbname,'-X','-q','-v','ON_ERROR_STOP=1','-f','supabase/migrations/'+f],{stdio:['ignore','ignore','pipe']});}
  catch(e){throw Error(`MIGRATION_FAILED ${f}: ${String(e.stderr).split('\n')[0]}`);}}
 report.database.migrations_applied=order.length;
 return db;
}

// ------------------------------------------------------------- race engine
// Each worker is a separate client (separate backend). Workers open a
// transaction and block on a shared advisory lock held by the controller. The
// controller releases only after every worker backend is observed waiting in
// pg_locks, which proves the operations overlap; it is not a timing guess.
const BARRIER_KEY=7_230_023;
async function race(dbname,admin,count,operation,{rollback=()=>false}={}){
 const clients=await Promise.all(Array.from({length:count},()=>connect(dbname)));
 let runs=[];
 try{
  await admin.query('select pg_advisory_lock($1)',[BARRIER_KEY]);
  const pids=await Promise.all(clients.map(c=>c.query('select pg_backend_pid() pid').then(r=>r.rows[0].pid)));
  runs=clients.map((c,i)=>(async()=>{
   await c.query('begin');
   await c.query('select pg_advisory_xact_lock_shared($1)',[BARRIER_KEY]);
   const t0=Date.now();
   try{const value=await operation(c,i);
    if(rollback(i)){await c.query('rollback');return {ok:true,value,rolled_back:true,t0,t1:Date.now()};}
    await c.query('commit');return {ok:true,value,t0,t1:Date.now()};}
   catch(e){await c.query('rollback').catch(()=>{});return {ok:false,code:e.code,message:String(e.message).split('\n')[0].slice(0,120),t0,t1:Date.now()};}
  })());
  const deadline=Date.now()+15000;let waiting=0;
  while(Date.now()<deadline){
   waiting=(await admin.query("select count(distinct pid)::int n from pg_locks where locktype='advisory' and not granted and pid=any($1)",[pids])).rows[0].n;
   if(waiting===count)break;await new Promise(r=>setTimeout(r,10));
  }
  if(waiting!==count)throw Error(`BARRIER_NOT_REACHED ${waiting}/${count}`);
  await admin.query('select pg_advisory_unlock($1)',[BARRIER_KEY]);
  const results=await Promise.all(runs);
  return {results,pids,overlap_waiting_backends:waiting,distinct_backends:new Set(pids).size};
 }finally{
  // Release the barrier and let every worker finish (commit or roll back) before closing sessions.
  await admin.query('select pg_advisory_unlock_all()');await Promise.allSettled(runs);
  await Promise.all(clients.map(c=>c.end().catch(()=>{})));
 }
}
const summary=results=>{const out={committed:0,rolled_back:0,rejected:{}};for(const r of results){if(r.ok&&!r.rolled_back)out.committed++;else if(r.ok)out.rolled_back++;else{const k=r.code+':'+r.message.split(':')[0];out.rejected[k]=(out.rejected[k]??0)+1;}}return out;};

// ---------------------------------------------------------------- scenarios
async function main(){
 guardTarget();
 const admin=await connect('postgres');
 // Everything after connecting runs inside the cleanup scope, so a refused target or a
 // failed CREATE DATABASE still closes the admin session and the process exits.
 let db,dbname=null;
 try{
  await provePositiveIdentity(admin);
  dbname='p23_conc_'+randomBytes(6).toString('hex');
  await admin.query(`create database ${dbname}`);
  report.database.name=dbname;report.isolation.push(`fresh randomly named database ${dbname}, empty before marker`);
  db=await buildDatabase(dbname);
  const coord=await connect(dbname);
  const fx=await wiseFixtures(db);
  const operator=randomUUID();
  await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'p23-operator@example.invalid','{\"role\":\"founder_admin\"}')",[operator]);
  let lastRace=null;
  const scenario=async(id,invariants,label,fn)=>{const entry={id,invariants,label,status:'FAIL'};report.scenarios.push(entry);lastRace=null;
   try{Object.assign(entry,await fn());entry.status='PASS';}
   catch(e){entry.error=String(e.message).split('\n')[0].slice(0,300);if(lastRace)Object.assign(entry,{sessions:lastRace.distinct_backends,overlap:lastRace.overlap_waiting_backends,outcomes:summary(lastRace.results)});report.failures.push({id,message:entry.error});}};
  const raceIn=async(...args)=>(lastRace=await race(dbname,coord,...args));
  const ready=async()=>{const id=await fx.create();const attempt=await fx.begin(id);const resource='SIM-RESOURCE-'+randomUUID();await fx.observe(id,attempt,resource,'SETTLED');return {id,attempt,resource};};
  // Same canonical call as wiseFixtures.confirm, issued on the worker's own session.
  const confirmOn=async(c,id,resource,change={})=>{const ref=(await c.query('select wise_reference from deals where id=$1',[id])).rows[0].wise_reference;
   return c.query('select confirm_wise_payment_for_deal($1,$2,$3,$4,$5,$6)',[id,change.reference??ref,resource,change.amount??100,change.currency??'USD','P23_CONCURRENCY']);};
  const scheduledEvents=async id=>Number((await db.query("select count(*) n from matter_state_events where matter_id=$1 and new_state='scheduled'",[id])).rows[0].n);
  // Detector control: an intentionally unsafe read-modify-write counter. Sequential
  // execution yields exactly 10; genuine overlap loses updates. A result below 10
  // proves the harness really runs operations concurrently and can observe races.
  await scenario('OVERLAP_PROOF',['HARNESS'],'unsafe read-then-write counter loses updates under real overlap',async()=>{
   await db.query('create table p23_unsafe_counter(id int primary key,n int not null)');await db.query('insert into p23_unsafe_counter values(1,0)');
   const r=await raceIn(10,async c=>{const n=(await c.query('select n from p23_unsafe_counter where id=1')).rows[0].n;await c.query('update p23_unsafe_counter set n=$1 where id=1',[n+1]);});
   const n=(await db.query('select n from p23_unsafe_counter where id=1')).rows[0].n;
   // Every worker must commit; otherwise failed workers could leave a low counter that
   // looks like lost updates without any concurrent execution having happened.
   assert.equal(summary(r.results).committed,10,'all 10 counter workers must commit');
   assert.ok(n>=1&&n<10,`expected lost updates under overlap, got ${n}`);
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,final_counter:n,outcomes:summary(r.results)};});

  // Sequential control: ledger growth caused by exactly one confirmation.
  const control=await ready();const before=await fx.ledgerCount(control.id);await fx.confirm(control.id,control.resource);const oneConfirmDelta=await fx.ledgerCount(control.id)-before;
  report.control={single_confirmation_ledger_delta:oneConfirmDelta};

  for(const n of [2,5,10]) await scenario(`SETTLE_DUPLICATE_${n}`,['INV-02','INV-14'],`${n} parallel exact confirmations of one settled attempt`,async()=>{
   const m=await ready();const base=await fx.ledgerCount(m.id);
   const r=await raceIn(n,c=>confirmOn(c,m.id,m.resource));
   const row=await fx.load(m.id);
   assert.equal(row.payment_confirmed,true);assert.equal(Number(row.amount_paid),100,'amount must not be credited more than once');
   assert.equal(await fx.ledgerCount(m.id)-base,oneConfirmDelta,'ledger effect must equal one confirmation');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:summary(r.results)};});

  await scenario('WEBHOOK_SAME_EVENT_10',['INV-02','INV-14'],'10 parallel deliveries of one provider event id',async()=>{
   const id=await fx.create();const attempt=await fx.begin(id);const resource='SIM-RESOURCE-'+randomUUID();const event=randomUUID();
   const row=await fx.load(id);const base=await fx.ledgerCount(id);const time=new Date().toISOString();
   const r=await raceIn(10,c=>c.query('select record_wise_attempt_evidence($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',[id,attempt,resource,'IN_PROGRESS',time,100,'USD',row.wise_reference,'wise-webhook',event]));
   const seq=await fx.create();const seqAttempt=await fx.begin(seq);const seqBase=await fx.ledgerCount(seq);
   await fx.observe(seq,seqAttempt,'SIM-RESOURCE-'+randomUUID());const oneEvent=await fx.ledgerCount(seq)-seqBase;
   assert.equal(await fx.ledgerCount(id)-base,oneEvent,'one provider event must have one ledger effect');
   assert.equal((await fx.load(id)).payment_confirmed,false,'processing evidence must not confirm payment');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:summary(r.results)};});

  await scenario('SCHEDULE_UNPAID_10',['INV-03'],'10 parallel scheduling attempts before settlement',async()=>{
   const id=await fx.create();
   const r=await raceIn(10,c=>c.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[id]));
   assert.equal(await scheduledEvents(id),0);assert.equal((await fx.load(id)).status,'awaiting_payment');
   assert.equal(summary(r.results).committed,0,'no unpaid scheduling may commit');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:summary(r.results)};});

  await scenario('SCHEDULE_PAID_10',['INV-04'],'10 parallel scheduling requests after verified settlement',async()=>{
   const m=await ready();await fx.confirm(m.id,m.resource);
   const r=await raceIn(10,c=>c.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[m.id]));
   assert.equal(await scheduledEvents(m.id),1,'exactly one scheduled transition');assert.equal((await fx.load(m.id)).status,'scheduled');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:summary(r.results)};});

  await scenario('SETTLE_RACES_SCHEDULE',['INV-03','INV-04'],'1 confirmation racing 9 scheduling attempts',async()=>{
   const m=await ready();
   const r=await raceIn(10,(c,i)=>i===0?confirmOn(c,m.id,m.resource):c.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[m.id]));
   const row=await fx.load(m.id),events=await scheduledEvents(m.id);
   assert.equal(row.payment_confirmed,true);assert.ok(events<=1,'at most one scheduled transition');
   if(row.status==='scheduled')assert.equal(events,1);
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,final_status:row.status,scheduled_events:events,outcomes:summary(r.results)};});

  await scenario('WRONG_CURRENCY_VS_EXACT',['INV-02'],'5 wrong-currency confirmations racing 5 exact confirmations',async()=>{
   const m=await ready();const base=await fx.ledgerCount(m.id);
   const r=await raceIn(10,(c,i)=>confirmOn(c,m.id,m.resource,i%2?{currency:'EUR'}:{}));
   const row=await fx.load(m.id);
   assert.equal(row.payment_confirmed,true);assert.equal(row.currency,'USD');assert.equal(Number(row.amount_paid),100);
   assert.equal(await fx.ledgerCount(m.id)-base,oneConfirmDelta);
   const s=summary(r.results);assert.ok(Object.keys(s.rejected).some(k=>/currency/.test(k)),'wrong currency must be rejected');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:s};});

  await scenario('ROLLBACK_GRANTS_NOTHING',['INV-13'],'confirmation rolled back while 9 sessions try to schedule',async()=>{
   const m=await ready();
   const r=await raceIn(10,(c,i)=>i===0?confirmOn(c,m.id,m.resource):c.query("update deals set status='scheduled',deal_status='scheduled' where id=$1",[m.id]),{rollback:i=>i===0});
   assert.ok(r.results[0].ok&&r.results[0].rolled_back,'worker 0 must confirm and then roll back');
   const row=await fx.load(m.id);
   assert.equal(row.payment_confirmed,false,'rolled back confirmation must leave no payment authority');
   assert.equal(await scheduledEvents(m.id),0);assert.equal(row.status,'awaiting_payment');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:summary(r.results)};});

  await scenario('ATTEMPT_BEGIN_10',['INV-02'],'10 parallel payment-attempt openings for one Matter',async()=>{
   const id=await fx.create();const row=await fx.load(id);
   const handoffs=[];for(let i=0;i<10;i++){const h=randomUUID();handoffs.push(h);
    await db.query("insert into matter_evidence_ledger(id,matter_id,event_type,domain,actor_type,actor_id,source,metadata) values($1,$2,'WISE_PAYMENT_HANDOFF_OPENED','payment','client',$3,'portal-wise-payment-ritual',$4)",[h,id,fx.actor,{amountDue:100,currency:'USD',wiseReference:row.wise_reference,paymentUrlFingerprint:createHash('sha256').update(row.payment_link).digest('hex')}]);}
   const r=await raceIn(10,(c,i)=>c.query('select begin_wise_payment_attempt($1,$2,$3) result',[id,handoffs[i],fx.actor]).then(x=>x.rows[0].result.payment_attempt_id));
   const current=(await fx.load(id)).payment_attempt_id;const winners=r.results.filter(x=>x.ok).map(x=>x.value);
   assert.ok(current,'a current attempt must exist');assert.ok(winners.includes(current),'current attempt must be one that committed');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,current_attempts:1,committed_attempts:winners.length,outcomes:summary(r.results)};});

  for(const n of [2,10]) await scenario(`COURIER_CLAIM_${n}`,['INV-09','INV-14'],`${n} parallel label claims for one released shipment`,async()=>{
   const m=await ready();await fx.confirm(m.id,m.resource);
   // Release-gate prerequisites (full balance paid, exact release recorded) are certified by
   // P19/P22; they are seeded here so that only the claim race itself is under test.
   await db.query("update deals set balance_payment_status='paid',balance_paid_at=now(),balance_amount_received=100 where id=$1",[m.id]);
   await db.query("insert into custody_ledger(deal_id,event,metadata) values($1,'DOC_RELEASE_CONFIRMED',$2)",[m.id,{document_versions:[randomUUID()],fixture:'P23_CONCURRENCY_PRECONDITION'}]);
   const shipment=randomUUID();await db.query("insert into shippo_shipments(id,matter_id,shippo_rate_id,rate_status) values($1,$2,'SIM-RATE','SHIPPING_RATE_SELECTED')",[shipment,m.id]);
   const r=await raceIn(n,c=>c.query('select claim_final_delivery_label($1,$2,$3) claimed',[operator,m.id,shipment]));
   const s=summary(r.results);assert.equal(s.committed,1,'exactly one claim');
   assert.equal(Object.entries(s.rejected).filter(([k])=>!/SHIPMENT_LABEL_NOT_CLAIMABLE/.test(k)).length,0,'losers must fail with NOT_CLAIMABLE only');
   assert.equal((await db.query('select rate_status from shippo_shipments where id=$1',[shipment])).rows[0].rate_status,'SHIPPING_READY_FOR_LABEL');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:s};});

  await scenario('MULTI_MATTER_CROSS_REFERENCE',['INV-12'],'5 Matters confirmed in parallel with 5 cross-Matter confirmations',async()=>{
   const ms=[];for(let i=0;i<5;i++)ms.push(await ready());
   const refs=[];for(const m of ms)refs.push((await fx.load(m.id)).wise_reference);
   const r=await raceIn(10,(c,i)=>i<5?confirmOn(c,ms[i].id,ms[i].resource):confirmOn(c,ms[i-5].id,ms[(i-4)%5].resource,{reference:refs[(i-4)%5]}));
   for(const m of ms){const row=await fx.load(m.id);assert.equal(row.payment_confirmed,true);assert.equal(Number(row.amount_paid),100);}
   const s=summary(r.results);assert.equal(s.committed,5,'only own-reference confirmations commit');
   return {sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,outcomes:s};});

  // ------------------------------------------------ final four groups (P23 stage 18)
  // Fixtures are the P22 apostille/release chain and the P19 RON session builder, run
  // unchanged; only the raced call is issued from each worker's own backend session.
  const client=randomUUID();
  await db.query("insert into auth.users(id,email,raw_app_meta_data) values($1,'p23-client@example.invalid','{\"role\":\"client\"}')",[client]);
  const count=async(sql,params)=>Number((await db.query(sql,params)).rows[0].n);
  const stateEvents=(id,state)=>count('select count(*) n from matter_state_events where matter_id=$1 and new_state=$2',[id,state]);
  const custodyEvents=(id,event)=>count('select count(*) n from custody_ledger where deal_id=$1 and event=$2',[id,event]);
  const approvals=id=>count("select count(*) n from audit_events where event_type='SECURITY_DOCUMENT_VERSION_APPROVED' and metadata->>'version_id'=$1",[id]);
  const statusOf=async id=>(await fx.load(id)).status;
  const setState=(c,id,next)=>c.query('update deals set status=$1,deal_status=$1 where id=$2',[next,id]);
  const out=(r,extra={})=>({sessions:r.distinct_backends,overlap:r.overlap_waiting_backends,...extra,outcomes:summary(r.results)});
  const onlyRejected=(s,pattern)=>Object.keys(s.rejected).every(k=>pattern.test(k));
  // A rollback scenario proves nothing unless worker 0's write really succeeded before rolling back.
  const rolledBack=r=>assert.ok(r.results[0].ok&&r.results[0].rolled_back,'worker 0 must complete its write and then roll back: '+(r.results[0].message??''));
  // An idempotent retry proves nothing unless every concurrent attempt succeeded.
  const allCommitted=(r,n)=>assert.equal(summary(r.results).committed,n,`all ${n} concurrent retries must succeed`);
  const authenticated=()=>prepareAuthenticationMatter(db,fx,operator);
  const released=async()=>{const a=await authenticated(),v=await a.chain();await a.release([v.final]);return {...a,...v};};
  const delivery=(c,id,key)=>c.query('select append_custody_event($1,$2)',[{deal_id:id,event:'DOC_DELIVERED',actor_type:'system',actor_id:operator,location:null,method:'SIMULATION_ONLY',status:'synthetic_delivery',notes:'Isolated synthetic delivery; no courier/provider transmission',metadata:{mode:'SIMULATION',live_delivery:false}},key]);

  // APOSTILLE EVIDENCE: founder QC of returned authority evidence, and its binding to Matter facts.
  await scenario('APOSTILLE_APPROVE_RETURNED_10',['INV-07','INV-14'],'10 parallel founder approvals of one returned apostille version',async()=>{
   const a=await authenticated();const source=await a.insert('executed');await a.approve(source);const submitted=await a.insert('apostille_packet',source);await a.approve(submitted);
   const returned=await a.insert('apostilled',submitted);
   const r=await raceIn(10,c=>a.approve(returned,c));const s=summary(r.results);
   assert.equal(s.committed,1,'exactly one approval commits');assert.ok(onlyRejected(s,/VERSION_REVIEW_TARGET_MISMATCH/),'losers must see the already-approved version');
   assert.equal(await approvals(returned),1,'exactly one approval audit record');
   assert.equal((await db.query('select approval_status from document_versions where id=$1',[returned])).rows[0].approval_status,'approved');
   return out(r);});

  await scenario('APOSTILLE_APPROVE_UNAUTHORIZED',['INV-07','INV-11'],'5 client approvals racing 5 founder approvals of a submitted packet',async()=>{
   const a=await authenticated();const source=await a.insert('executed');await a.approve(source);const submitted=await a.insert('apostille_packet',source);
   const r=await raceIn(10,(c,i)=>a.approve(submitted,c,i%2?client:operator));const s=summary(r.results);
   assert.equal(s.committed,1);assert.equal(await approvals(submitted),1);
   assert.equal(r.results.filter((x,i)=>i%2&&x.ok).length,0,'no client approval may commit');
   assert.equal((await db.query('select approved_by from document_versions where id=$1',[submitted])).rows[0].approved_by,operator);
   return out(r);});

  await scenario('APOSTILLE_RELEASE_VS_DESTINATION',['INV-07','INV-08'],'1 destination change racing 9 releases bound to returned authority evidence',async()=>{
   const a=await authenticated(),v=await a.chain();
   const r=await raceIn(10,(c,i)=>i===0?a.setFacts({destination_country:'Germany'},c):a.release([v.final],c));
   const releases=r.results.slice(1),released=releases.filter(x=>x.ok).length;
   const custody=await custodyEvents(a.matter,'DOC_RELEASE_CONFIRMED'),dest=(await fx.load(a.matter)).destination_country;
   assert.ok(r.results[0].ok,'the destination change itself is not blocked');assert.equal(dest,'Germany');
   // The deal row lock serializes the change against every release: each release either ran
   // entirely before the change (France evidence) or was refused afterwards; never half of each.
   assert.ok(releases.filter(x=>!x.ok).every(x=>/VERIFIED_AUTHORITY_RETURN_LINEAGE_REQUIRED/.test(x.message)),'releases fail only on invalidated authority evidence');
   assert.equal(custody,released?1:0,'custody exists exactly when a release committed, and only once');
   // After the race the changed destination must refuse any further release.
   await assert.rejects(()=>a.release([v.final]),/VERIFIED_AUTHORITY_RETURN_LINEAGE_REQUIRED/);
   return out(r,{releases_committed_before_change:released,release_custody_records:custody});});

  // DOCUMENT RELEASE: exact final-packet release produces one custody fact.
  for(const n of [2,10]) await scenario(`RELEASE_DUPLICATE_${n}`,['INV-08','INV-14'],`${n} parallel releases of one exact final packet`,async()=>{
   const a=await authenticated(),v=await a.chain();
   const r=await raceIn(n,c=>a.release([v.final],c).then(x=>x.rows[0].result.hash));allCommitted(r,n);
   assert.equal(await custodyEvents(a.matter,'DOC_RELEASE_CONFIRMED'),1,'exactly one release custody record');
   const hashes=new Set(r.results.filter(x=>x.ok).map(x=>x.value));assert.equal(hashes.size,1,'every successful retry returns the same custody hash');
   return out(r,{distinct_release_hashes:hashes.size});});

  await scenario('RELEASE_UNAUTHORIZED',['INV-08','INV-11'],'5 client releases racing 5 founder releases',async()=>{
   const a=await authenticated(),v=await a.chain();
   const r=await raceIn(10,(c,i)=>a.release([v.final],c,i%2?client:operator));
   assert.equal(r.results.filter((x,i)=>i%2&&x.ok).length,0,'no client release may commit');
   assert.equal(await custodyEvents(a.matter,'DOC_RELEASE_CONFIRMED'),1);return out(r);});

  await scenario('RELEASE_STALE_VERSION',['INV-08'],'5 releases of the returned (non-final) version racing 5 exact releases',async()=>{
   const a=await authenticated(),v=await a.chain();
   const r=await raceIn(10,(c,i)=>a.release([i%2?v.returned:v.final],c));
   assert.equal(r.results.filter((x,i)=>i%2&&x.ok).length,0,'a non-final version can never release');
   const rows=(await db.query("select metadata from custody_ledger where deal_id=$1 and event='DOC_RELEASE_CONFIRMED'",[a.matter])).rows;
   assert.equal(rows.length,1);assert.ok(JSON.stringify(rows[0].metadata).includes(v.final),'custody names the exact final packet');
   return out(r);});

  await scenario('RELEASE_ROLLBACK_GRANTS_NOTHING',['INV-08','INV-13'],'release rolled back while 9 sessions try to move the Matter in transit',async()=>{
   const a=await authenticated(),v=await a.chain();
   const r=await raceIn(10,(c,i)=>i===0?a.release([v.final],c):setState(c,a.matter,'in_transit'),{rollback:i=>i===0});rolledBack(r);
   assert.equal(await custodyEvents(a.matter,'DOC_RELEASE_CONFIRMED'),0,'rolled back release leaves no custody');
   assert.equal(await statusOf(a.matter),'apostille_processing');assert.equal(await stateEvents(a.matter,'in_transit'),0);
   return out(r);});

  await scenario('RELEASE_CROSS_MATTER',['INV-12'],'5 releases on Matter A racing 5 releases of A\'s packet under Matter B',async()=>{
   const A=await authenticated(),va=await A.chain(),B=await authenticated();await B.chain();
   const r=await raceIn(10,(c,i)=>i<5?A.release([va.final],c):B.release([va.final],c));
   assert.equal(r.results.slice(5).filter(x=>x.ok).length,0,'another Matter\'s version can never release');
   assert.equal(await custodyEvents(A.matter,'DOC_RELEASE_CONFIRMED'),1);assert.equal(await custodyEvents(B.matter,'DOC_RELEASE_CONFIRMED'),0);
   return out(r);});

  // RON STATUTORY COMPLETION: synthetic session evidence, never a real notarization.
  const ronMatter=async()=>{const m=await ready();await fx.confirm(m.id,m.resource);
   await db.query('update deals set execution_truth=$1 where id=$2',[{execution_method:'ron',notarial_act:'acknowledgment',notary_jurisdiction:'FL',signer_location:'US-FL',ron_kba_status:'required',ron_credential_analysis_status:'required'},m.id]);
   await setState(db,m.id,'scheduled');return m.id;};
  const ronSession=async()=>{const matter=await ronMatter();const ron=await prepareRonSession(db,matter,operator,'a'.repeat(64),Buffer.from('%PDF-1.4\nSynthetic P23 executed '+randomUUID()),assert);return {matter,ron};};
  const appendOn=(c,ron,body,key,by=operator,expected=null)=>c.query('select append_ron_statutory_evidence($1,$2,$3,$4,$5,$6) result',[ron.session,by,expected,key,body,'P23 concurrency statutory evidence review']).then(x=>x.rows[0].result.evidence_id);
  const ronEvidence=id=>count("select count(*) n from ron_audit_events where ron_session_id=$1 and idempotency_key is not null",[id]);
  const ronRow=async id=>(await db.query('select ron_lifecycle_state,completed_at,statutory_evidence_id from ron_sessions where id=$1',[id])).rows[0];

  await scenario('RON_APPEND_SAME_KEY_10',['INV-05','INV-14'],'10 parallel statutory appends with one idempotency key',async()=>{
   const {ron}=await ronSession();const {evidence}=await ron.attachEvidence();const key=randomUUID();
   const r=await raceIn(10,c=>appendOn(c,ron,evidence,key));
   const ids=new Set(r.results.filter(x=>x.ok).map(x=>x.value));
   assert.equal(summary(r.results).committed,10,'idempotent retries all succeed');assert.equal(ids.size,1,'one evidence id');
   assert.equal(await ronEvidence(ron.session),1);assert.equal((await ronRow(ron.session)).statutory_evidence_id,[...ids][0]);
   return out(r);});

  await scenario('RON_APPEND_DISTINCT_KEYS_10',['INV-05'],'10 parallel first statutory appends with distinct keys',async()=>{
   const {ron}=await ronSession();const {evidence}=await ron.attachEvidence();
   const r=await raceIn(10,c=>appendOn(c,ron,evidence,randomUUID()));const s=summary(r.results);
   assert.equal(s.committed,1,'only one first statutory evidence record');assert.ok(onlyRejected(s,/STALE_EVIDENCE/));
   assert.equal(await ronEvidence(ron.session),1);return out(r);});

  await scenario('RON_APPEND_UNAUTHORIZED',['INV-05','INV-11'],'5 client statutory appends racing 5 operator appends',async()=>{
   const {ron}=await ronSession();const {evidence}=await ron.attachEvidence();const key=randomUUID();
   const r=await raceIn(10,(c,i)=>appendOn(c,ron,evidence,key,i%2?client:operator));
   assert.ok(r.results.filter((x,i)=>i%2).every(x=>!x.ok&&x.code==='42501'),'client appends are forbidden');
   assert.equal(await ronEvidence(ron.session),1);return out(r);});

  await scenario('RON_PROVIDER_ONLY_COMPLETION_10',['INV-05'],'10 parallel completions from provider status alone',async()=>{
   const {ron}=await ronSession();
   const r=await raceIn(10,c=>ron.update('ron_sessions',ron.session,{ron_lifecycle_state:'COMPLETED'},c));const s=summary(r.results);
   assert.equal(s.committed,0);assert.ok(onlyRejected(s,/INVALID_RON_LIFECYCLE_TRANSITION/));
   assert.equal((await ronRow(ron.session)).ron_lifecycle_state,'EVIDENCE_PENDING');return out(r);});

  await scenario('RON_COMPLETE_10',['INV-05','INV-14'],'10 parallel Milano completions of one verified session, each with its own timestamp',async()=>{
   const {ron}=await ronSession();const {evidence}=await ron.attachEvidence();await appendOn(db,ron,evidence,randomUUID());await ron.verify();
   // Distinct completion commands: a second completion would have to overwrite completed_at.
   const commands=[];for(let i=0;i<10;i++){commands.push(await ron.fields('complete'));await new Promise(r=>setTimeout(r,2));}
   assert.equal(new Set(commands.map(c=>c.completed_at)).size,10,'each worker carries a distinct completion time');
   const r=await raceIn(10,(c,i)=>ron.update('ron_sessions',ron.session,commands[i],c).then(()=>commands[i].completed_at));const s=summary(r.results);
   assert.equal(s.committed,1,'exactly one completion commits');assert.ok(onlyRejected(s,/RON_EVIDENCE_FROZEN|INVALID_RON_LIFECYCLE_TRANSITION/));
   const row=await ronRow(ron.session),winner=r.results.find(x=>x.ok).value;
   assert.equal(row.ron_lifecycle_state,'COMPLETED');assert.equal(new Date(row.completed_at).toISOString(),new Date(winner).toISOString(),'completion time is the single winner\'s');
   return out(r);});

  await scenario('RON_ROLLBACK_GRANTS_NOTHING',['INV-05','INV-13'],'statutory append rolled back while 9 sessions try to complete',async()=>{
   const {ron}=await ronSession();const {evidence}=await ron.attachEvidence();const completion={ron_lifecycle_state:'COMPLETED'};
   const r=await raceIn(10,(c,i)=>i===0?appendOn(c,ron,evidence,randomUUID()):ron.update('ron_sessions',ron.session,completion,c),{rollback:i=>i===0});rolledBack(r);
   const row=await ronRow(ron.session);assert.equal(row.statutory_evidence_id,null);assert.equal(row.ron_lifecycle_state,'EVIDENCE_PENDING');
   assert.equal(await ronEvidence(ron.session),0);assert.equal(summary(r.results).committed,0);return out(r);});

  await scenario('RON_CROSS_MATTER',['INV-12'],'5 appends on session A racing 5 appends of A\'s evidence on session B',async()=>{
   const A=await ronSession(),B=await ronSession();const ea=await A.ron.attachEvidence();await B.ron.attachEvidence();
   const r=await raceIn(10,(c,i)=>appendOn(c,i<5?A.ron:B.ron,ea.evidence,randomUUID()));
   assert.equal(r.results.slice(5).filter(x=>x.ok).length,0,'evidence for another session can never be appended');
   assert.equal(await ronEvidence(A.ron.session),1);assert.equal(await ronEvidence(B.ron.session),0);return out(r);});

  // MATTER CLOSURE: synthetic delivery evidence and terminal transitions, no real courier.
  await scenario('CLOSE_IN_TRANSIT_10',['INV-10','INV-14'],'10 parallel in-transit transitions after exact release',async()=>{
   const a=await released();const r=await raceIn(10,c=>setState(c,a.matter,'in_transit'));allCommitted(r,10);
   assert.equal(await stateEvents(a.matter,'in_transit'),1);assert.equal(await statusOf(a.matter),'in_transit');return out(r);});

  await scenario('CLOSE_DELIVERY_EVIDENCE_10',['INV-10','INV-14'],'10 parallel synthetic delivery confirmations with one key',async()=>{
   const a=await released();await setState(db,a.matter,'in_transit');const key='P23-DELIVERY-'+a.matter;
   const r=await raceIn(10,c=>delivery(c,a.matter,key));allCommitted(r,10);
   assert.equal(await custodyEvents(a.matter,'DOC_DELIVERED'),1,'one delivery custody record');return out(r);});

  await scenario('CLOSE_DELIVERED_WITHOUT_EVIDENCE_10',['INV-10'],'10 parallel delivered transitions without delivery evidence',async()=>{
   const a=await released();await setState(db,a.matter,'in_transit');
   const r=await raceIn(10,c=>setState(c,a.matter,'delivered'));const s=summary(r.results);
   assert.equal(s.committed,0);assert.ok(onlyRejected(s,/DELIVERY_CUSTODY_EVIDENCE_REQUIRED/));assert.equal(await statusOf(a.matter),'in_transit');return out(r);});

  await scenario('CLOSE_DELIVERED_VS_COMPLETED',['INV-10'],'5 delivered racing 5 completed transitions',async()=>{
   const a=await released();await setState(db,a.matter,'in_transit');await delivery(db,a.matter,'P23-DELIVERY-'+a.matter);
   const r=await raceIn(10,(c,i)=>setState(c,a.matter,i%2?'completed':'delivered'));
   const status=await statusOf(a.matter),delivered=await stateEvents(a.matter,'delivered'),completed=await stateEvents(a.matter,'completed');
   assert.equal(delivered,1,'exactly one delivered transition');assert.ok(completed<=1);
   // created_at is each transaction's start time (all began before the barrier), so the
   // proof of ordering is the transition each event recorded, not its timestamp.
   const edges=(await db.query("select previous_state,new_state from matter_state_events where matter_id=$1 and new_state in ('delivered','completed')",[a.matter])).rows;
   assert.ok(edges.every(e=>e.new_state==='delivered'?e.previous_state==='in_transit':e.previous_state==='delivered'),'completion only from delivered: '+JSON.stringify(edges));
   assert.ok(['delivered','completed'].includes(status));return out(r,{final_status:status});});

  await scenario('CLOSE_COMPLETED_10',['INV-10','INV-14'],'10 parallel Matter closures',async()=>{
   const a=await released();await setState(db,a.matter,'in_transit');await delivery(db,a.matter,'P23-DELIVERY-'+a.matter);await setState(db,a.matter,'delivered');
   const r=await raceIn(10,c=>setState(c,a.matter,'completed'));allCommitted(r,10);
   assert.equal(await stateEvents(a.matter,'completed'),1,'exactly one closure');assert.equal(await statusOf(a.matter),'completed');return out(r);});

  await scenario('CLOSE_ROLLBACK_GRANTS_NOTHING',['INV-10','INV-13'],'delivery evidence rolled back while 9 sessions try to mark delivered',async()=>{
   const a=await released();await setState(db,a.matter,'in_transit');
   const r=await raceIn(10,(c,i)=>i===0?delivery(c,a.matter,'P23-DELIVERY-'+a.matter):setState(c,a.matter,'delivered'),{rollback:i=>i===0});rolledBack(r);
   assert.equal(await custodyEvents(a.matter,'DOC_DELIVERED'),0);assert.equal(await statusOf(a.matter),'in_transit');assert.equal(await stateEvents(a.matter,'delivered'),0);
   return out(r);});

  await scenario('CLOSE_CROSS_MATTER',['INV-12'],'closing Matter A in parallel with Matter B that has no delivery evidence',async()=>{
   const A=await released(),B=await released();for(const m of [A,B])await setState(db,m.matter,'in_transit');await delivery(db,A.matter,'P23-DELIVERY-'+A.matter);
   const r=await raceIn(10,(c,i)=>setState(c,i<5?A.matter:B.matter,'delivered'));
   assert.equal(await statusOf(A.matter),'delivered');assert.equal(await statusOf(B.matter),'in_transit');
   assert.equal(r.results.slice(5).filter(x=>x.ok).length,0,'A\'s delivery evidence never satisfies B');return out(r);});


  await db.query("select count(*) from p23_concurrency_marker where run_id=$1",[report.run_id]).then(x=>assert.equal(Number(x.rows[0].count),1));
  await coord.end();
  report.status=report.failures.length?'FAIL':'PASS';
 }finally{
  await db?.end().catch(()=>{});
  // Disposable database is dropped only if it carries this run's marker name pattern.
  if(/^p23_conc_[0-9a-f]{12}$/.test(dbname))await admin.query(`drop database if exists ${dbname} with (force)`).catch(()=>{});
  await admin.end();
 }
}
try{await main();}catch(e){report.failures.push({id:'HARNESS',message:String(e.message).slice(0,300)});report.status='FAIL';}
finally{
 const passed=report.scenarios.filter(s=>s.status==='PASS').length;
 report.totals={scenarios:report.scenarios.length,passed,failed:report.scenarios.length-passed};
 save();
 console.log(`P23_CONCURRENCY ${report.status}: ${passed}/${report.scenarios.length} scenarios; PostgreSQL ${report.database.version??'n/a'}; live_certification=false.`);
 for(const f of report.failures)console.log('  FAIL',f.id,f.message);
 if(report.status!=='PASS')process.exitCode=1;
}
