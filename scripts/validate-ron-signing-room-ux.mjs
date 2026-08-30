import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const room = readFileSync('app/dashboard/ron/page.tsx', 'utf8');
const controls = readFileSync('components/ron/RONSessionControlPanel.tsx', 'utf8');

assert.ok(room.includes('BlueNotary Signing Room'), 'Signing Room must identify the BlueNotary operator surface');
assert.ok(room.includes('Resolve before session creation'), 'Pre-session cards must expose blockers directly');
assert.ok(room.includes('No hover required'), 'Signing Room must keep blockers mobile-visible');
assert.ok(room.includes('Open RON Readiness → Create BlueNotary Session'), 'Ready Matter CTA must state the next action');
assert.ok(room.includes('Open RON Readiness → Resolve Blockers'), 'Blocked Matter CTA must state the next action');
assert.ok(room.includes("evaluateSchedulingGate({ matter })"), 'Signing Room must reuse canonical scheduling authority');
assert.ok(!room.includes('payment_confirmed = true'), 'Signing Room UI must not author payment truth');

assert.ok(controls.includes('RON Session Readiness'), 'RON control panel must expose readiness state');
assert.ok(controls.includes('Resolve these before creating the session'), 'Control panel must visibly enumerate blockers');
assert.ok(controls.includes('Scheduling authority'), 'Control panel must show scheduling authority gate');
assert.ok(controls.includes('Signer information'), 'Control panel must show signer completeness gate');
assert.ok(controls.includes('RON execution facts'), 'Control panel must show execution truth gate');
assert.ok(controls.includes('Matter document package'), 'Control panel must show document readiness gate');
assert.ok(controls.includes("'/api/dashboard/ron/sessions'"), 'Create-session control must call the canonical RON API');
assert.ok(controls.includes('{ matter_id: matterId }'), 'Create-session control must preserve the canonical Matter identifier');
assert.ok(!controls.includes('payment_confirmed'), 'RON client control must not mutate payment truth');

console.log('PASS RON Signing Room readiness UX');
