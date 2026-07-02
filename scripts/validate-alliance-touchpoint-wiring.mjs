import fs from "node:fs";
const src=fs.readFileSync("lib/access/allianceAccessPolicy.ts","utf8");
const doc=fs.readFileSync("docs/audits/ALLIANCE_TOUCHPOINT_WIRING_AUDIT.md","utf8");
const failures=[];
for(const text of ["view_own_profile","view_training_materials","view_toolbelt_status","view_compliance_readiness","view_public_referral_guidelines","payment_release","wise_reconciliation","custody_release","client_cross_access","internal_margin","discount_override","comp_clear","final_release_override","staged_only_operator_approved"]){if(!src.includes(text)&&!doc.includes(text)) failures.push(`missing ${text}`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Alliance touchpoint wiring validation passed.");
