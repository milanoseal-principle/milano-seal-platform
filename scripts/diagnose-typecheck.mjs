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
  ["components/dashboard/", 31],
  ["components/intake/", 32],
  ["components/portal/", 33],
  ["components/landing/", 34],
  ["components/assistant/", 35],
  ["components/control-plane/", 36],
  ["components/ron/", 37],
  ["components/ui/", 38],
  ["components/", 39],
];
for (const [prefix, code] of rules) {
  if (first.startsWith(prefix)) process.exit(code);
}
process.exit(40);
