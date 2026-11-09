// Reuse production gates locally; never publish GitHub statuses or deploy anything.
import {spawn,spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {existsSync,mkdirSync,readFileSync,writeFileSync,openSync,closeSync,rmSync} from 'node:fs';
import {resolve} from 'node:path';
const git=(...args)=>{const r=spawnSync('git',args,{encoding:'utf8'});if(r.status!==0)throw Error('Git inspection failed');return r.stdout.trim();};
if(process.argv.length>2)throw Error('No skip or deployment flags are supported. Use npm run check:local.');
if(git('ls-files','--others','--exclude-standard'))throw Error('Untracked source files must be committed or removed before validation.');
if(git('diff','HEAD','--name-only'))throw Error('Commit tracked changes before validation so evidence binds to an exact source SHA.');
for(const file of ['.env','.env.local','.env.production','.env.production.local','.env.development','.env.development.local'])if(existsSync(file))throw Error(`Remove ${file} from this isolated validation checkout; use a separate preview workspace for authenticated hosted tests.`);
const sha=git('rev-parse','HEAD'),tree=git('rev-parse','HEAD^{tree}');
const root=resolve('artifacts/local-validation');mkdirSync(root,{recursive:true});
if(existsSync('.next/lock')||existsSync('.next/dev/lock'))throw Error('Stop the active Next process before isolated validation.');
const lock=resolve(root,'.lock');mkdirSync(lock); // Fail closed on an overlapping run.
const out=resolve(root,new Date().toISOString().replace(/[:.]/g,'-')+'-'+sha.slice(0,12));mkdirSync(out);
const env={};
// Local suites need no provider or database credentials. Do not pass them through.
for(const [name,value] of Object.entries(process.env))if(/^(PATH|HOME|USER|TMPDIR|TEMP|TMP|LANG|LC_.*|SHELL|TERM|HTTP_PROXY|HTTPS_PROXY|ALL_PROXY|NO_PROXY|http_proxy|https_proxy|all_proxy|no_proxy|NODE_EXTRA_CA_CERTS|SSL_CERT_FILE|SSL_CERT_DIR|NPM_CONFIG_CACHE|npm_config_cache|CHROMIUM_PATH|PLAYWRIGHT_BROWSERS_PATH|CI)$/.test(name))env[name]=value;
Object.assign(env,{NEXT_TELEMETRY_DISABLED:'1',NEXT_PUBLIC_SUPABASE_URL:'http://127.0.0.1:9',NEXT_PUBLIC_SUPABASE_ANON_KEY:'local-render-only-not-a-credential',NODE_OPTIONS:'--max-old-space-size=6144',PLAYWRIGHT_EXECUTABLE_PATH:env.CHROMIUM_PATH??''});
const report={source_sha:sha,source_tree:tree,lockfile_sha256:createHash('sha256').update(readFileSync('package-lock.json')).digest('hex'),node:process.version,started_at:new Date().toISOString(),scope:'ISOLATED_LOCAL_SOURCE_ONLY',public_auth_configuration:'INERT_LOOPBACK_NO_SESSION',steps:[],status:'RUNNING',github_statuses_modified:false,hosted_preview:'NOT_RUN',production_deployment:'NOT_RUN',agents_activated:false};
let active,server,serverFd,stopping=false;
const save=()=>writeFileSync(resolve(out,'summary.json'),JSON.stringify(report,null,2)+'\n');
async function run(label,command,args,extra={}){
 if(stopping)throw Error('Validation interrupted');
 const log=resolve(out,String(report.steps.length+1).padStart(2,'0')+'-'+label+'.log'),fd=openSync(log,'w');
 const step={name:label,command:[command,...args],started_at:new Date().toISOString(),log,status:'RUNNING'};report.steps.push(step);save();console.log('RUN '+label+' → '+log);
 try{const exit=await new Promise((accept,reject)=>{active=spawn(command,args,{env:{...env,...extra},stdio:['ignore',fd,fd]});active.once('error',reject);active.once('close',(code,signal)=>accept({code,signal}));});step.exit_code=exit.code;step.signal=exit.signal;step.status=exit.code===0?'PASS':'FAIL';}
 catch(error){step.status='FAIL';step.error_code=error.code??'PROCESS_START_FAILED';}
 finally{active=null;closeSync(fd);step.finished_at=new Date().toISOString();save();}
 console.log(step.status+' '+label);if(step.status!=='PASS')throw Error('Validation failed: '+label+'; inspect '+log);
}
for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{stopping=true;active?.kill('SIGTERM');server?.kill('SIGTERM');});
try{
 await run('diff-check','git',['diff','--check']);
 rmSync('.next',{recursive:true,force:true});
 await run('route-types',process.execPath,['node_modules/next/dist/bin/next','typegen']);
 await run('visual-system',process.execPath,['scripts/validate-final-visual-system-hardening.mjs']);
 await run('vercel-merge-gate',process.execPath,['scripts/run-vercel-merge-gate.mjs']);
 await run('production-build','npm',['run','build']);
 await run('p3-database','npm',['run','test:p3-database']);
 await run('p5-database','npm',['run','test:p5-database']);
 await run('governance-regressions','npm',['run','test:ai-governance-regressions']);
 await run('source-certification','npm',['run','test:production-certification-source']);
 await run('dependency-audit','npm',['audit','--omit=dev','--audit-level=moderate']);
 // Dev fixture suites are sequential; both restore Next's generated type reference.
 await run('governance-rendered','npm',['run','test:ai-governance-rendered']);
 await run('p3-rendered','npm',['run','test:p3-rendered']);
 await run('retention-rendered','npm',['run','test:retention-rendered']);
 await run('map-rendered',process.execPath,['scripts/run-rendered-map-proof.mjs']);
 // Pin BOTH targets to localhost: no production portal fallback or live writes.
 const base='http://127.0.0.1:3191';
 try{await fetch(base,{signal:AbortSignal.timeout(500)});throw Error('Local proof port3191 is already in use');}catch(error){if(error.message?.includes('already in use'))throw error;}
 serverFd=openSync(resolve(out,'local-production-server.log'),'w');
 server=spawn(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3191'],{env,stdio:['ignore',serverFd,serverFd]});
 let serverError;server.on('error',error=>serverError=error.code);let ready=false;
 for(let attempt=0;attempt<60&&!stopping;attempt++){if(serverError||server.exitCode!==null)throw Error('Local production server failed');try{if((await fetch(base,{signal:AbortSignal.timeout(1000)})).ok){ready=true;break;}}catch{}await new Promise(accept=>setTimeout(accept,500));}
 if(!ready)throw Error('Local production server did not become ready');
 await run('public-production-rendered',process.execPath,['scripts/run-rendered-production-acceptance.mjs'],{MILANO_RENDERED_BASE_URL:base,MILANO_PRODUCTION_BASE_URL:base});
 if(stopping||git('rev-parse','HEAD')!==sha||git('diff','HEAD','--name-only')||git('ls-files','--others','--exclude-standard'))throw Error('Source changed during validation; results cannot certify this checkout');
 report.status='PASS';
}catch(error){report.status='FAIL';report.failure=error.message;console.error(error.message);process.exitCode=1;}
finally{if(server){server.kill('SIGTERM');await new Promise(accept=>{if(server.exitCode!==null)return accept();server.once('close',accept);});}if(serverFd!==undefined)closeSync(serverFd);report.finished_at=new Date().toISOString();save();rmSync(lock,{recursive:true});console.log('Evidence: '+resolve(out,'summary.json'));}
