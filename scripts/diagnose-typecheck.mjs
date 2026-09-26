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
if (line <= 20) process.exit(221);
if (line <= 40) process.exit(222);
if (line <= 60) process.exit(223);
if (line <= 80) process.exit(224);
process.exit(225);
