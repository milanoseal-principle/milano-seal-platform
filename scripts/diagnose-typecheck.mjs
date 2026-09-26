import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck", "--", "--pretty", "false"], {
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  shell: process.platform === "win32",
});

const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if ((result.status ?? 1) === 0) {
  console.log("TYPECHECK_DIAGNOSTIC_PASS");
  process.exit(0);
}

const rules = [
  ["lib/pricing/canonicalFacade.ts", 11],
  ["lib/pricing.ts", 12],
  ["app/api/intake/core.ts", 13],
  ["app/api/admin/pricing/quote/route.ts", 14],
  ["components/dashboard/operator-intake-form.tsx", 15],
  ["tests/unit/pricingSecurityConvergence.test.ts", 16],
];
for (const [file, code] of rules) {
  if (output.includes(file)) process.exit(code);
}
process.exit(17);
