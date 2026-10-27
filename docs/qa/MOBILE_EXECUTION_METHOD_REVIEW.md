# Mobile intake: actionable execution-method review

## Root cause and state contract

The Smart Intake SOP wizard already held `executionType`, but did not render an editing control for it. `outstandingRequirements()` could require remote/in-person execution while the review panel offered only an informational Execution Path. Review Edit actions cleared unrelated values or returned to steps that could not resolve the field. The unfinished form was not restored after reload.

The existing field now has a labeled selector and explicit Save action directly in order review. Its four choices are remote, in-person, no additional notarization/authentication only, and unsure/document review. Generic in-person preference maps to canonical `in_person`, not mobile deployment; choosing it does not authorize travel services or fees.

The saved preference updates the existing classification/readiness state. An explicit document-review request resolves the client's execution-method question without declaring the route or quote approved. Other client-owned details still need completion. Every displayed outstanding requirement links to its actual field; collapsed details open before focus, and submission errors focus the relevant control instead of leaving unexplained disabled checkout.

## Persistence and authority

Before submission, the existing form is the draft authority. A versioned, context-scoped, validated session draft restores confirmed inputs, the current step and the limited lower-precedence analysis used for classification. It expires after 24 hours and is removed after successful Matter capture. File contents, consent, payment flags, quotes and approval authority are not restored. Selected files must be reattached after reload. Storage failure is disclosed rather than falsely promising reload persistence.

On submission, the selected method maps to the existing canonical execution fields. The canonical intake handler validates method values, normalizes/validates execution truth and persists it in the existing `reviewPayload.execution_truth`. Public execution preferences enter the existing review-required capture path, including professional-referral/re-entry sources. Unsupported methods return 400 before persistence. No new order, routing, pricing or payment system is introduced.

Remote and in-person preferences do not establish document eligibility, notarial act, jurisdiction or receiving-authority approval. Authentication-only and uncertain requests also require review. The client is offered **Submit for document review**, not an unapproved payment request. That branch saves the Matter as intake received/unpaid with review reasons and issues no invoice or Wise request. Existing pricing and scheduling authorization are unchanged; this PR does not deploy the separate settlement hotfix.

## Regression coverage

`tests/unit/executionMethodReview.test.ts` covers unresolved and explicitly negative route flags, review versus quote readiness, required routing inputs, unresolved document/jurisdiction truth, server review capture, validated reload state, expiration/context isolation and rejected malformed drafts.

`scripts/test-intake-execution-method.mjs` exercises all four choices at 320, 360, 390 and 430 pixels in rendered Chromium:

1. Missing method with an actionable Edit control.
2. Invalid or unsaved choice rejected.
3. Select and save; checklist updates.
4. Reload; confirmed preference restores and consent resets.
5. Edit opens collapsed details and focuses the exact field.
6. Keyboard focus, control bounds, no covered Save button, no horizontal overflow, minimum button dimensions.
7. Consent and permitted review submission with the correct canonical request fields and no client-approved quote.
8. Draft removed after successful capture.

The browser harness intercepts intake writes and uses synthetic fixtures. It also checks the actual local API's 400 response for an invalid method. It never submits a production order; mocked browser capture does not prove production database persistence or physical-device keyboard behavior.

Run against a local development server using the existing Playwright installation:

```sh
node scripts/test-intake-execution-method.mjs
```

`PLAYWRIGHT_MODULE` can point to an existing Playwright module installed outside the checkout. `CHROMIUM_PATH` selects the Chromium executable (default `/usr/bin/chromium`). `MILANO_RENDERED_BASE_URL` must be localhost/127.0.0.1. `MILANO_TEST_ARTIFACT_DIR` optionally saves synthetic local screenshots.

## Live inspection boundary

Production `/intake` returned HTTP 200 during this work. A read-only rendered inspection was attempted with non-GET/HEAD requests blocked, but Chromium rejected the environment proxy certificate. TLS verification was preserved. No production order, payment, deployment or screenshot baseline was created.

## Results in this workspace

- Full local Vercel merge gate: PASS, including typecheck, lint, 1,011 tests, required validators and production build through the final-regression stage.
- Rendered mobile matrix: PASS, 16 cases plus invalid-method validation. Intake writes were intercepted; server persistence was covered by the existing review-path contract tests, not a live database write.
- Advisory validators: 61/70 passed; the same nine pre-existing copy/navigation/historical-module checks remain unresolved and are not claimed as passes.
- No preview deployment was explicitly opted in; no production deployment or order change was performed.
