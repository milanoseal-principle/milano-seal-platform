// Isolated upgrade from merged #450 and physical backup/restore. Never a hosted restore.
import {migrationFixture} from './lib/migration-fixture.mjs';
import {PGlite} from '@electric-sql/pglite';import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {readFileSync,readdirSync,mkdirSync,writeFileSync} from 'node:fs';import {createHash,randomUUID} from 'node:crypto';import assert from 'node:assert/strict';
const db=await migrationFixture();const files=readdirSync('supabase/migrations').filter(f=>f.endsWith('.sql')).sort();const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json','utf8'));const order=[...plan.fresh_database_prerequisites,...files.filter(f=>!plan.fresh_database_prerequisites.includes(f))];
const baseline=order.filter(f=>f<'20261108200000'),forward=order.filter(f=>f>='20261108200000');
for(const file of baseline)await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));
const founder=randomUUID(),matter=randomUUID();await db.query(`insert into auth.users(id,email,raw_app_meta_data) values($1,'controlled-founder@example.invalid','{"role":"founder_admin"}')`,[founder]);await db.query(`insert into public.deals(id,deal_id,email,client_name,status) values($1,'UPGRADE-SYNTHETIC','controlled-client@example.invalid','Controlled Synthetic','intake_received')`,[matter]);
const before=(await db.query('select to_jsonb(d) data from public.deals d where id=$1',[matter])).rows[0].data;
const archive=await db.dumpDataDir();const backupHash=createHash('sha256').update(Buffer.from(await archive.arrayBuffer())).digest('hex');
const preserved=(actual)=>{assert.deepEqual(Object.fromEntries(Object.keys(before).map(key=>[key,actual[key]])),before,'Every existing canonical field must remain unchanged');for(const key of Object.keys(actual).filter(key=>!(key in before)))assert.equal(actual[key],null,'Additive projection fields must remain empty: '+key);};
const applied=[];for(const file of forward){await db.exec(readFileSync('supabase/migrations/'+file,'utf8'));applied.push(file);}
preserved((await db.query('select to_jsonb(d) data from public.deals d where id=$1',[matter])).rows[0].data);
const restored=new PGlite({loadDataDir:archive,extensions:{pgcrypto}});await restored.waitReady;
preserved((await restored.query('select to_jsonb(d) data from public.deals d where id=$1',[matter])).rows[0].data);
assert.equal((await restored.query("select to_regclass('public.matter_financial_artifacts') table_name")).rows[0].table_name,null,'Restore really returned the older schema');
for(const file of forward)await restored.exec(readFileSync('supabase/migrations/'+file,'utf8'));
preserved((await restored.query('select to_jsonb(d) data from public.deals d where id=$1',[matter])).rows[0].data);
mkdirSync('artifacts/gap-closure',{recursive:true});writeFileSync('artifacts/gap-closure/upgrade-restore.json',JSON.stringify({environment:'ISOLATED_POSTGRESQL',baseline_migrations:baseline.length,forward_migrations:applied,backup_sha256:backupHash,canonical_record_preserved:true,physical_restore_checked:true,reapplied_forward_after_restore:true,hosted_backup_or_restore:'NOT_RUN'},null,2));
console.log(`PASS isolated upgrade from ${baseline.length} real migrations; ${applied.length} forward migrations; physical backup/restore preserves canonical record.`);await restored.close();await db.close();
