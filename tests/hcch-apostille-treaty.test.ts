import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { HCCH_APOSTILLE_SOURCE, HCCH_CONTRACTING_PARTIES, HCCH_OBJECTIONS, HCCH_TERRITORIES, hcchDate, hcchParty } from "@/lib/treaty/hcchApostilleStatus";
import { evaluateApostilleRelationship as evaluate, isApostilleConventionInForce, resolvePlace } from "@/lib/treaty/apostilleRelationship";
import { COUNTRY_REGISTRY, getCountryBySlug } from "@/lib/compliance/countries";
import { applyVerifiedCountryOverride } from "@/lib/compliance/verified-country-overrides";
import { isHagueMember } from "@/lib/intake/hagueMembers";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import { hagueCountries } from "@/lib/compliance/hagueCountries";
import { nonHagueCountries } from "@/lib/compliance/nonHagueCountries";

// Canonical HCCH Apostille Convention registry and the country-pair evaluator. Expected values are
// the HCCH status table as verified on 12 November 2026.

const AT = "2026-11-12";
const status = (origin: string, destination: string, evaluationDate = AT, extra: object = {}) => evaluate({ origin, destination, evaluationDate, ...extra }).status;

test("registry: 130 Contracting Parties, unique codes, valid dates, objections reference parties", () => {
  assert.equal(HCCH_CONTRACTING_PARTIES.length, 130);
  assert.equal(new Set(HCCH_CONTRACTING_PARTIES.map((p) => p.iso2)).size, 130);
  assert.equal(new Set(HCCH_CONTRACTING_PARTIES.map((p) => p.name)).size, 130);
  for (const p of HCCH_CONTRACTING_PARTIES) {
    assert.match(p.entryIntoForce, /^\d{4}-\d{2}-\d{2}$/, p.name);
    assert.ok(p.type === "succession" || p.instrument <= p.entryIntoForce, `${p.name}: instrument precedes entry into force`);
    assert.ok(resolvePlace(p.name) === p.iso2 && resolvePlace(p.iso2) === p.iso2, p.name);
  }
  for (const o of HCCH_OBJECTIONS) {
    assert.ok(hcchParty(o.objector) && hcchParty(o.acceding), `${o.objector}->${o.acceding}`);
    if (o.raised && o.withdrawnEffective) assert.ok(o.raised < o.withdrawnEffective, `${o.objector}->${o.acceding}`);
  }
  assert.equal(new Set(HCCH_OBJECTIONS.map((o) => `${o.objector}>${o.acceding}`)).size, HCCH_OBJECTIONS.length, "no duplicate objections");
  for (const t of HCCH_TERRITORIES) assert.ok(hcchParty(t.party), t.name);
  assert.equal(hcchDate("9-VII-2026"), "2026-07-09");
  assert.throws(() => hcchDate("2026-07-09"));
  assert.throws(() => hcchDate("9-XIII-2026"));
});

test("entry-into-force dates for the directive's named parties", () => {
  const eif = (c: string) => hcchParty(c)?.entryIntoForce;
  assert.equal(eif("MX"), "1995-08-14");
  assert.equal(eif("CA"), "2024-01-11");
  assert.equal(eif("CN"), "2023-11-07");
  assert.equal(eif("DZ"), "2026-07-09");
  assert.equal(eif("VN"), "2026-09-11");
  assert.equal(eif("TH"), "2027-02-28");
  assert.equal(eif("US"), "1981-10-15");
  assert.equal(hcchParty("AE"), undefined, "UAE is not a Contracting Party");
});

test("future-effective accession: Thailand is not applicable before 28 February 2027", () => {
  const before = evaluate({ origin: "US", destination: "Thailand", evaluationDate: AT });
  assert.equal(before.status, "FUTURE_EFFECTIVE");
  assert.equal(before.effectiveFrom, "2027-02-28");
  assert.equal(status("US", "TH", "2027-02-27"), "FUTURE_EFFECTIVE");
  assert.equal(status("US", "TH", "2027-02-28"), "APOSTILLE_APPLICABLE");
  assert.equal(isApostilleConventionInForce("Thailand", AT), false);
  assert.equal(isHagueMember("Thailand", AT), false);
  assert.equal(isHagueMember("Thailand", "2027-03-01"), true);
});

