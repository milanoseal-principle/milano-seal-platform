import { existsSync, readFileSync } from "node:fs";

const engine = "lib/translations/translationRequirementEngine.ts";
if (!existsSync(engine)) {
  console.error(`FAIL missing ${engine}`);
  process.exit(2);
}
const src = readFileSync(engine, "utf8");

let failures = 0;

// unknown => manual review, do not finalize
if (!(src.includes('"unknown"') && src.includes("requiresManualReview: true"))) {
  console.error("FAIL unknown translation status must require manual review");
  failures += 1;
}
if (!src.includes("do not finalize")) {
  console.error("FAIL unknown translation must not finalize");
  failures += 1;
}

for (const f of [
  "lib/translations/types.ts",
  "lib/translations/translationPartnerPolicy.ts",
  "lib/translations/translationAccuracyAffidavit.ts",
  "lib/translations/translationSafety.ts",
]) {
  if (!existsSync(f)) {
    console.error(`FAIL missing ${f}`);
    failures += 1;
  }
}

if (failures) {
  console.error(`FAIL translation-coordination: ${failures} issue(s)`);
  process.exit(2);
}
console.log("OK translation-coordination");
