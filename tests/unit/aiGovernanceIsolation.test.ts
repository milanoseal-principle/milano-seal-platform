import test from 'node:test';import assert from 'node:assert/strict';
import {isolationScanText} from '../../scripts/validate-milano-os-isolation.mjs';
const foreign=/\bLiaison\s+OS\b/i;
test('governing prohibition is not an affirmative foreign architecture import',()=>{assert.equal(foreign.test(isolationScanText('docs/master.md','35. Never mix Liaison OS architecture into Milano Seal.')),false);});
test('affirmative foreign text remains blocked even beside the governing prohibition',()=>{assert.equal(foreign.test(isolationScanText('docs/master.md','35. Never mix Liaison OS architecture into Milano Seal.\nUse Liaison OS for this company.')),true);assert.equal(foreign.test(isolationScanText('lib/code.ts','35. Never mix Liaison OS architecture into Milano Seal.')),true);});
