import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  HANDOFF_ALLOWED_PARAMS,
  buildClientHandoffUrl,
  createReferralReference,
  resolveProfessionalReferral,
  verifyReferralReference,
} from "@/lib/professional/referral";
import {
  NEVER_REUSED_FIELDS,
  REUSABLE_PROFESSIONAL_DEFAULT_FIELDS,
  normalizeProfessionalProfileInput,
  professionalCanSubmit,
  professionalMatterDefaults,
} from "@/lib/professional/profile";
import {
  buildProfessionalIntakePayload,
  executionTruthForPosture,
  normalizeProfessionalMatterSubmission,
} from "@/lib/professional/handoff";
import {
  PROFESSIONAL_FORBIDDEN_FIELDS,
  PROFESSIONAL_MATTER_COLUMNS,
  PROFESSIONAL_STATUS_COPY,
  RECEIVING_AUTHORITY_DISCLAIMER,
  professionalOwnsMatter,
  projectMatterForProfessional,
} from "@/lib/professional/matterProjection";
import {
  PROFESSIONAL_NOTIFICATION_COPY,
  professionalNotificationAllowed,
  professionalNotificationMessage,
} from "@/lib/professional/notifications";
import { summarizeProfessionalAttribution } from "@/lib/professional/attribution";
import { getHomeRouteForRole, isRouteAllowedForRole } from "@/lib/auth/roleRedirect";
import { isOperatorOrFounder } from "@/lib/security/access-control";

const root = process.cwd();
const read = (file: string) => fs.readFileSync(path.join(root, file), "utf8");
const SECRET = "test-secret-for-professional-referrals";
const PROFILE = "2f1d9c4e-8a7b-4c3d-9e2f-1a2b3c4d5e6f";
const OTHER_PROFILE = "7a6b5c4d-3e2f-4a1b-8c9d-0e1f2a3b4c5d";
const activeLookup = async (id: string) => (id === PROFILE ? { id, status: "active" } : null);

const submission = () => {
  const parsed = normalizeProfessionalMatterSubmission({
    client_name: "Giulia Rossi",
    client_email: "Giulia@Example.com",
    document_type: "Power of Attorney",
    document_origin: "Florida",
    destination_country: "Italy",
    signer_location: "Miami, FL",
    execution_posture: "signature_needed",
    receiving_authority: "Notaio in Milano",
    document_count: 2,
    deadline: "2026-11-01",
    professional_instructions: "Bilingual POA prepared by counsel.",
  });
  assert.ok(parsed.ok);
  return parsed.submission;
};

test("professional creates a Matter through canonical intake review, never a parallel Matter system", () => {
  const reference = createReferralReference(PROFILE, "submitted", SECRET);
  const payload = buildProfessionalIntakePayload({
    submission: submission(),
    profile: { id: PROFILE, firm_name: "Studio Legale Rossi", contact_name: "Avv. Rossi" },
    referralReference: reference,
  });
  assert.equal(payload.source_channel, "professional");
  assert.equal(payload.professional_profile_id, PROFILE);
  assert.equal(payload.referral_reference, reference);
  assert.equal(payload.email, "giulia@example.com");
  // Counsel never chooses a legal conclusion: the notarial act and execution
  // method stay review_required for the operator.
  assert.equal(payload.execution_truth.notarial_act, "review_required");
  assert.equal(payload.execution_truth.execution_method, "review_required");
  assert.equal(executionTruthForPosture("unknown").notarization_requirement, "review_required");

  const route = read("app/api/professional/matters/route.ts");
  assert.match(route, /canonicalIntakePost/);
  assert.doesNotMatch(route, /from\("deals"\)\s*\n?\s*\.insert/);
  const core = read("app/api/intake/core.ts");
  assert.match(core, /sourceHint === "admin" \|\| sourceHint === "professional"/);

  const migration = read("supabase/migrations/082_professional_referral_engine.sql");
  assert.doesNotMatch(migration, /create table[^;]*(professional_matter|lawyer_matter|referral_matter)/i);
  assert.match(migration, /add column if not exists professional_profile_id uuid/);
});