test("recent accessions apply from their dates; history is not 'future'", () => {
  assert.equal(status("US", "DZ", "2026-07-08"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "DZ", "2026-07-09"), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "Viet Nam"), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "Vietnam", "2026-09-10"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "Canada", "2024-01-10"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "Canada"), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "China"), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "Mexico"), "APOSTILLE_APPLICABLE");
});

test("standing objections block the pair in both directions; membership alone is not enough", () => {
  for (const [a, b] of [["IN", "DE"], ["DE", "IN"], ["IN", "CN"], ["DE", "DZ"], ["AT", "VN"], ["DE", "PH"], ["GR", "KG"], ["DE", "BD"], ["RS", "XK"]]) {
    assert.equal(status(a, b), "APOSTILLE_NOT_APPLICABLE", `${a}-${b}`);
  }
  assert.match(evaluate({ origin: "IN", destination: "DE", evaluationDate: AT }).reasons[0], /Germany objected to the accession of India/);
  // Both are Contracting Parties in force.
  assert.ok(isApostilleConventionInForce("IN", AT) && isApostilleConventionInForce("DE", AT));
});

test("withdrawals restore applicability from the withdrawal date, not before", () => {
  const cases: [string, string, string][] = [["DE", "AZ", "2026-03-16"], ["DE", "MD", "2026-07-17"], ["GR", "UZ", "2026-10-30"], ["FI", "IN", "2009-10-05"], ["US", "LR", "2015-05-20"], ["PL", "XK", "2024-03-01"], ["BE", "TN", "2025-06-11"]];
  for (const [a, b, date] of cases) {
    const dayBefore = new Date(Date.parse(date) - 86_400_000).toISOString().slice(0, 10);
    assert.equal(status(a, b, dayBefore), "APOSTILLE_NOT_APPLICABLE", `${a}-${b} before`);
    const on = evaluate({ origin: b, destination: a, evaluationDate: date });
    assert.equal(on.status, "APOSTILLE_APPLICABLE", `${a}-${b} on`);
    assert.equal(on.effectiveFrom, date);
  }
});

test("late objections have no effect; declarations of non-application do", () => {
  assert.equal(status("BE", "AZ"), "APOSTILLE_APPLICABLE");
  assert.equal(status("PT", "IN"), "APOSTILLE_APPLICABLE");
  assert.equal(status("PK", "IN"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("ES", "XK"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "XK"), "APOSTILLE_APPLICABLE");
  assert.equal(status("PH", "XK"), "OFFICIAL_REVIEW_REQUIRED");
});

test("territorial applicability: Hong Kong, Macao, excluded and unconfirmed territories", () => {
  assert.equal(status("US", "Hong Kong", "2020-01-01"), "APOSTILLE_APPLICABLE", "Hong Kong predates China's accession");
  assert.equal(status("US", "CN", "2020-01-01"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "Macau"), "APOSTILLE_APPLICABLE");
  assert.equal(status("HK", "XK"), "APOSTILLE_NOT_APPLICABLE", "China's Kosovo objection names the SARs");
  assert.equal(status("IN", "HK"), "OFFICIAL_REVIEW_REQUIRED", "scope of India's objection for the SARs is not established");
  assert.equal(status("US", "Greenland"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "Aruba"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "Gibraltar"), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "ZW"), "APOSTILLE_NOT_APPLICABLE");
});

