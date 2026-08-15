import fs from "node:fs";
import { execFileSync } from "node:child_process";

const files=["app/pricing/page.tsx","components/dashboard/InternalModuleGrid.tsx","components/dashboard/milano-shell.tsx"];
const failures=[];

function readTracked(file){
  if(fs.existsSync(file)) return fs.readFileSync(file,"utf8");
  try { return execFileSync("git", ["show", `HEAD:${file}`], { encoding: "utf8" }); }
  catch { failures.push(`${file} unavailable from checkout and git HEAD`); return ""; }
}

for(const file of files){
  const c=readTracked(file);
  if(c && !/(min-w-0|break-words|min-h-11|grid gap|flex-col)/.test(c)) failures.push(`${file} missing mobile-safe utility evidence`);
}
if(failures.length){console.error(failures.join("\n"));process.exit(1)}
console.log("Final mobile cosmetic pass validation passed.");
