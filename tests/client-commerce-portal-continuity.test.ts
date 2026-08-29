import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const loginLayout = readFileSync("app/login/layout.tsx", "utf8");
const forgotPage = readFileSync("app/forgot-password/page.tsx", "utf8");
const recoveryRoute = readFileSync("app/auth/recovery/route.ts", "utf8");
const resetPage = readFileSync("app/reset-password/page.tsx", "utf8");
const invoicePage = readFileSync("app/portal/invoice/page.tsx", "utf8");
const invoiceRoute = readFileSync("app/api/portal/me/invoice/route.ts", "utf8");
const discountRoute = readFileSync("app/api/portal/me/discount/route.ts", "utf8");
const discountService = readFileSync("src/features/discounts/discountService.ts", "utf8");
const portalFrame = readFileSync("components/portal/portal-frame.tsx", "utf8");
const portalLedger = readFileSync("components/portal/PortalOrderLedger.tsx", "utf8");
const globe = readFileSync("components/globe/GlobalRouteGlobe.tsx", "utf8");
const atlas = readFileSync("components/landing/global-intel-map-interactive.tsx", "utf8");
const mapPage = readFileSync("app/map/page.tsx", "utf8");
const wise = readFileSync("lib/wise.ts", "utf8");

test("secure login exposes a complete enumeration-safe password recovery path", () => {
  assert.match(loginLayout, /Forgot password\?/);
  assert.match(loginLayout, /\/forgot-password/);
  assert.match(forgotPage, /\/api\/auth\/password\/reset-request/);
  assert.match(recoveryRoute, /exchangeCodeForSession|verifyOtp/);
  assert.match(recoveryRoute, /\/reset-password/);
  assert.match(resetPage, /updateUser\(\{ password \}\)/);
  assert.match(resetPage, /signOut\(\)/);
  assert.match(resetPage, /\/login\?password_reset=1&next=\/portal/);
});

test("portal home and invoice share one client-safe itemized pricing projection", () => {
  assert.match(portalFrame, /PortalOrderLedger/);
  assert.match(portalLedger, /\/api\/portal\/me\/invoice/);
  assert.match(portalLedger, /Matter Order Ledger/);
  assert.match(invoicePage, /Itemized Order/);
  assert.match(invoicePage, /Original Matter total/);
  assert.match(invoicePage, /Final Matter total/);
  assert.match(invoicePage, /50% retainer due now/);
  assert.match(invoicePage, /Remaining balance/);
  assert.match(invoiceRoute, /buildClientInvoiceSnapshot/);
});

test("client invoice routes discount mutations through the one canonical discount service", () => {
  assert.match(invoicePage, /Discount \/ Courtesy Code/);
  assert.match(invoicePage, /\/api\/portal\/me\/discount/);
  assert.match(discountRoute, /applyDiscountToMatter/);
  assert.doesNotMatch(discountRoute, /\.from\("discount_codes"\)/);
  assert.doesNotMatch(discountRoute, /\.update\(\{[\s\S]*?discount_amount/);

  assert.match(discountService, /discount\.applies_to === "matter_total"/);
  assert.match(discountService, /discountBase/);
  assert.match(discountService, /assertNoPaymentInMotion/);
  assert.match(discountService, /invalidateAwaitingWiseInstructions/);
  assert.match(discountService, /buildPaymentLink/);
  assert.match(discountService, /redemptionStatus: "not_redeemed"/);
  assert.doesNotMatch(discountService, /payment_status:\s*["']paid["']/);
  assert.doesNotMatch(discountService, /payment_confirmed:\s*true/);
});

test("homepage country selection survives into the full Atlas and forces country focus", () => {
  assert.match(globe, /\/map\?country=/);
  assert.match(mapPage, /initialCountry=\{country\}/);
  assert.match(atlas, /selectedDest\?\.lat/);
  assert.match(atlas, /setFlyTarget\(\{ lat: selectedDest\.lat, lng: selectedDest\.lng, zoom: 5 \}\)/);
});

test("Wise collection no longer calls the unsupported payment-request API", () => {
  assert.doesNotMatch(wise, /fetch\([\s\S]{0,240}payment-requests/);
  assert.match(wise, /buildPaymentLink/);
  assert.match(wise, /mode: "production"/);
  assert.match(wise, /settlement\/reconciliation remains the only payment authority/i);
});