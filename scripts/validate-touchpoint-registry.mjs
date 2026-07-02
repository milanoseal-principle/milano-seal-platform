import fs from "node:fs";
const failures=[];
for(const f of ["lib/access/touchpointRegistry.ts","docs/architecture/TOUCHPOINT_REGISTRY.md"]){if(!fs.existsSync(f)) failures.push(`missing ${f}`)}
const src=fs.readFileSync("lib/access/touchpointRegistry.ts","utf8");
for(const text of ["public_visitor","client","alliance_member","virtual_assistant","operator","founder_admin","staged_only","payment_sensitive","identity_sensitive","custody_sensitive","compliance_sensitive","/dashboard/command-center","/dashboard/shipping","PortalCourierCustody"]){if(!src.includes(text)) failures.push(`missing ${text}`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Touchpoint registry validation passed.");
