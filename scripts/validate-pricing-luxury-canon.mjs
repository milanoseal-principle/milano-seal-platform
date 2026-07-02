import fs from "node:fs";
const p=fs.readFileSync("app/pricing/page.tsx","utf8");
const failures=[];
for(const text of ["Execution Quote","U.S. Document Execution for International Use",'href="/intake"','href="/secure-portal"',"How Your Quote Is Built","Execution Paths","What May Be Included","Payment-Gated Execution","What Happens After Intake","Details Reviewed Before Quote","Final CTA","Execution is not scheduled until the quote is reviewed, accepted, and payment is confirmed. This protects document custody, operator time, and final packet release.","Final acceptance remains subject to the receiving authority."]) if(!p.includes(text)) failures.push(`missing ${text}`);
for(const bad of ["$750","$650","$975","$1,850","$1850","$25","$75","$275","$195","priceLabel"]){ if(p.includes(bad)) failures.push(`public price exposed ${bad}`); }
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Pricing luxury canon validation passed.");
