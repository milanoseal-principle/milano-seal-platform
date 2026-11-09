import {PGlite} from '@electric-sql/pglite';
import {pgcrypto} from '@electric-sql/pglite/contrib/pgcrypto';
export async function migrationFixture(additionalExtensions={}){const db=new PGlite({extensions:{pgcrypto,...additionalExtensions}});
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
return db;}
