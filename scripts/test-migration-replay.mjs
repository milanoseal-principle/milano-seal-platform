// Full ordered clean replay on isolated PostgreSQL; managed Supabase primitives only.
import {PGlite} from '@electric-sql/pglite';import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
import {readFileSync,readdirSync,writeFileSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';
const db=new PGlite({extensions:{pgcrypto}}),results=[];let failure;
await db.exec(`create role anon;create role authenticated;create role service_role bypassrls;create role authenticator;create role supabase_admin superuser;
create schema auth;create schema storage;create schema extensions;
create table auth.users(id uuid primary key,email text,raw_user_meta_data jsonb default '{}',raw_app_meta_data jsonb default '{}',banned_until timestamptz,created_at timestamptz default now());
create function auth.jwt() returns jsonb language sql as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;
create function auth.uid() returns uuid language sql as $$select (auth.jwt()->>'sub')::uuid$$;
create function auth.email() returns text language sql as $$select auth.jwt()->>'email'$$;
create function auth.role() returns text language sql as $$select auth.jwt()->>'role'$$;
create table storage.buckets(id text primary key,name text,public boolean default false,file_size_limit bigint,allowed_mime_types text[],owner uuid);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text references storage.buckets(id),name text,owner uuid,created_at timestamptz default now(),updated_at timestamptz default now(),metadata jsonb,unique(bucket_id,name));
create function storage.foldername(name text) returns text[] language sql immutable as $$select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1]$$;
create function storage.filename(name text) returns text language sql immutable as $$select (string_to_array(name,'/'))[array_length(string_to_array(name,'/'),1)]$$;
grant usage on schema public,auth,storage to anon,authenticated,service_role;`);
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
