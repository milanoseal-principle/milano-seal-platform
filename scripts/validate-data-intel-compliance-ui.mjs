import fs from "node:fs";
const failures=[];
for(const f of ["components/dashboard/DataSourceStatusCard.tsx","components/dashboard/OperatorNextAction.tsx","app/dashboard/compliance-atlas/page.tsx","app/dashboard/operator-terminal/page.tsx","app/dashboard/seo-authority/page.tsx","app/dashboard/referrals/page.tsx","app/dashboard/invoices/page.tsx","app/dashboard/discounts/page.tsx","app/dashboard/command-center/page.tsx"]){if(!fs.existsSync(f)) failures.push(`missing ${f}`)}
const atlas=fs.readFileSync("app/dashboard/compliance-atlas/page.tsx","utf8");
for(const text of ["Internal routing intelligence only","not a public legal conclusion","Mexico: Manual Review Required","UAE: Manual Review Required"]){if(!atlas.includes(text)) failures.push(`atlas missing ${text}`)}
const terminal=fs.readFileSync("app/dashboard/operator-terminal/page.tsx","utf8");
for(const text of ["Internal only","Operator review required","No client-side AI keys","JSON output expected"]){if(!terminal.includes(text)) failures.push(`terminal missing ${text}`)}
const seo=fs.readFileSync("app/dashboard/seo-authority/page.tsx","utf8");
if(!seo.includes("Programmatic Engine — Staged Only")) failures.push("seo missing staged copy");
const refs=fs.readFileSync("app/dashboard/referrals/page.tsx","utf8");
if(!refs.includes("No referral records connected yet.")||!refs.includes("Deals remain the source of truth")) failures.push("referrals missing empty/source copy");
const cmd=fs.readFileSync("app/dashboard/command-center/page.tsx","utf8");
if(!cmd.includes("No live data connected yet")) failures.push("command center missing no live data copy");
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Data intelligence compliance UI validation passed.");
