import { spawnSync } from "node:child_process";
const required = ["GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON", "GOOGLE_SEARCH_CONSOLE_SITE_URL", "NEXT_PUBLIC_SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"];
if (required.some((name) => !process.env[name]?.trim())) { console.error("SEARCH CONSOLE PRODUCTION\nCONFIGURED: NO"); process.exit(1); }
const result = spawnSync(process.execPath, ["--import", "tsx", "-e", 'import {getSearchConsoleHealth} from "./lib/seo/search-console/health.ts"; const h=await getSearchConsoleHealth(); console.log(JSON.stringify({configured:h.configured,site:h.siteUrl,lastSync:h.lastSuccessfulSyncAt,latestData:h.latestObservationDate}))'], { encoding: "utf8", env: process.env });
if (result.status !== 0) { console.error("SEARCH CONSOLE PRODUCTION\nCONFIGURED: NO"); process.exit(1); }
const health = JSON.parse(result.stdout.trim()); if (!health.configured) process.exit(1);
console.log(`SEARCH CONSOLE PRODUCTION\nCONFIGURED: YES\nSITE: ${health.site}\nLAST SYNC: ${health.lastSync ?? "NONE"}\nLATEST DATA: ${health.latestData ?? "NONE"}`);