test("fails closed: unknown places, non-parties, stale registry, institutional and limited documents", () => {
  assert.equal(status("US", "Atlantis"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("", "IT"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "IT", "not-a-date"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "IT", "2026-02-30"), "OFFICIAL_REVIEW_REQUIRED", "impossible calendar date");
  assert.equal(status("US", "IT", "2026-13-01"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("HK", "Hong Kong"), "APOSTILLE_NOT_APPLICABLE", "same territory");
  assert.equal(status("HK", "CN"), "OFFICIAL_REVIEW_REQUIRED", "territory and its own State");
  assert.equal(status("HK", "MO"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("GI", "GB"), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "United Arab Emirates"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "Egypt"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "US"), "APOSTILLE_NOT_APPLICABLE");
  assert.equal(status("US", "IT", "2028-01-01"), "OFFICIAL_REVIEW_REQUIRED", "registry must be re-verified");
  assert.equal(status("US", "IT", AT, { documentOrigin: "SUPRANATIONAL_OR_INTERGOVERNMENTAL_ORGANISATION" }), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "RW", AT, { documentType: "Power of Attorney" }), "OFFICIAL_REVIEW_REQUIRED");
  assert.equal(status("US", "RW", AT, { documentType: "Birth Certificate" }), "APOSTILLE_APPLICABLE");
  assert.equal(status("US", "OM", AT, { documentType: "Commercial invoice" }), "OFFICIAL_REVIEW_REQUIRED");
  assert.match(evaluate({ origin: "UA", destination: "US", evaluationDate: AT }).notes.join(" "), /Crimea/);
  assert.equal(evaluate({ origin: "US", destination: "IT", evaluationDate: AT }).source.verifiedAt, HCCH_APOSTILLE_SOURCE.verifiedAt);
});

test("every platform country list agrees with the registry", () => {
  for (const c of COUNTRY_REGISTRY) {
    const party = hcchParty(c.iso2);
    assert.equal(c.hagueMember, party ? "member" : "non-member", c.slug);
    assert.equal(c.hagueMemberSince, party?.entryIntoForce, c.slug);
    assert.equal(c.apostilleRequired, Boolean(party), c.slug);
    const published = applyVerifiedCountryOverride(c);
    assert.equal(published.hagueMember, c.hagueMember, `${c.slug} override`);
    assert.equal(published.hagueMemberSince, c.hagueMemberSince, `${c.slug} override date`);
  }
  assert.equal(getCountryBySlug("canada")?.hagueMember, "member");
  assert.doesNotMatch(JSON.stringify(getCountryBySlug("canada")), /not a (Hague Convention )?member/i);
  assert.equal(getCountryBySlug("uae")?.hagueMember, "non-member");
  for (const j of JURISDICTIONS.filter((x) => x.kind === "country")) {
    assert.equal(j.hague, isApostilleConventionInForce(j.code, AT), `lib/jurisdictions ${j.code}`);
  }
  assert.equal(isHagueMember("Canada", AT), true);
  assert.equal(isHagueMember("Vatican City", AT), false);
  assert.equal(isHagueMember("Burkina Faso", AT), false);
  assert.equal(isHagueMember("south korea", AT), true);
  assert.equal(isHagueMember("", AT), false);
});

test("the legacy Hague lists are views of the registry and cannot contradict it", () => {
  assert.equal(hagueCountries.length, HCCH_CONTRACTING_PARTIES.filter((p) => p.entryIntoForce <= HCCH_APOSTILLE_SOURCE.verifiedAt).length);
  assert.ok(!hagueCountries.some((c) => c.iso2 === "TH"), "future-effective Thailand is not listed as in force");
  for (const c of nonHagueCountries) assert.equal(isApostilleConventionInForce(c.iso2, AT), false, c.name);
  assert.deepEqual(nonHagueCountries.filter((c) => ["CN", "VN", "PK", "BD", "ID", "PH", "SA"].includes(c.iso2)), []);
  assert.ok(nonHagueCountries.some((c) => c.iso2 === "TH"), "Thailand stays a legalization destination until 28 February 2027");
  assert.doesNotMatch(fs.readFileSync("lib/intake/hagueMembers.ts", "utf8"), /new Set\(/);
});
