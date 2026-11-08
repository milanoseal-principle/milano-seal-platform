import test from 'node:test';
import assert from 'node:assert/strict';
import { ronEvidenceFailure } from '@/lib/bluenotary/evidenceFailures';
test('QC and incident blockers offer their canonical operator actions',()=>{
 assert.equal(ronEvidenceFailure({message:'GOVERNED_RON_QC_REQUIRED'}).action_href,'/dashboard/execution-qa');
 assert.equal(ronEvidenceFailure({message:'BLOCKING_EXECUTION_EXCEPTION'}).action_href,'/dashboard/incidents');
});
test('unexpected database details are never reflected to clients',()=>{
 const result=ronEvidenceFailure({message:'private database content',code:'XX000'});
 assert.equal(JSON.stringify(result).includes('private database content'),false);assert.equal(result.error,'EVIDENCE_NOT_VERIFIED');
});
test('stale evidence requests direct refresh rather than blind mutation retries',()=>{
 const result=ronEvidenceFailure({code:'40001'});assert.equal(result.error,'STALE_EVIDENCE');assert.match(result.next_action,/Refresh/);
});
