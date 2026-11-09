import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {runInNewContext} from 'node:vm';
const root=process.cwd();
const context={};runInNewContext(readFileSync(resolve(root,'.next/server/app/intake/page_client-reference-manifest.js'),'utf8'),context,{timeout:1000});
const manifest=context.__RSC_MANIFEST?.['/intake/page'];if(!manifest?.clientModules)throw Error('Build client manifest missing');
const chunks=[...new Set(Object.values(manifest.clientModules).flatMap(m=>m.chunks??[]))].filter(c=>c.endsWith('.js'));
const forbidden=['additional_apostille_documents','international_signers','executive_state_handling','manual_adjustment','authorizedAddOns','laneBaseWasDefaulted'];
const hits=[];for(const chunk of chunks){if(!chunk.startsWith('/_next/static/chunks/'))throw Error('Unexpected chunk path');const text=readFileSync(resolve(root,'.next',chunk.slice('/_next/'.length)),'utf8');for(const key of forbidden)if(text.includes(key))hits.push({chunk,key});}
if(chunks.length===0)throw Error('No browser chunks found; privacy verification unavailable');
const report={status:hits.length?'FAIL':'PASS',scope:'ACTUAL_PRODUCTION_INTAKE_CLIENT_CHUNKS',chunks:chunks.length,private_formula_hits:hits};
mkdirSync('artifacts/progressive-intake',{recursive:true});writeFileSync('artifacts/progressive-intake/bundle-summary.json',JSON.stringify(report,null,2));
if(hits.length){console.error('Private pricing rule signatures found in public intake chunks');process.exitCode=1;}else console.log(`PASS ${chunks.length} actual production intake browser chunks contain no internal pricing rule signatures.`);
