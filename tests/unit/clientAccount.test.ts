import { test } from "node:test";
import assert from "node:assert/strict";
import {
  emailsMatch,
  normalizeEmail,
  validateSignupCredentials,
} from "@/lib/auth/clientAccount";

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  Damiani@Example.COM "), "damiani@example.com");
  assert.equal(normalizeEmail(undefined), "");
  assert.equal(normalizeEmail(null), "");
});

test("emailsMatch is exact on normalized form and fails closed on empty", () => {
  assert.equal(emailsMatch("Client@Example.com", "client@example.com "), true);
  assert.equal(emailsMatch("", ""), false);
  assert.equal(emailsMatch("a@b.com", "a@b.co"), false);
  // no loose/substring matching
  assert.equal(emailsMatch("client@example.com", "client@example.com.evil.com"), false);
});

test("validateSignupCredentials requires a valid email", () => {
  assert.equal(validateSignupCredentials("not-an-email", "abcd1234").ok, false);
  assert.equal(validateSignupCredentials("a@b.com", "abcd1234").ok, true);
  // normalized email is returned
  assert.equal(validateSignupCredentials("  A@B.COM ", "abcd1234").email, "a@b.com");
});

test("validateSignupCredentials enforces password length bounds", () => {
  assert.equal(validateSignupCredentials("a@b.com", "short").ok, false);
  assert.equal(validateSignupCredentials("a@b.com", "12345678").ok, true);
  assert.equal(validateSignupCredentials("a@b.com", "x".repeat(201)).ok, false);
});
