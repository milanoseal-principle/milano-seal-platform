import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PORTAL_URL_EXPIRY_SECONDS } from "@/lib/vault";

// The upload route stores its signed URL in files.file_url and returns it to the
// uploader. A long-lived signed URL is a bearer link to a private document, so it
// must use the same short vault window as the portal (STORAGE-VAULT-01).
const source = readFileSync("app/api/upload/route.ts", "utf8");

test("upload route signs private documents with the shared vault window", () => {
  assert.ok(PORTAL_URL_EXPIRY_SECONDS <= 900, "vault window must stay at or under 15 minutes");
  assert.match(source, /createSignedUrl\(path, PORTAL_URL_EXPIRY_SECONDS\)/);
});

test("upload route mints no multi-day signed URLs", () => {
  assert.doesNotMatch(source, /60 \* 60 \* 24/);
  assert.doesNotMatch(source, /createSignedUrl\([^)]*\b(86400|604800)\b/);
});
