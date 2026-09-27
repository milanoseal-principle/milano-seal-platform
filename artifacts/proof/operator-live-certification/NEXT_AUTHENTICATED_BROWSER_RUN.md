# Next authenticated browser certification instruction

Use this instruction in ChatGPT Work / Computer Use only after the route-fix PR is merged, the exact merged `main` SHA has a READY production deployment, and both production domains are attached with `aliasError = null`.

```text
THE MILANO SEAL™ — AUTHENTICATED OPERATOR MODULE
LIVE END-TO-END INDEPENDENT CERTIFICATION — POST-MERGE RUN

CANONICAL PRODUCTION
https://www.themilanoseal.com

SECONDARY PRODUCTION DOMAIN
https://themilanoseal.com

SOURCE INVENTORY
Use current merged main and artifacts/proof/operator-live-certification/module-matrix.json.
Treat its BLOCKED results as discovery records, not test evidence. Re-discover the current
inventory from main and reconcile every addition, removal, alias, and nested destination.

OBJECTIVE
Using a real browser that can reach production and an approved operator account, manually
exercise every authenticated destination. Do not certify from source inspection, build success,
route existence, prior screenshots, Vercel READY, or another module in the same group.

PRECONDITIONS
1. Record merged main SHA, exact READY production deployment ID, and deployment SHA.
2. Verify www.themilanoseal.com and themilanoseal.com are attached with aliasError = null.
3. Confirm deployed SHA exactly matches merged main.
4. Record UTC timestamp, browser, device, Supabase project identifier without secrets, and role.
5. Prove an unauthenticated session cannot access protected operator data.
6. Authenticate only through the normal production operator path.

ROUTE DEFECT RETEST
Open /dashboard/settings through operator navigation. Verify the authenticated shell, title,
deepest active navigation state, and links to Control Plane, Integration Health, and Security.
Verify no 404, 500, console exception, failed required request, clipping, or page overflow at
1440x900, 768x1024, 430x932, and 390x844. Record deployed SHA and screenshot evidence.
Mark APPLICATION DEFECT FIX: PASS only if the route is deployed and regression-locked.

FULL MODULE RUN
For every current inventory row:
- enter through production UI navigation;
- verify shell, title, deepest active route, Favorites, Recent, and command palette;
- check 404/500/blank states, console errors, required requests, overflow, dialogs, forms,
  tables, and reachable controls at all four viewports;
- execute the primary behavior rather than only loading the page;
- compare displayed data with its API and Supabase table/view;
- capture a redacted screenshot or artifact;
- record PASS, FAIL, or BLOCKED; never convert BLOCKED to PASS.

ONE GOVERNED MATTER
Use one approved production test Matter wherever possible. Keep its ID constant across intake,
documents, intelligence, routing, quote, discounts, Wise observation, scheduling, execution,
RON when applicable, authority/apostille, custody, courier, portal, completion, release, and
audit history. Do not fabricate settlement, provider evidence, authority responses,
notarization, courier events, or legal conclusions.

PAYMENT, API, DATA, AND SECURITY
Prove from UI, API, and backend evidence that Wise remains payment authority; pricing truth and
submission observation do not equal final settlement; scheduling, execution, and release follow
governed gates; reconciliation is idempotent; and no Stripe path or bypass exists. For each
material API, test controlled valid auth, missing auth, invalid role, malformed/missing Matter,
invalid payload, safe errors, and response compatibility. For every mutation, verify record ID,
Matter ID, state, timestamps, audit rows, and relevant payment/authority/courier references in
Supabase. Verify no duplicate Matter, orphan row, silent failure, or unauthorized RLS access.
Never expose secrets, tokens, client PII, private documents, or sensitive payment data.

NEGATIVE TESTS
Exercise expired/invalid session, unauthorized role, missing and malformed Matter, failed fetch,
empty data, invalid input, duplicate submission, repeated click, stale request, unsupported
document condition, blocked payment, blocked scheduling, blocked release, and unavailable
external-provider response. Confirm failures are explicit and fail closed.

FINAL EVIDENCE
For every module record module, group, route, role, action, expected and actual result,
PASS/FAIL/BLOCKED, backend evidence, API evidence, redacted artifact, defect ID, fix commit, and
retest result. Totals must reconcile exactly. Separately report API, Supabase, Wise/payment,
Matter consistency, device, security/role, defects, fixes, final production SHA, external
dependencies, and human/real-world actions.

Use only one conclusion:
- CERTIFIED: every applicable authenticated module was exercised live and passed with evidence.
- CERTIFIED WITH EXTERNAL DEPENDENCIES: all application-controlled modules passed and only
  explicitly named provider or real-world actions remain.
- NOT CERTIFIED: any application-controlled module failed or was not actually exercised.

Required final distinction:
APPLICATION DEFECT FIX:
PASS only if /dashboard/settings is deployed for the exact production SHA and regression-locked.

AUTHENTICATED LIVE MODULE CERTIFICATION:
Do not mark certified unless all current destinations were manually exercised with evidence.
```
