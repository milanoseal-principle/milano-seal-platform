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

const componentDirs = [
  "acquisition","alliance","animations","assistant","atlas","attribution","brand",
  "content","control-plane","conversion","countries","dashboard","dispatch","execution-qa",
  "founder","global-intelligence","globe","high-value-assets","home","i18n","intake",
  "integrations","intelligence","jurisdictions","landing","layout","loading","map",
  "milano-seal","mobile-field","module2","motion","notary","operator-spine","operators",
  "orb","orbit","os","packaging-delivery","payment","payments","portal","portal2","process",
  "professional-network","professional","progressive-certainty","releases","reviews","ritual",
  "rituals","ron","scheduling","seo","services","shared","shipping","system",
  "trust-alliance-platform","trust","ui","va","workbook"
];

if (first.startsWith("components/")) {
  const match = first.match(/^components\/([^/]+)\//);
  if (match) {
    const index = componentDirs.indexOf(match[1]);
    if (index >= 0) process.exit(50 + index);
  }
  process.exit(120);
}
if (first.startsWith("app/")) process.exit(21);
if (first.startsWith("lib/")) process.exit(23);
if (first.startsWith("tests/")) process.exit(24);
if (first.startsWith("scripts/")) process.exit(25);
if (first.startsWith("types/")) process.exit(26);
process.exit(27);
