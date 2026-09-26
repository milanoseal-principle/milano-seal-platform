import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck", "--", "--pretty", "false"], {
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if ((result.status ?? 1) === 0) process.exit(0);

const first = output
  .split(/\r?\n/)
  .find((line) => /\.(?:ts|tsx)\(\d+,\d+\): error TS\d+/.test(line)) ?? "";

const exact = [
  ["lib/pricing/canonicalFacade.ts", 81],
  ["lib/pricing.ts", 82],
  ["lib/pricing/pricingComposer.ts", 83],
  ["lib/pricing/pricingCatalog.ts", 84],
  ["lib/intake/operatorHandoff.ts", 85],
  ["lib/format.ts", 86],
  ["lib/security/access-control.ts", 87],
];
for (const [file, code] of exact) if (first.startsWith(file)) process.exit(code);

const dirs = [
  "alliance","atlas","canonical","command-center","compliance","content","control-plane",
  "core","country","custody","dashboard","dispatch","government","high-value-assets",
  "i18n","intake","intelligence","jurisdictions","matter","notifications","payments",
  "platform","portal","pre-execution","pricing","professional","procurement","revenue",
  "revenue-stack","safety","security","seo","shippo","supabase","trust-network","wise"
];
if (first.startsWith("lib/")) {
  const match = first.match(/^lib\/([^/]+)\//);
  if (match) {
    const index = dirs.indexOf(match[1]);
    if (index >= 0) process.exit(90 + index);
  }
  process.exit(125);
}
process.exit(126);
