import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const read=p=>readFileSync(p,'utf8');
const phases=[['P19','p19-e2e.mjs','ALLOW_LIVE_E2E_CERTIFICATION'],['P20','p20-wise.mjs','ALLOW_LIVE_WISE_CERTIFICATION'],['P21','p21-ron.mjs','ALLOW_LIVE_RON_CERTIFICATION'],['P22','p22-authentication.mjs','ALLOW_LIVE_AUTHENTICATION_CERTIFICATION'],['P23','p23-recovery.mjs','ALLOW_LIVE_RECOVERY_CERTIFICATION']];
let checks=0;
for(const [phase,file,flag] of phases){const path='scripts/certification/'+file,source=read(path);assert.ok(statSync(path).mode&0o111);assert.match(source,/run.guard\(\)/);assert.match(source,/run.save\(\)/);assert.match(source,/process.exitCode=1/);checks+=4;
 for(const enabled of [false,true]){const result=spawnSync(process.execPath,['--conditions=react-server','--import','./scripts/certification/server-condition.mjs','--import','tsx',path,'--mode=CONTROLLED_LIVE'],{encoding:'utf8',env:{...process.env,[flag]:enabled?'true':'false'}});assert.equal(result.status,1,phase+' must refuse live mode');const artifact=JSON.parse(read(`artifacts/certification/${phase.toLowerCase()}-refused.json`));assert.equal(artifact.live_certification,false);assert.equal(artifact.status,'FAIL');assert.match(artifact.failures[0].message,enabled?/CONTROLLED_LIVE_DISABLED/:/EXPLICIT_LIVE_AUTHORIZATION_REQUIRED/);checks+=4;}
}
const wise=read('lib/wise.ts');assert.match(wise,/verifyWiseSignatureWithKey/);assert.match(wise,/await getWisePublicKey\(\)/);assert.doesNotMatch(wise,/process.env.*PUBLIC_KEY|process.env.*SIGNATURE/);checks+=3;
assert.match(read('app/api/webhooks/wise/route.ts'),/verifyWiseSignature\(/);assert.doesNotMatch(read('app/api/webhooks/wise/route.ts'),/verifyWiseSignatureWithKey/);checks+=2;
for(const [file,pattern] of [['p20-wise.mjs',/reconcileLoadedDeal/],['p21-ron.mjs',/append_ron_statutory_evidence/],['p22-authentication.mjs',/record_document_release/],['p23-recovery.mjs',/dumpDataDir/]]){assert.match(read('scripts/certification/'+file),pattern);checks++;}
console.log(`PASS ${checks} certification source/live-refusal checks; P19–P23 required; all controlled live modes refused.`);
