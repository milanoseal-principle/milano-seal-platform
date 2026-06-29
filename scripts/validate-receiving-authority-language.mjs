// validate:receiving-authority-language — locks in the boundary language that keeps
// the platform out of guarantee/legal-advice territory:
//   - RON / mobile-notary / witness availability caveats on the services page,
//   - "Final acceptance is determined by the receiving authority." on the services
//     page and the notification orchestrator (apostille/release/delivery events).

import { readFileSync } from "fs";

const errors = [];
function read(f) {
  try {
    return readFileSync(f, "utf8");
  } catch {
    errors.push("missing file: " + f);
    return "";
  }
}

const services = read("app/services/page.tsx");
const RON_MOBILE_WITNESS = [
  /Remote Online Notarization/i,
  /Mobile notary availability depends/i,
  /Witnesses do not provide legal advice/i,
];
for (const re of RON_MOBILE_WITNESS) {
  if (!re.test(services)) errors.push(`services page missing boundary: ${re}`);
}

const RECEIVING = /Final acceptance is determined by the receiving authority/i;
if (!RECEIVING.test(services))
  errors.push("services page missing receiving-authority boundary");

const orchestrator = read("lib/notifications/orchestrator.ts");
if (!/receiving authority/i.test(orchestrator))
  errors.push("notification orchestrator missing receiving-authority boundary");

if (errors.length) {
  console.error("validate:receiving-authority-language FAILED:");
  for (const e of errors) console.error("  - " + e);
  throw new Error(`${errors.length} receiving-authority-language error(s)`);
}
console.log("validate:receiving-authority-language passed");
