import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

// The legacy create-label route is outside the proxy's protected API prefixes,
// so it must authenticate and authorize operators itself before any Matter
// read, payment gate, label purchase or label URL response.
test("legacy create-label route requires an authenticated operator before any work", () => {
  const source = fs.readFileSync(path.join(process.cwd(), "app/api/shipping/create-label/[id]/route.ts"), "utf8");
  const authCheck = source.indexOf("await ssr.auth.getUser()");
  const roleCheck = source.indexOf("isOperatorOrFounder(user.app_metadata?.role");
  const firstRead = source.indexOf('.from("deals")');
  const purchase = source.indexOf("buyLabelWithFailover(");
  assert.ok(authCheck > -1 && roleCheck > authCheck, "auth then role check present");
  assert.ok(roleCheck < firstRead, "role check precedes the Matter read");
  assert.ok(roleCheck < purchase, "role check precedes label purchase");
  assert.match(source, /status: 401/);
  assert.match(source, /status: 403/);
  assert.doesNotMatch(source, /user_metadata/);
});