test("referral attribution is persisted only for a correctly signed reference on a live profile", async () => {
  const reference = createReferralReference(PROFILE, "submitted", SECRET);
  const fields = await resolveProfessionalReferral(
    { professional_profile_id: PROFILE, referral_reference: reference },
    activeLookup,
    SECRET,
  );
  assert.deepEqual(fields, {
    professional_profile_id: PROFILE,
    referral_source_type: "professional_submitted",
    referral_source_id: PROFILE,
    referral_reference: reference,
  });

  // Forged, cross-profile, tampered or unsigned references fail closed.
  assert.equal(await resolveProfessionalReferral({ professional_profile_id: OTHER_PROFILE, referral_reference: reference }, activeLookup, SECRET), null);
  const tampered = reference.replace("MSR-S-", "MSR-H-");
  assert.equal(verifyReferralReference(tampered, PROFILE, SECRET).valid, false);
  assert.equal(await resolveProfessionalReferral({ professional_profile_id: PROFILE, referral_reference: reference }, activeLookup, null), null);
  assert.equal(
    await resolveProfessionalReferral({ professional_profile_id: PROFILE, referral_reference: reference }, async (id) => ({ id, status: "inactive" }), SECRET),
    null,
  );

  const core = read("app/api/intake/core.ts");
  assert.equal((core.match(/\.\.\.referralFields,/g) ?? []).length, 2, "both canonical intake inserts carry attribution");
});

test("client handoff link preserves the professional relationship and carries no client facts", async () => {
  const reference = createReferralReference(PROFILE, "handoff", SECRET);
  const url = new URL(
    buildClientHandoffUrl({
      origin: "https://www.themilanoseal.com",
      profileId: PROFILE,
      destination: "Italy",
      documentType: "Power of Attorney",
      reference,
    }),
  );
  assert.equal(url.pathname, "/intake");
  assert.deepEqual([...url.searchParams.keys()].sort(), [...HANDOFF_ALLOWED_PARAMS].sort());
  assert.equal(url.searchParams.get("destination"), "italy");
  assert.equal(url.searchParams.get("document"), "power-of-attorney");
  assert.doesNotMatch(url.toString(), /@|client|email|phone|passport|name=/i);

  const fields = await resolveProfessionalReferral(
    { professional_profile_id: url.searchParams.get("pro"), referral_reference: url.searchParams.get("ref") },
    activeLookup,
    SECRET,
  );
  assert.equal(fields?.referral_source_type, "professional_client_handoff");

  const wizard = read("components/intake/smart-intake-sop-wizard.tsx");
  assert.match(wizard, /professional_profile_id: professionalReferral\?\.profileId/);
  assert.match(wizard, /referral_reference: professionalReferral\?\.reference/);
});

test("returning professional defaults load firm-level fields and never client PII or legal conclusions", () => {
  const defaults = professionalMatterDefaults({
    firm_name: "Studio Legale Rossi",
    preferred_destination_countries: ["Italy"],
    default_receiving_authority: "Comune di Milano",
    client_instruction_template: "Please bring a passport.",
    email: "avv@rossi.it",
    status: "active",
  });
  assert.equal(defaults.firm_name, "Studio Legale Rossi");
  assert.deepEqual(defaults.preferred_destination_countries, ["Italy"]);
  for (const key of Object.keys(defaults)) {
    assert.ok((REUSABLE_PROFESSIONAL_DEFAULT_FIELDS as readonly string[]).includes(key));
  }
  for (const field of NEVER_REUSED_FIELDS) {
    assert.ok(!(REUSABLE_PROFESSIONAL_DEFAULT_FIELDS as readonly string[]).includes(field as never));
  }
  const parsed = normalizeProfessionalProfileInput({
    firm_name: "Studio",
    contact_name: "Avv.",
    email: " AVV@Rossi.IT ",
    passport_number: "X123",
    client_name: "Someone",
  });
  assert.ok(parsed.ok);
  assert.equal(parsed.profile.email, "avv@rossi.it");
  assert.ok(!("passport_number" in parsed.profile));
  assert.ok(!("client_name" in parsed.profile));
  assert.equal(professionalCanSubmit({ status: "prospect", user_id: null }), false);
  assert.equal(professionalCanSubmit({ status: "active", user_id: "u1" }), true);
});

