import test from 'node:test';
import assert from 'node:assert/strict';
import { canTransitionReview, clientReviewLabel, normalizeReviewInput } from '@/lib/review/reviewWorkflow';

test('review workflow permits only governed forward transitions', () => {
  assert.equal(canTransitionReview('REQUESTED', 'ACKNOWLEDGED'), true);
  assert.equal(canTransitionReview('REQUESTED', 'RESOLVED'), false);
  assert.equal(canTransitionReview('CLOSED', 'IN_REVIEW'), false);
});

test('client acknowledgement language is evidence-backed', () => {
  assert.equal(clientReviewLabel('REQUESTED'), 'MILANO REVIEW REQUESTED');
  assert.equal(clientReviewLabel('ACKNOWLEDGED'), 'MILANO EXECUTION DESK HAS ACKNOWLEDGED THIS REQUEST');
});

test('review input requires a real question and carries safe context only', () => {
  assert.throws(() => normalizeReviewInput({ question: '' }), /INVALID_REVIEW_QUESTION/);
  const input = normalizeReviewInput({ question: 'Please review this route', country: 'Italy', safe_context: { route: 'italy' } });
  assert.equal(input.question, 'Please review this route');
  assert.equal(input.country, 'Italy');
});
