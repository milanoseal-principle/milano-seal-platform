import assert from 'node:assert/strict';
import test from 'node:test';
import { obviousReviewSpam, sanitizeSafeContext } from '@/lib/review/reviewAbuseGuard';

test('review safe context strips sensitive and arbitrary keys', () => {
  const safe = sanitizeSafeContext({
    pathname: '/portal',
    destination_country: 'Italy',
    passport_number: 'SECRET',
    signed_url: 'SECRET',
    kba_answer: 'SECRET',
  });
  assert.equal(safe.pathname, '/portal');
  assert.equal(safe.destination_country, 'Italy');
  assert.equal('passport_number' in safe, false);
  assert.equal('signed_url' in safe, false);
  assert.equal('kba_answer' in safe, false);
});

test('honeypot and obvious automated spam fail closed', () => {
  assert.equal(obviousReviewSpam({ question: 'Please review my POA', website: 'bot.example' }), true);
  assert.equal(obviousReviewSpam({ question: 'buy followers https://a.test https://b.test https://c.test https://d.test' }), true);
  assert.equal(obviousReviewSpam({ question: 'Please review my document route for Italy.' }), false);
});
