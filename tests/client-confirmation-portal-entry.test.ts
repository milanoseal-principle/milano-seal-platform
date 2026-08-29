import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

const signup = read("app/api/auth/signup/route.ts");
const callback = read("app/auth/callback/route.ts");
const portalLayout = read("app/portal/layout.tsx");
const portalBoundary = read("components/portal/portal-client-error-boundary.tsx");

test("signup confirmation always returns through the controlled auth callback", () => {
  assert.match(signup, /emailRedirectTo:\s*`\$\{origin\}\/auth\/callback\?flow=signup&next=\/portal`/);
  assert.doesNotMatch(signup, /emailRedirectTo:\s*`\$\{origin\}\/login\?next=\/portal`/);
});

test("verified signup is separated from interactive login on every device", () => {
  assert.match(callback, /flow === "signup"/);
  assert.match(callback, /await supabase\.auth\.signOut\(\)/);
  assert.match(callback, /\/login\?confirmed=1&next=\/portal/);
});

test("client portal can never fail as an unexplained black screen", () => {
  assert.match(portalLayout, /PortalClientErrorBoundary/);
  assert.match(portalBoundary, /Your portal did not finish loading/);
  assert.match(portalBoundary, /Reload Portal/);
  assert.match(portalBoundary, /Return to Login/);
});
