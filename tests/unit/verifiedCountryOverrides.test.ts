import test from "node:test";
import assert from "node:assert/strict";
import { getCountryBySlug } from "../../lib/compliance/countries";
import { applyVerifiedCountryOverride } from "../../lib/compliance/verified-country-overrides";

function verified(slug: string) {
  const base = getCountryBySlug(slug);
  assert.ok(base, `missing country profile: ${slug}`);
  return applyVerifiedCountryOverride(base);
}

test("premium Hague corridor dates use verified entry-into-force dates", () => {
  assert.equal(verified("italy").hagueMemberSince, "1978-02-11");
  assert.equal(verified("switzerland").hagueMemberSince, "1973-03-11");
  assert.equal(verified("germany").hagueMemberSince, "1966-02-13");
  assert.equal(verified("france").hagueMemberSince, "1965-01-24");
  assert.equal(verified("spain").hagueMemberSince, "1978-09-25");
});

test("Canada is treated as a Hague Apostille Convention country from 2024-01-11", () => {
  const canada = verified("canada");
  assert.equal(canada.hagueMember, "member");
  assert.equal(canada.hagueMemberSince, "2024-01-11");
  assert.equal(canada.apostilleRequired, true);
  assert.equal(canada.consularLegalizationRequired, false);
});

test("UAE does not receive a fabricated Hague apostille-only route", () => {
  const uae = verified("uae");
  assert.equal(uae.hagueMember, "non-member");
  assert.equal(uae.apostilleRequired, false);
  assert.equal(uae.consularLegalizationRequired, true);
  assert.equal(uae.verificationStatus, "VERIFICATION_REQUIRED");
});

test("verified overrides preserve unaffected country profiles", () => {
  const base = getCountryBySlug("mexico");
  assert.ok(base);
  assert.equal(applyVerifiedCountryOverride(base), base);
});
