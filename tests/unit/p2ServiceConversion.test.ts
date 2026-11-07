import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import {
  normalizeServiceIntent,
  commercialHref,
  COMMERCIAL_CTA_DISCLOSURE,
} from "@/lib/conversion/commercialCta";
import { REVENUE_BEARING_PUBLIC_ROUTES } from "@/lib/routes/commercialInventory";

// P2 service-page revenue-conversion contracts. Pure/source-level checks: they
// prove the governed routing and the no-commercial-dead-end guarantee without a
// browser (rendered acceptance is a separate browser pass).

// A page satisfies the no-dead-end rule if it resolves to at least one of the
// EXISTING governed commercial surfaces: P1 Get Pricing, governed concierge,
// canonical intake, or counsel — directly, via the central helper, or via a
// governed template/conversion component.
const GOVERNED_MARKERS: RegExp[] = [
  /\/pricing[^"'`]*#get-pricing/,
  /commercialHref\(\s*["']get_pricing/,
  /\/speak-with-nicholas/,
  /commercialHref\(\s*["']speak/,
  /href="\/intake/,
  /commercialHref\(\s*["']intake/,
  /intakeHref/,
  /intakeQuery/,
  /commercialHref\(\s*["']counsel/,
  /\bAuthorityServicePage\b/,
  /\bLocalApostillePage\b/,
  /\bDocumentAuthorityPage\b/,
  /\bCommercialCtaRow\b/,
  /\bMilanoPublicCtaModule\b/,
  /\bCounselExperience\b/,
  /\bGetPricingForm\b/,
  /\bNicholasContactForm\b/,
  /\bFinalCTA\b/,
];

test("no commercial dead ends: every revenue-bearing public route resolves to a governed action", () => {
  for (const entry of REVENUE_BEARING_PUBLIC_ROUTES) {
    assert.ok(existsSync(entry.file), `${entry.route}: page file missing (${entry.file})`);
    const src = readFileSync(entry.file, "utf8");
    const hit = GOVERNED_MARKERS.some((re) => re.test(src));
    assert.ok(hit, `${entry.route} (${entry.file}) has no approved commercial action`);
  }
});

test("no broken/placeholder CTAs on revenue-bearing routes", () => {
  for (const entry of REVENUE_BEARING_PUBLIC_ROUTES) {
    const src = readFileSync(entry.file, "utf8");
    assert.doesNotMatch(src, /href="#"/, `${entry.route}: placeholder href="#"`);
    assert.doesNotMatch(src, /href=""/, `${entry.route}: empty href`);
  }
});

test("Get Pricing converges on the P1 governed pricing flow and preserves service intent", () => {
  const href = commercialHref("get_pricing", { serviceIntent: "ron", source: "svc" });
  assert.ok(href.startsWith("/pricing?"), href);
  assert.ok(href.includes("service_intent=ron"), href);
  assert.ok(href.endsWith("#get-pricing"), href);
  // RON is preserved as a preference, never promoted to a confirmed route.
  assert.doesNotMatch(href, /confirmed_execution_method|execution_method=ron/);
});

test("destination/context is preserved through governed CTAs without becoming authority", () => {
  const price = commercialHref("get_pricing", { serviceIntent: "apostille", destination: "Italy" });
  assert.ok(price.includes("destination=Italy"), price);
  assert.ok(price.includes("service_intent=apostille"), price);
  const speak = commercialHref("speak", { serviceIntent: "apostille", destination: "Italy", source: "country-intelligence" });
  assert.ok(speak.startsWith("/speak-with-nicholas?"), speak);
  assert.ok(speak.includes("destination=Italy") && speak.includes("source=country-intelligence"), speak);
  const intake = commercialHref("intake", { serviceIntent: "ron", destination: "Italy", documentType: "POA" });
  assert.ok(intake.startsWith("/intake?"), intake);
  assert.ok(intake.includes("country=Italy") && intake.includes("destination=Italy"), intake);
});

test("service-intent vocabulary maps onto the canonical enum, unknowns become review", () => {
  assert.equal(normalizeServiceIntent("RON"), "ron");
  assert.equal(normalizeServiceIntent("remote-online-notarization"), "ron");
  assert.equal(normalizeServiceIntent("domestic_notary"), "domestic_execution");
  assert.equal(normalizeServiceIntent("mobile_notary"), "domestic_execution");
  assert.equal(normalizeServiceIntent("apostille"), "apostille");
  assert.equal(normalizeServiceIntent("international_authentication"), "authentication");
  assert.equal(normalizeServiceIntent("professional_counsel"), "foreign_counsel");
  assert.equal(normalizeServiceIntent("international_execution"), "international_execution");
  assert.equal(normalizeServiceIntent(""), "unsure");
  assert.equal(normalizeServiceIntent("something-made-up"), "unsure");
});

test("a commercial CTA never targets a Matter-creating or payment endpoint", () => {
  for (const action of ["get_pricing", "speak", "intake", "counsel"] as const) {
    const href = commercialHref(action, { serviceIntent: "apostille", destination: "Italy" });
    assert.doesNotMatch(href, /^\/api\//, `${action} must not hit an API endpoint`);
    assert.ok(/^\/(pricing|speak-with-nicholas|intake|counsel)(\?|#|$)/.test(href), `${action} -> ${href}`);
    // No payment/scheduling/Wise authority encoded in a navigational CTA.
    assert.doesNotMatch(href, /wise|payment_confirmed|schedule|paid=true/i, href);
  }
});

test("the governed CTA row and helper disclose non-authority and leak no price/discount/Stripe", () => {
  const row = readFileSync("components/conversion/CommercialCtaRow.tsx", "utf8");
  const helper = readFileSync("lib/conversion/commercialCta.ts", "utf8");
  assert.match(COMMERCIAL_CTA_DISCLOSURE, /does not create a Matter/i);
  assert.match(COMMERCIAL_CTA_DISCLOSURE, /not a law firm/i);
  for (const src of [row, helper]) {
    assert.doesNotMatch(src, /\$\s?\d/); // no dollar amounts
    assert.doesNotMatch(src, /TIFFTEST50|DAMIANI50/);
    assert.doesNotMatch(src, /stripe/i);
  }
});

test("no public tier-price or discount-code leak on representative conversion surfaces", () => {
  const surfaces = [
    "components/conversion/CommercialCtaRow.tsx",
    "components/conversion/MilanoPublicCtaModule.tsx",
    "components/services/AuthorityServicePage.tsx",
    "components/seo/DocumentAuthorityPage.tsx",
    "components/seo/LocalApostillePage.tsx",
    ...REVENUE_BEARING_PUBLIC_ROUTES.map((r) => r.file),
  ];
  for (const file of surfaces) {
    const src = readFileSync(file, "utf8");
    assert.doesNotMatch(src, /\$\s?(?:750|975|1,?850)\b/, `${file}: internal tier price leak`);
    assert.doesNotMatch(src, /TIFFTEST50|DAMIANI50/, `${file}: private discount code leak`);
  }
});

test("P2 conversion changes introduce no Stripe payment path", () => {
  const changed = [
    "lib/conversion/commercialCta.ts",
    "components/conversion/CommercialCtaRow.tsx",
    "lib/routes/commercialInventory.ts",
    "components/services/AuthorityServicePage.tsx",
    "components/seo/DocumentAuthorityPage.tsx",
    "components/seo/LocalApostillePage.tsx",
    "components/conversion/MilanoPublicCtaModule.tsx",
  ];
  for (const file of changed) {
    assert.doesNotMatch(readFileSync(file, "utf8"), /stripe/i, `${file}: Stripe reference introduced`);
  }
});

test("instrument and service pages expose Get Pricing + Speak, not only full intake", () => {
  for (const entry of REVENUE_BEARING_PUBLIC_ROUTES.filter((r) => r.category === "instrument" || r.category === "service")) {
    const src = readFileSync(entry.file, "utf8");
    assert.match(src, /CommercialCtaRow|AuthorityServicePage/, `${entry.route}: no governed Get Pricing/Speak row`);
  }
});
