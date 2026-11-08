// Safe G5 suites reuse canonical production functions. No redemption/provider writes.
import {spawnSync} from 'node:child_process';import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';import {createHash} from 'node:crypto';
const out='artifacts/governance';mkdirSync(out,{recursive:true});
const suites=[
 ['UNIT_TIFFANY_ELIGIBLE_50',['scripts/run-tests.mjs','tests/unit/aiGovernanceTiffanyFinance.test.ts','lib/pricing/__tests__/tiffProductionCertification.test.ts','tests/tiff-15-step-production-certification.test.ts']],
 ['UNIT_DAMIANI_READ_ONLY',['scripts/run-tests.mjs','tests/unit/damianiCourtesyCode.test.ts','tests/unit/damianiDiscountedInvoice.test.ts']],
 ['UNIT_GLOBAL_DIRECTORY',['scripts/run-tests.mjs','tests/public-country-interaction.test.ts']],
 ['INTEGRATION_GOVERNANCE_NEGATIVES',['scripts/test-ai-governance-sql.mjs']],
 ['INTEGRATION_CANONICAL_MATTER',['scripts/test-p3-domestic-sql.mjs']],
 ['TIFFANY_CANONICAL_15_STEP_CONTRACT',['scripts/validate-tiff-15-step-production-certification.mjs']],
 ['DAMIANI_CANONICAL_WIRING',['scripts/validate-damiani-production-wiring.mjs']],
 ['EXTERNAL_PROVIDER_FEE_BOUNDARY',['scripts/validate-provider-fee-separation.mjs']],
];
const results=[];for(const [scenario,args] of suites){const run=spawnSync(process.execPath,args,{encoding:'utf8',env:process.env});writeFileSync(`${out}/${scenario.toLowerCase()}.log`,(run.stdout??'')+(run.stderr??''));results.push({scenario,environment:'ISOLATED_LOCAL',command:['node',...args],exit_code:run.status,status:run.status===0?'PASS':'FAIL',live_provider_certification:false});console.log(`${run.status===0?'PASS':'FAIL'} ${scenario}`);}
const runbook=readFileSync('docs/control-plane/09_TIFFANY_FINAL_15_STEP_PRODUCTION_TEST.md','utf8');const section=runbook.split('## 15-Step Certification')[1].split('## Evidence Returned')[0];const steps=[...section.matchAll(/^(\d{1,2})\. ([\s\S]*?)(?=^\d{1,2}\. |$(?![\s\S]))/gm)].map(match=>({step:Number(match[1]),original_checklist:match[2].trim(),environment:'HOSTED_CONTROLLED_LIVE',status:'NOT_RUN',actual_evidence:null,reason:'Approved controlled live run and secure authenticated binding not supplied; no production mutation performed.'}));
if(steps.length!==15)throw Error('Full canonical 15-step checklist could not be resolved');
writeFileSync(`${out}/g5-regressions.json`,JSON.stringify({source_sha:spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout.trim(),results,canonical_live_runbook_sha256:createHash('sha256').update(runbook).digest('hex'),canonical_live_steps:steps,tifftest50_scenario:'Separate synthetic 50%-eligible-service-subtotal case; original Gate 37 TIFFTEST99 preserved',damiani_commercial_redemption:'NEVER_EXECUTED',live_provider_certification:'NOT_RUN'},null,2));
process.exitCode=results.some(r=>r.exit_code!==0)?1:0;
