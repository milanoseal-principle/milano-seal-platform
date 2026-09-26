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

if (first.startsWith("app/")) process.exit(21);
if (first.startsWith("components/")) process.exit(22);
if (first.startsWith("lib/")) process.exit(23);
if (first.startsWith("tests/")) process.exit(24);
if (first.startsWith("scripts/")) process.exit(25);
if (first.startsWith("types/")) process.exit(26);
process.exit(27);
