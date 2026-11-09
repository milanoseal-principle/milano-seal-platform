#!/usr/bin/env node
// RETIRED CONTRACT (2026-11-09). The former "submission authorizes scheduling"
// rule is superseded by the founder decision NO VERIFIED WISE SETTLEMENT -> NO
// SCHEDULING. This historical entry point is kept only so existing wiring keeps
// working; it delegates to the stricter canonical validator and never passes on
// its own.
import { spawnSync } from "node:child_process";
const result = spawnSync(process.execPath, ["scripts/validate-verified-settlement-before-scheduling.mjs"], { stdio: "inherit" });
process.exit(result.status ?? 1);
