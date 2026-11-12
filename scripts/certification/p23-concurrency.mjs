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
