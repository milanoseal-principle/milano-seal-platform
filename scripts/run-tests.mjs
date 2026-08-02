import { spawnSync } from "node:child_process";

const passthrough = process.argv.slice(2).filter((arg) => arg !== "--runInBand");
const result = spawnSync(process.execPath, ["--test", ...passthrough], { stdio: "inherit" });
process.exit(result.status ?? 1);
