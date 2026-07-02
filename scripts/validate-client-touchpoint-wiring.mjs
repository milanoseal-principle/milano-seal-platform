import fs from "node:fs";
const doc=fs.readFileSync("docs/audits/CLIENT_TOUCHPOINT_WIRING_AUDIT.md","utf8");
const failures=[];
for(const text of ["public entry","intake confirmation","authenticated portal","matter room","invoice/payment view","document vault","courier custody","notifications","PARTIAL"]){if(!doc.includes(text)) failures.push(`missing ${text}`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Client touchpoint wiring validation passed.");