test("an unauthorized professional cannot view another firm's Matter or operator surfaces", () => {
  assert.equal(professionalOwnsMatter(PROFILE, { professional_profile_id: PROFILE }), true);
  assert.equal(professionalOwnsMatter(PROFILE, { professional_profile_id: OTHER_PROFILE }), false);
  assert.equal(professionalOwnsMatter(null, { professional_profile_id: null }), false);

  const list = read("app/api/professional/matters/route.ts");
  assert.match(list, /\.eq\("professional_profile_id", context\.profile\.id\)/);
  assert.match(list, /row\.professional_profile_id === context\.profile\.id/);

  assert.equal(getHomeRouteForRole("professional"), "/professional/matters");
  assert.equal(isRouteAllowedForRole("/professional/matters", "professional"), true);
  for (const blocked of ["/dashboard", "/dashboard/deals/x", "/portal", "/va/dashboard", "/alliance/dashboard"]) {
    assert.equal(isRouteAllowedForRole(blocked, "professional"), false, blocked);
  }
  // Professionals never gain operator permissions: quote approval, pricing,
  // payment, scheduling, execution, apostille, release and closeout stay
  // behind operator/founder roles.
  assert.equal(isOperatorOrFounder("professional"), false);
  assert.match(read("app/api/deals/[id]/quote/route.ts"), /isOperatorOrFounder\(role\)/);

  const migration = read("supabase/migrations/082_professional_referral_engine.sql");
  assert.match(migration, /using \(user_id = auth\.uid\(\)\)/);
});

test("operator-only fields never leak into the professional projection", () => {
  const view = projectMatterForProfessional({
    id: "m1",
    deal_id: "MS-1",
    professional_profile_id: PROFILE,
    client_name: "Giulia Rossi",
    destination_country: "Italy",
    document_type: "Power of Attorney",
    deal_status: "reviewing",
    ...({ internal_notes: "margin 40%", quote_breakdown: [{ amount: 750 }], access_token: "secret" } as object),
  });
  const json = JSON.stringify(view);
  for (const field of PROFESSIONAL_FORBIDDEN_FIELDS) {
    assert.ok(!(field in view), field);
    assert.ok(!(PROFESSIONAL_MATTER_COLUMNS as readonly string[]).includes(field), field);
  }
  assert.doesNotMatch(json, /margin|secret|750/);
});

test("public professional surfaces keep numeric pricing hidden and quotes Matter-specific", () => {
  const hub = read("app/professional/page.tsx");
  assert.match(hub, /You retain legal control\./);
  assert.match(hub, /The Milano Seal handles the U\.S\. execution side\./);
  assert.match(hub, /Start a Client Matter/);
  assert.match(hub, /Create Professional Profile/);
  assert.match(hub, /Matter-specific execution quote issued after review\./);
  for (const file of [
    "app/professional/page.tsx",
    "app/professional/start/page.tsx",
    "app/professional/profile/page.tsx",
    "components/professional/ProfessionalMatterForm.tsx",
    "components/professional/ProfessionalMatterDashboard.tsx",
  ]) {
    const source = read(file);
    assert.doesNotMatch(source, /\$\s?\d/, file);
    assert.doesNotMatch(source, /pricingCatalog|pricingComposer|MATTER_BASES/, file);
  }
  for (const file of fs.readdirSync(path.join(root, "lib/professional"))) {
    if (!file.endsWith(".ts")) continue;
    const source = read(`lib/professional/${file}`);
    assert.doesNotMatch(source, /pricingCatalog|createWisePaymentRequest|stripe/i, file);
  }
});

