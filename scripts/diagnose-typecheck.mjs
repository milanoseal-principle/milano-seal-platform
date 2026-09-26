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

if (first.startsWith("components/dashboard/operator-intake-form.tsx")) {
  const line = Number(first.match(/\.tsx\((\d+),/)?.[1] ?? 0);
  if (line <= 120) process.exit(41);
  if (line <= 220) process.exit(42);
  if (line <= 340) process.exit(43);
  if (line <= 460) process.exit(44);
  if (line <= 580) process.exit(45);
  process.exit(46);
}

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
