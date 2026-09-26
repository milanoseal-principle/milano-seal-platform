import { spawnSync } from "node:child_process";

const result = spawnSync("npm", ["run", "typecheck", "--", "--pretty", "false"], {
  encoding: "utf8",
  env: { ...process.env, CI: "1" },
  shell: process.platform === "win32",
});
const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
if ((result.status ?? 1) === 0) process.exit(0);
const first = output.split(/\r?\n/).find((line) => /\.(?:ts|tsx)\(\d+,\d+\): error TS\d+/.test(line)) ?? "";
const m = first.match(/^lib\/international-execution\/operationalGovernance\.ts\((\d+),(\d+)\): error TS(\d+)/);
if (!m) process.exit(220);
const line = Number(m[1]);
if (line <= 100) process.exit(211);
if (line <= 200) process.exit(212);
if (line <= 300) process.exit(213);
process.exit(214);
