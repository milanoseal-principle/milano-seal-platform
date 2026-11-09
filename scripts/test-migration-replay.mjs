// Full ordered clean replay on isolated PostgreSQL; managed Supabase primitives only.
import {migrationFixture} from './lib/migration-fixture.mjs';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';
const db=await migrationFixture(),results=[];let failure;
const plan=JSON.parse(readFileSync('supabase/migration-replay-plan.json','utf8'));
const files=readdirSync('supabase/migrations').filter(n=>n.endsWith('.sql')).sort();
const order=[...plan.fresh_database_prerequisites,...files.filter(name=>!plan.fresh_database_prerequisites.includes(name))];
for(const name of order){
 const sql=readFileSync('supabase/migrations/'+name,'utf8');const sha256=createHash('sha256').update(sql).digest('hex');
 try{await db.exec(sql);results.push({name,sha256,status:'PASS'});}catch(error){failure={name,sha256,status:'FAIL',code:error.code??'UNKNOWN',message:error.message};results.push(failure);break;}
}
mkdirSync('artifacts/governance',{recursive:true});writeFileSync('artifacts/governance/migration-replay.json',JSON.stringify({environment:'isolated-pglite',managed_primitives_only:true,repository_prerequisites:plan.fresh_database_prerequisites,standard_filename_order_without_prerequisite:'FAIL_MISSING_IS_OPERATOR',hosted_certification:false,results,failure},null,2));
console.log(failure?`FAIL ordered migration replay at ${failure.name}: ${failure.code} ${failure.message}`:`PASS ordered migration replay: ${results.length} actual SQL migrations`);
await db.close();process.exitCode=failure?1:0;
