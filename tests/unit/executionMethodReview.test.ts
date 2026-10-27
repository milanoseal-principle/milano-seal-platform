import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { classifyIntake } from '@/lib/intake/smartClassification';
import { outstandingRequirements, isQuoteReady } from '@/lib/intake/reviewReadiness';
import { intakeFormSchema, restoreIntakeDraft } from '@/lib/intake/intakeDraft';
import { normalizeExecutionTruth, validateExecutionTruth } from '@/lib/matter/executionTruth';
const classification = classifyIntake({ text: 'An affidavit needs notarization.', structured: { documentType: 'Affidavit', destinationCountry: 'United States', notarization: true } });
const input = { classification, timeline: 'standard' as const, delivery: 'digital' as const, pricingApproved: true };

test('missing execution method remains a blocker until a selection or review request is saved', () => {
  assert.ok(outstandingRequirements(input).includes('Execution method (remote or in-person)'));
  const review = { ...input, executionReviewRequested: true };
  assert.deepEqual(outstandingRequirements(review), []);
  assert.equal(isQuoteReady(review), false, 'a review request must not turn into an approved quote');
  assert.equal(isQuoteReady(input), false);
});

test('explicitly negative RON/mobile still requires a method or an actionable review request', () => {
  const c = classifyIntake({ structured: { documentType: 'Affidavit', destinationCountry: 'United States', notarization: true, ron: false, mobile: false } });
  assert.ok(outstandingRequirements({ ...input, classification: c }).some((x) => x.startsWith('Execution method')));
});

test('review submission does not excuse missing client-owned routing inputs', () => {
  const c = { ...classification, documentType: '', destinationCountry: '' };
  const missing = outstandingRequirements({ ...input, classification: c, timeline: '', delivery: '', executionReviewRequested: true });
  assert.deepEqual(missing, ['Exact document title for each document', 'Destination country', 'Preferred execution timeline', 'Delivery method']);
});

for (const method of ['ron', 'in_person', 'review_required']) {
  test(`${method} preference never approves unresolved document/jurisdiction requirements`, () => {
    const result = validateExecutionTruth(normalizeExecutionTruth({ execution_method: method, notarization_requirement: 'required', authentication_requirement: 'review_required', notarial_act: 'review_required' }));
    assert.equal(result.reviewRequired, true);
  });
}

test('server captures explicit public preferences for review before pricing and Wise issuance', () => {
  const source = readFileSync('app/api/intake/core.ts', 'utf8');
  assert.match(source, /const executionReviewRequired = clientExecutionPreference/);
  assert.match(source, /sourceHint !== "admin" && sourceHint !== "professional"/);
  const review = source.slice(source.indexOf('if (executionReviewRequired)'), source.indexOf('stage = "EXECUTION_VALIDATED"'));
  assert.match(review, /execution_truth: executionTruth/);
  assert.match(review, /payment_confirmed: false/);
  assert.match(review, /quote_state: "review_required"/);
  assert.doesNotMatch(review, /createWisePaymentRequest\(/);
});

const form = { description: 'Affidavit', name: 'Test', email: 'test@example.invalid', phone: '', documentType: 'Affidavit', documentCount: 1, signerCount: 1, originState: 'Florida', signerLocation: 'Florida', destinationCountry: 'United States', executionType: 'RON', mobileAddress: '', notarizationChoice: 'yes', apostilleChoice: 'no', translationChoice: 'no', deadline: '', courierRequired: false, timelineChoice: 'standard', deliveryChoice: 'digital' };
const draft = { version: 1, context: 'flow', savedAt: 1000, step: 3, form, analysis: { documentType: 'Affidavit', apostilleRequired: false } };

test('saved preference, routing inputs and lower-precedence analysis restore, not consent or files', () => {
  const restored = restoreIntakeDraft(JSON.stringify({ ...draft, consent: true, files: ['private.pdf'], payment_confirmed: true }), 'flow', 2000)!;
  assert.equal(restored.form.executionType, 'RON');
  assert.equal(restored.analysis?.apostilleRequired, false);
  assert.equal('consent' in restored, false);
  assert.equal('files' in restored, false);
  assert.equal('payment_confirmed' in restored, false);
});

test('invalid, stale, future and unrelated drafts cannot restore order state', () => {
  for (const raw of ['{', JSON.stringify({ ...draft, form: { ...form, executionType: 'hacked' } }), JSON.stringify({ ...draft, version: 0 })]) assert.equal(restoreIntakeDraft(raw, 'flow', 2000), null);
  assert.equal(restoreIntakeDraft(JSON.stringify(draft), 'other', 2000), null);
  assert.equal(restoreIntakeDraft(JSON.stringify(draft), 'flow', 999), null);
  assert.equal(restoreIntakeDraft(JSON.stringify(draft), 'flow', 86_401_001), null);
  assert.equal(intakeFormSchema.safeParse({ ...form, documentCount: -1 }).success, false);
});
