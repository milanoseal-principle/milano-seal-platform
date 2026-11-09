import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  SERVICE_LANES,
  getSmartIntakeQuestionPlan,
  normalizeSmartIntakeIntent,
  smartIntakeProgress,
  toConciergeServiceIntent,
} from "@/lib/intake/serviceIntent";
import { commercialHref, primaryServiceCta } from "@/lib/conversion/commercialCta";

const INTERNATIONAL_QUESTIONS = ["destinationCountry", "originState", "apostilleRequest", "translationRequest", "delivery"] as const;

test("deep-link intents normalize; invalid or hostile values fall back to the broad intake", () => {
  assert.equal(normalizeSmartIntakeIntent("ron"), "ron");
  assert.equal(normalizeSmartIntakeIntent("Online-Notary"), "ron");
  assert.equal(normalizeSmartIntakeIntent("notary"), "notary");
  assert.equal(normalizeSmartIntakeIntent("domestic_execution"), "notary");
  assert.equal(normalizeSmartIntakeIntent("witness"), "witness");
  assert.equal(normalizeSmartIntakeIntent("apostille"), "apostille");
  assert.equal(normalizeSmartIntakeIntent("international"), "international");
  assert.equal(normalizeSmartIntakeIntent("counsel"), "counsel");
  for (const bad of [undefined, null, "", "scheduled", "paid", "__proto__", "<script>", "x".repeat(500)]) {
    assert.equal(normalizeSmartIntakeIntent(bad as string | null | undefined), "unsure", String(bad));
  }
});

test("simple U.S. RON asks no international questions up front", () => {
  const plan = getSmartIntakeQuestionPlan({ intent: "ron" });
  for (const q of INTERNATIONAL_QUESTIONS) assert.ok(!plan.visible.includes(q), q);
  for (const q of ["description", "upload", "signerCount", "signerLocation", "timeline", "witnessContext", "contact"] as const) {
    assert.ok(plan.visible.includes(q), q);
  }
  assert.ok(plan.visible.indexOf("timeline") < plan.visible.indexOf("witnessContext"), "timing before witness context");
  assert.ok(plan.visible.includes("internationalUse"), "one plain question decides whether to expand");
  assert.equal(plan.international, false);
});

test("international questions appear only when answers make them relevant", () => {
  assert.equal(getSmartIntakeQuestionPlan({ intent: "ron", answers: { internationalUse: "yes" } }).international, true);
  assert.equal(getSmartIntakeQuestionPlan({ intent: "notary", answers: { destinationCountry: "Italy" } }).international, true);
  assert.equal(getSmartIntakeQuestionPlan({ intent: "notary", answers: { destinationCountry: "United States" } }).international, false);
  const expanded = getSmartIntakeQuestionPlan({ intent: "ron", answers: { internationalUse: "yes" } });
  for (const q of INTERNATIONAL_QUESTIONS) assert.ok(expanded.visible.includes(q), q);
  assert.ok(expanded.required.includes("delivery"));
  assert.ok(expanded.visible.includes("internationalUse"), "the answer that expanded the plan stays editable");
});

test("witness lane captures witness context and the in-person location", () => {
  const plan = getSmartIntakeQuestionPlan({ intent: "witness" });
  assert.ok(plan.visible.includes("witnessContext"));
  assert.ok(plan.visible.includes("inPersonLocation"));
  assert.ok(plan.visible.includes("signerLocation"));
  assert.equal(plan.international, false);
});

test("apostille lane asks origin/destination and skips signer questions for already-executed documents", () => {
  const plan = getSmartIntakeQuestionPlan({ intent: "apostille" });
  assert.ok(plan.visible.includes("alreadyExecuted"));
  for (const q of INTERNATIONAL_QUESTIONS) assert.ok(plan.visible.includes(q), q);
  const executed = getSmartIntakeQuestionPlan({ intent: "apostille", answers: { alreadyExecuted: "yes" } });
  assert.ok(!executed.visible.includes("signerCount"));
  assert.ok(!executed.visible.includes("signerLocation"));
  const needsExecution = getSmartIntakeQuestionPlan({ intent: "apostille", answers: { alreadyExecuted: "no" } });
  assert.ok(needsExecution.visible.includes("signerLocation"), "signer questions reappear when new execution is needed");
});

