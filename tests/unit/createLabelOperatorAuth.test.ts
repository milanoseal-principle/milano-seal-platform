import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The legacy create-label route is outside the proxy's protected API prefixes,
// so it must authenticate and authorize operators itself before any Matter
// read, payment gate, label purchase or label URL response.
test("legacy create-label route requires an authenticated operator before any work", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/shipping/create-label/[id]/route.ts"), "utf8");
  assert.match(source,/await requireDashboardAccess\(\)/);
  assert.match(source,/GOVERNED_SHIPMENT_LEG_REQUIRED/);
  assert.match(source,/status:409/);
  assert.doesNotMatch(source,/buyLabel|purchaseShippoLabel|createShipment|user_metadata/);
});
