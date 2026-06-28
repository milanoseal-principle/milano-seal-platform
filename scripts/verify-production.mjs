const BASE = process.env.BASE || process.env.BASE_URL || "https://themilanoseal.com";
const requiredRoutes = ["/", "/intake", "/countries", "/map"];
const failures = [];

function url(path) {
  return new URL(path, BASE).toString();
}

async function expectStatus(label, request, expected) {
  try {
    const response = await request();
    const body = await response.text().catch(() => "");
    const ok = Array.isArray(expected) ? expected.includes(response.status) : response.status === expected;
    if (!ok) {
      failures.push(`${label}: expected ${expected}, got ${response.status}`);
      return;
    }
    if (/SUPABASE_SERVICE_ROLE_KEY|WISE_API_TOKEN|SHIPPO_WEBHOOK_SECRET|RESEND_API_KEY|TWILIO_AUTH_TOKEN/i.test(body)) {
      failures.push(`${label}: response appears to leak a secret variable label`);
      return;
    }
    console.log(`✓ ${label}: ${response.status}`);
  } catch (error) {
    failures.push(`${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

for (const route of requiredRoutes) {
  await expectStatus(`public ${route}`, () => fetch(url(route), { method: "HEAD", redirect: "manual" }), [200, 301, 302, 307, 308]);
}

await expectStatus("Wise GET health", () => fetch(url("/api/webhooks/wise"), { method: "GET" }), 200);
await expectStatus("Wise unsigned POST rejection", () => fetch(url("/api/webhooks/wise"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ event_type: "balances#credit" }),
}), 401);
await expectStatus("Shippo GET safety", () => fetch(url("/api/webhooks/shippo"), { method: "GET" }), [200, 404, 405]);
await expectStatus("Shippo no-secret POST rejection", () => fetch(url("/api/webhooks/shippo"), {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ carrier: "usps", tracking_number: "TEST", tracking_status: { status: "DELIVERED" } }),
}), 401);

if (process.env.SHIPPO_WEBHOOK_SECRET) {
  await expectStatus("Shippo authorized POST", () => fetch(`${url("/api/webhooks/shippo")}?secret=${encodeURIComponent(process.env.SHIPPO_WEBHOOK_SECRET)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      carrier: "usps",
      tracking_number: "TESTTRACKING123",
      tracking_status: {
        status: "TRANSIT",
        substatus: { code: "information_received", text: "Tracking information received", action_required: false },
        status_details: "Tracking information received",
        status_date: "2026-06-28T12:00:00Z",
        location: { city: "St. Petersburg", state: "FL", country: "US" },
      },
    }),
  }), 200);
} else {
  console.log("— SKIP: Shippo authorized POST requires SHIPPO_WEBHOOK_SECRET in the local environment.");
}

if (failures.length) {
  failures.forEach((failure) => console.error(`✗ ${failure}`));
  process.exit(1);
}

console.log(`✓ Production verification passed for ${BASE}`);