test("international, counsel and unsure lanes", () => {
  assert.equal(getSmartIntakeQuestionPlan({ intent: "international" }).international, true);
  assert.equal(getSmartIntakeQuestionPlan({ intent: "counsel" }).international, true);
  const unsure = getSmartIntakeQuestionPlan({ intent: "unsure" });
  assert.ok(unsure.visible.includes("internationalUse"));
  assert.ok(unsure.visible.includes("witnessContext"));
  assert.match(unsure.descriptionPrompt, /Plain English/);
});

test("service intent is context only: the plan carries no execution, price, payment or scheduling truth", () => {
  for (const intent of ["ron", "notary", "witness", "apostille", "international", "counsel", "unsure"]) {
    const plan = getSmartIntakeQuestionPlan({ intent });
    const keys = Object.keys(plan).join(",");
    assert.doesNotMatch(keys, /price|tier|payment|schedul|execution_method|witness_required|apostille_eligible|ron_eligible/i);
    assert.match(plan.authorityNotice, /Milano review confirms/);
    assert.match(plan.authorityNotice, /Scheduling unlocks only after verified payment settlement/);
  }
  const source = readFileSync("lib/intake/serviceIntent.ts", "utf8");
  assert.doesNotMatch(source, /from\s+["']@\/lib\/(pricing|payments|wise|scheduling)/, "public intake policy imports no private pricing/payment code");
  assert.doesNotMatch(source, /TIFFTEST|DAMIANI50|\$\d/);
});

test("progress counts only the active plan's visible questions", () => {
  const ron = getSmartIntakeQuestionPlan({ intent: "ron" });
  const intl = getSmartIntakeQuestionPlan({ intent: "international" });
  assert.ok(ron.visible.length < intl.visible.length, "simple RON has a shorter journey");
  assert.equal(smartIntakeProgress(ron, new Set(ron.visible)), 100);
  assert.equal(smartIntakeProgress(ron, new Set()), 0);
  const half = new Set(ron.visible.slice(0, Math.floor(ron.visible.length / 2)));
  assert.equal(smartIntakeProgress(ron, half), Math.round((half.size / ron.visible.length) * 100));
});

test("seven entry lanes with the required CTA wording converge on the one intake (or counsel)", () => {
  const ctas = Object.fromEntries(SERVICE_LANES.map((lane) => [lane.intent, lane.cta]));
  assert.deepEqual(ctas, {
    ron: "Start Online Notary",
    notary: "Request a Notary",
    witness: "Request Witness Support",
    apostille: "Start Apostille Review",
    international: "Begin Matter Review",
    counsel: "Send a Matter",
    unsure: "Tell Us What You Need",
  });
  for (const lane of SERVICE_LANES) {
    assert.ok(lane.href === "/counsel" || lane.href.startsWith("/intake?intent="), lane.href);
  }
});

test("service pages lead with their contextual CTA and the intake link carries the intent", () => {
  assert.deepEqual(primaryServiceCta("ron"), { action: "intake", label: "Start Online Notary" });
  assert.deepEqual(primaryServiceCta("domestic_execution"), { action: "intake", label: "Request a Notary" });
  assert.deepEqual(primaryServiceCta("apostille"), { action: "intake", label: "Start Apostille Review" });
  assert.deepEqual(primaryServiceCta("international_execution"), { action: "intake", label: "Begin Matter Review" });
  assert.deepEqual(primaryServiceCta("foreign_counsel"), { action: "counsel", label: "Send a Matter" });
  assert.deepEqual(primaryServiceCta(undefined), { action: "intake", label: "Tell Us What You Need" });
  assert.match(commercialHref("intake", { serviceIntent: "ron" }), /[?&]intent=ron\b/);
  assert.equal(toConciergeServiceIntent("witness"), "domestic_execution");
});

test("homepage renders the service router after the hero and intake passes intent to the one wizard", () => {
  const home = readFileSync("app/page.tsx", "utf8");
  assert.ok(home.indexOf("<ServiceRouter />") > home.indexOf("<Hero />"));
  const intake = readFileSync("app/intake/page.tsx", "utf8");
  assert.match(intake, /serviceIntent=\{params\.intent \|\| params\.service_intent/);
  const wizard = readFileSync("components/intake/smart-intake-sop-wizard.tsx", "utf8");
  assert.match(wizard, /getSmartIntakeQuestionPlan/);
  assert.match(wizard, /\{plan\.international && \(/);
  assert.match(wizard, /\[client_requested_service\]/);
  const core = readFileSync("app/api/intake/core.ts", "utf8");
  assert.equal((core.match(/client_requested_service: normalizeSmartIntakeIntent/g) ?? []).length, 2);
});
