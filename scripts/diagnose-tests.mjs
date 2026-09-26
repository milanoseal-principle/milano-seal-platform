import { spawnSync } from "node:child_process";
import { existsSync, readdirSync } from "node:fs";
import path from "node:path";

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out=[];
  for (const e of readdirSync(dir,{withFileTypes:true})) {
    const p=path.join(dir,e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (e.isFile() && (e.name.endsWith(".test.ts") || e.name.endsWith(".test.mjs"))) out.push(p);
  }
  return out.sort();
}
const files=walk("tests");
const chunks=8;
for(let i=0;i<chunks;i++){
  const group=files.filter((_,idx)=>Math.floor(idx*chunks/files.length)===i);
  if(!group.length) continue;
  const r=spawnSync(process.execPath,["--import","tsx","--test",...group],{stdio:"ignore",env:{...process.env,CI:"1"}});
  if((r.status??1)!==0) process.exit(40+i);
}
process.exit(0);
