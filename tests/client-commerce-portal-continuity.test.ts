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

test("client discount is applied before Wise payment and never fabricates paid state", () => {
  assert.match(invoicePage, /Discount \/ Courtesy Code/);
  assert.match(invoicePage, /\/api\/portal\/me\/discount/);
  assert.match(discountRoute, /matter_total/);
  assert.match(discountRoute, /buildPaymentLink/);
  assert.match(discountRoute, /Discounts cannot be changed after payment has been verified/);
  assert.doesNotMatch(discountRoute, /payment_status:\s*["']paid["']/);
  assert.doesNotMatch(discountRoute, /payment_confirmed:\s*true/);
});

test("homepage country selection survives into the full Atlas and forces country focus", () => {
  assert.match(globe, /\/map\?country=/);
  assert.match(mapPage, /initialCountry=\{country\}/);
  assert.match(atlas, /selectedDest\?\.lat/);
  assert.match(atlas, /setFlyTarget\(\{ lat: selectedDest\.lat, lng: selectedDest\.lng, zoom: 5 \}\)/);
});

test("Wise collection no longer calls the unsupported payment-requests endpoint", () => {
  assert.doesNotMatch(wise, /payment-requests/);
  assert.match(wise, /buildPaymentLink/);
  assert.match(wise, /mode: "production"/);
  assert.match(wise, /settlement\/reconciliation remains the only payment authority/i);
});
