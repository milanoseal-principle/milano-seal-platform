import fs from "node:fs";
const files=["app/pricing/page.tsx","components/dashboard/InternalModuleGrid.tsx","components/dashboard/milano-shell.tsx"];
const failures=[];
for(const file of files){const c=fs.readFileSync(file,"utf8"); if(!/(min-w-0|break-words|min-h-11|grid gap|flex-col)/.test(c)) failures.push(`${file} missing mobile-safe utility evidence`)}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Final mobile cosmetic pass validation passed.");
