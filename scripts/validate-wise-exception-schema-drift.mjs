#!/usr/bin/env node
import { readFileSync } from "node:fs";
const source = readFileSync("lib/wise/reconciliation-exceptions.ts", "utf8");
if (/is_platform_fee_only/.test(source)) {
  console.error("FAIL removed deals.is_platform_fee_only is still referenced");
  process.exit(1);
}
for (const required of ["wise_transaction_reference","payment_funding_method","payment_observed_at"]) {
  if (!source.includes(required)) {
    console.error(`FAIL missing canonical field ${required}`);
    process.exit(1);
  }
}
console.log("PASS Wise exception scanner matches canonical production deals schema");
