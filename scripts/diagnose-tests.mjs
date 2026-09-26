import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else if (entry.isFile() && entry.name.endsWith(".test.ts")) out.push(p);
  }
  return out.sort();
}

for (const [root, code] of [["tests",31],["lib",32],["components",33]]) {
  const targets = walk(root);
  if (!targets.length) continue;
  const r = spawnSync(process.execPath, ["--import","tsx","--test",...targets], {
    stdio: "ignore",
    env: { ...process.env, CI: "1" },
  });
  if ((r.status ?? 1) !== 0) process.exit(code);
}
process.exit(0);
