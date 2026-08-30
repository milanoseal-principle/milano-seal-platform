import assert from "node:assert/strict";
import test from "node:test";
import { isObviousReviewSpam, normalizeReviewQuestion, parseReviewSubmission, reviewFingerprint, sanitizeSafeContext } from "@/lib/review/reviewAbuseGuard";

test("review submissions require a stable session and substantive question", () => {
  assert.equal(parseReviewSubmission({ session_reference: "short", question: "help" }), null);
  assert.ok(parseReviewSubmission({ session_reference: "session-123456", question: "Which origin details require operator review?" }));
});

test("sensitive and arbitrary safe_context fields are stripped", () => {
  assert.deepEqual(sanitizeSafeContext({ source_route: "/apostille/italy", language: "en-US", passport_number: "private", signed_url: "https://example.test/private", arbitrary: "value" }), { source_route: "/apostille/italy", language: "en-US" });
});

test("duplicate fingerprint normalizes equivalent questions", () => {
  const base = { session_reference: "session-123456", country: "Italy", document_type: "Affidavit", question: "Does this route require review?", safe_context: {} };
  const equivalent = { ...base, question: "  DOES this route require review?! " };
  assert.equal(normalizeReviewQuestion(base.question), normalizeReviewQuestion(equivalent.question));
  assert.equal(reviewFingerprint(base, "test-secret"), reviewFingerprint(equivalent, "test-secret"));
});

test("honeypot and obvious automated promotion are rejected", () => {
  assert.equal(isObviousReviewSpam({ session_reference: "session-123456", question: "Please review this valid route question", safe_context: {}, website: "bot" }), true);
  assert.equal(isObviousReviewSpam({ session_reference: "session-123456", question: "Buy SEO backlinks and casino bonus now", safe_context: {} }), true);
});
