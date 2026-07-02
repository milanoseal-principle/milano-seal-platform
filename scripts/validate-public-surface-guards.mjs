// validate:public-surface-guards — keeps disallowed language and preview URLs off
// public surfaces:
//   - no public "Virtual Assistant" / "VA Support Role" staffing language,
//   - no "cheap notary" / "Notarize From Anywhere" / "Start Controlled Intake",
//   - no *.vercel.app preview URLs in public components/metadata.

import { readFileSync } from "fs";

const PUBLIC_FILES = [
  "app/page.tsx",
  "app/layout.tsx",
  "app/services/page.tsx",
  "components/landing/header.tsx",
  "components/landing/footer.tsx",
  "components/landing/persona-routing.tsx",
];

const FORBIDDEN = [
  /Virtual Assistant/i,
  /VA Support Role/i,
  /\bcheap notary\b/i,
  /Notarize From Anywhere/i,
  /Start Controlled Intake/i,
  /[a-z0-9-]+\.vercel\.app/i,
];

const errors = [];
for (const f of PUBLIC_FILES) {
  let src = "";
  try {
    src = readFileSync(f, "utf8");
  } catch {
    continue; // optional file
  }
  for (const re of FORBIDDEN) {
    if (re.test(src)) errors.push(`${f}: forbidden public pattern ${re}`);
  }
}

if (errors.length) {
  console.error("validate:public-surface-guards FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} public-surface error(s)`);
}
console.log("validate:public-surface-guards passed");
