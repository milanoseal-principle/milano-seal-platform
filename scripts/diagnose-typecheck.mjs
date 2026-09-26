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

const rules = [
  ["components/acquisition/", 41],
  ["components/alliance/", 42],
  ["components/animations/", 43],
  ["components/atlas/", 44],
  ["components/attribution/", 45],
  ["components/brand/", 46],
  ["components/content/", 47],
  ["components/conversion/", 48],
  ["components/countries/", 49],
  ["components/dispatch/", 50],
  ["components/execution-qa/", 51],
  ["components/founder/", 52],
  ["components/global-intelligence/", 53],
  ["components/globe/", 54],
  ["components/high-value-assets/", 55],
  ["components/home/", 56],
  ["components/i18n/", 57],
  ["components/process/", 58],
  ["components/professional-network/", 59],
  ["components/professional/", 60],
  ["components/progressive-certainty/", 61],
  ["components/releases/", 62],
  ["components/reviews/", 63],
  ["components/ritual/", 64],
  ["components/rituals/", 65],
  ["components/scheduling/", 66],
  ["components/seo/", 67],
  ["components/services/", 68],
  ["components/shared/", 69],
  ["components/shipping/", 70],
  ["components/system/", 71],
  ["components/trust-alliance-platform/", 72],
  ["components/trust/", 73],
  ["components/va/", 74],
  ["components/workbook/", 75],
  ["components/", 76],
];
for (const [prefix, code] of rules) {
  if (first.startsWith(prefix)) process.exit(code);
}
process.exit(77);
