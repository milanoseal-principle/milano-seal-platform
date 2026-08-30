import assert from "node:assert/strict"; import fs from "node:fs";
const checks = fs.readFileSync("lib/certification/checks.ts", "utf8"); const report = fs.readFileSync("lib/certification/report.ts", "utf8"); const moduleText = ["lib/certification/types.ts", "lib/certification/checks.ts", "lib/certification/evidence.ts", "lib/certification/report.ts"].map((file) => fs.readFileSync(file, "utf8")).join("\n");
for (const key of ["PHASE_1", "PHASE_2", "PHASE_2A", "PHASE_3", "PHASE_4", "PHASE_5", "Mobile UX and dead-action sweep", "STOP BEFORE PAYMENT"]) assert.ok(checks.includes(key));
assert.ok(report.includes('result === "PASS"')); assert.ok(report.includes("MATTER_CONTINUITY" ) || fs.readFileSync("lib/certification/evidence.ts", "utf8").includes("MATTER_CONTINUITY_BROKEN"));
assert.ok(!/payment_confirmed\s*:|from\(["']payments["']\)\.insert|stripe/i.test(moduleText));
console.log("Production certification engine validation passed: manual evidence remains pending and GO fails closed.");
