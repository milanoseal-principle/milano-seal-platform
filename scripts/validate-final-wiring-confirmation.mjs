import fs from "node:fs";
const failures=[];
const doc=fs.readFileSync("docs/ops/ENVIRONMENT_WIRING_AUDIT.md","utf8");
for(const text of ["DEPLOYMENT_WIRING = INJECTED","COMPLIANCE_WIRING = PARTIAL","PAYMENT_WIRING = INJECTED","SCHEDULING_WIRING = PARTIAL","BLUENOTARY_WIRING = PARTIAL","main","Route registry exists","Wise-first payment flow exists","payment_confirmed","paid_comped","NEXT_PUBLIC_SUPABASE_URL","SUPABASE_SERVICE_ROLE_KEY"]){if(!doc.includes(text)) failures.push(`audit missing ${text}`)}
for(const file of ["package.json","lib/routes/routeRegistry.ts","lib/canonical/milanoLocks.ts","app/api/webhooks/bluenotary/route.ts"]){if(!fs.existsSync(file)) failures.push(`missing ${file}`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Final wiring confirmation validation passed.");
