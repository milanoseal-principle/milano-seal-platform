import fs from "node:fs";
const failures=[];
for(const file of ["lib/referrals/types.ts","lib/referrals/relationshipIntelligence.ts","app/dashboard/referrals/page.tsx"]){if(!fs.existsSync(file)) failures.push(`missing ${file}`)}
const rel=fs.readFileSync("lib/referrals/relationshipIntelligence.ts","utf8");
const page=fs.readFileSync("app/dashboard/referrals/page.tsx","utf8");
const shell=fs.readFileSync("components/dashboard/milano-shell.tsx","utf8");
for(const text of ["deals","No referral records connected yet.","attachedToDeal: true"]){if(!rel.includes(text)&&!page.includes(text)) failures.push(`missing ${text}`)}
if(!shell.includes('/dashboard/referrals')) failures.push("dashboard nav missing /dashboard/referrals");
if(/fake revenue|fake referral counts/i.test(page) && !page.includes("does not create")) failures.push("fake count language unsafe");
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Referral intelligence validation passed.");