test("Wise stays canonical and scheduling stays payment-gated in the professional view", () => {
  const unpaid = projectMatterForProfessional({ id: "m", quote_approved_at: "2026-09-01", payment_status: "unpaid" });
  assert.equal(unpaid.stage, "Quote issued");
  assert.equal(unpaid.paymentPosture, "Deposit due");
  assert.equal(unpaid.executionPosture, "Pending payment gate");

  const observed = projectMatterForProfessional({ id: "m", quote_approved_at: "2026-09-01", payment_status: "observed_pending" });
  assert.equal(observed.stage, "Awaiting payment");
  assert.notEqual(observed.executionPosture, "Ready to schedule");

  const paid = projectMatterForProfessional({ id: "m", payment_status: "paid", payment_confirmed: true });
  assert.equal(paid.stage, "Scheduling available");
  assert.equal(paid.executionPosture, "Ready to schedule");

  const review = projectMatterForProfessional({ id: "m", quote_review_required: true });
  assert.equal(review.stage, "Review required");
});

test("receiving-authority disclaimer is preserved on every professional message and view", () => {
  assert.equal(RECEIVING_AUTHORITY_DISCLAIMER, "Final acceptance is determined by the receiving authority.");
  for (const event of Object.keys(PROFESSIONAL_NOTIFICATION_COPY) as Array<keyof typeof PROFESSIONAL_NOTIFICATION_COPY>) {
    assert.ok(professionalNotificationMessage(event).body.endsWith(RECEIVING_AUTHORITY_DISCLAIMER), event);
  }
  assert.equal(professionalNotificationAllowed("exceptions_only", "correction_required"), true);
  assert.equal(professionalNotificationAllowed("exceptions_only", "quote_ready"), false);
  assert.equal(professionalNotificationAllowed("key_milestones", "payment_observed"), false);
  assert.equal(professionalNotificationAllowed("all_milestones", "payment_observed"), true);
  assert.equal(projectMatterForProfessional({ id: "m" }).acceptanceNotice, RECEIVING_AUTHORITY_DISCLAIMER);
  assert.match(read("lib/notifications/orchestrator.ts"), /queueProfessionalNotification\(admin, dealId, event\)/);
  const professionalCopy = JSON.stringify(PROFESSIONAL_NOTIFICATION_COPY);
  assert.doesNotMatch(professionalCopy, /guarantee|legal approval|will be accepted/i);
  for (const label of PROFESSIONAL_STATUS_COPY) assert.doesNotMatch(label, /approved|accepted|guarantee/i);
});

test("completion is visible to the professional after the Matter closes", () => {
  const view = projectMatterForProfessional({
    id: "m",
    payment_status: "paid",
    balance_payment_status: "paid",
    executed_at: "2026-09-02",
    apostille_required: true,
    apostille_at: "2026-09-10",
    shipped_at: "2026-09-11",
    delivered_at: "2026-09-14",
    completed_at: "2026-09-15",
    deal_status: "completed",
  });
  assert.equal(view.stage, "Completed");
  assert.equal(view.completed, true);
  assert.equal(view.paymentPosture, "Paid in full");
  assert.equal(view.authenticationStage, "Completed");
  assert.equal(view.courierStage, "Delivered");
});

test("channel attribution derives from canonical Matter truth and never invents revenue", () => {
  const [summary] = summarizeProfessionalAttribution([
    { id: "a", professional_profile_id: PROFILE, destination_country: "Italy", document_type: "POA", final_total: 750, verified_revenue: 750, completed_at: "2026-09-15", created_at: "2026-09-01", referral_source_type: "professional_submitted" },
    { id: "b", professional_profile_id: PROFILE, destination_country: "UAE", document_type: "Corporate", final_total: 1850, verified_revenue: null, created_at: "2026-09-05", quote_review_required: true, referral_source_type: "professional_client_handoff" },
    { id: "b", professional_profile_id: PROFILE, destination_country: "UAE", document_type: "Corporate", final_total: 1850, verified_revenue: 1850, created_at: "2026-09-05" },
  ]);
  assert.equal(summary.mattersReferred, 2, "duplicate Matter rows are counted once");
  assert.equal(summary.mattersCompleted, 1);
  assert.equal(summary.matterValue, 2600);
  assert.equal(summary.verifiedRevenue, 750, "unpaid quote value is never revenue");
  assert.equal(summary.repeatReferral, true);
  assert.equal(summary.routeTypes.hague_apostille, 1);
  assert.equal(summary.routeTypes.consular_legalization, 1);
  assert.equal(summary.reviewRequiredCount, 1);
});
