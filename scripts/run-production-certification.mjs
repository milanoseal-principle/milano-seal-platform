// Actual existing safe suites, grouped by P19–P23. Source proof is never live proof.
import {spawnSync,execFileSync} from 'node:child_process';import {mkdirSync,writeFileSync} from 'node:fs';
const hosted=process.argv.includes('--hosted-read-only');const suites=hosted?[
 ['P19-P23_HOSTED_OBSERVER',['scripts/observe-governance-hosted-certification.mjs']],
 ['HOSTED_UNAUTHENTICATED_SMOKE',['scripts/verify-hosted-release.mjs']],
]:[
 ['P3_CANONICAL_MATTER_REGRESSION',['scripts/test-p3-domestic-sql.mjs']],
 ['P20_WISE_NEGATIVES',['scripts/run-tests.mjs','tests/wise-acquiring-reconciliation-p0.test.ts','tests/wise-provider-settlement-recovery-p0.test.ts','tests/wise-reconciliation-exception-orchestrator-p0.test.ts']],
 ['P21_RON_STATUTORY',['scripts/test-p4-ron-sql.mjs']],
 ['P22_AUTHORITY_AND_COURIER_GATES',['scripts/run-tests.mjs','tests/unit/authorityPacketComposer.test.ts','tests/unit/authorityShipmentLegs.test.ts','tests/unit/authorityProcessingIntelligence.test.ts']],
 ['P23_UPGRADE_AND_ISOLATED_RESTORE',['scripts/test-upgrade-restore.mjs']],
 ['GOVERNANCE_FINANCIAL_RELEASE_AUTHORIZATION',['--import','tsx','scripts/test-gap-closure-sql.mjs']],
];
mkdirSync('artifacts/gap-closure/certification',{recursive:true});const results=[];
for(const [name,args] of suites){const run=spawnSync(process.execPath,args,{encoding:'utf8',env:process.env,maxBuffer:20*1024*1024});const output=(run.stdout??'')+(run.stderr??'');writeFileSync(`artifacts/gap-closure/certification/${name}.log`,output);const status=run.status===0?'PASS':run.status===2?'BLOCKED':'FAIL';results.push({name,command:[process.execPath,...args],exit_code:run.status,status,scope:hosted?'HOSTED_READ_ONLY_OBSERVATION':'LOCAL_SOURCE_REGRESSION',live_certification:'NOT_CERTIFIED'});console.log(`${status} ${name}`);}
const source_sha=execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim();writeFileSync('artifacts/gap-closure/certification/results.json',JSON.stringify({source_sha,results,production_actions_executed:false,commercial_codes_redeemed:false,final_status:'LIVE_CERTIFICATION_NOT_ESTABLISHED'},null,2));process.exitCode=results.some(r=>r.status==='FAIL')?1:results.some(r=>r.status==='BLOCKED')?2:0;
