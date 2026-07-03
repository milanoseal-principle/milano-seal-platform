import fs from 'fs';
import path from 'path';
const listPath = '/tmp/useState-files.txt';
if (!fs.existsSync(listPath)) { console.error('List not found'); process.exit(1); }
const files = fs.readFileSync(listPath,'utf8').split('\n').filter(Boolean);
let changedCount = 0;
for (const rel of files) {
  const p = path.resolve(rel);
  if (!fs.existsSync(p)) continue;
  let src = fs.readFileSync(p,'utf8');
  let lines = src.split(/\r?\n/);
  // remove any use client occurrences
  lines = lines.filter((ln, idx) => {
    const t = ln.trim();
    if (t === '"use client";' || t === "'use client';") {
      return idx === 0; // keep only if it's the very first line
    }
    return true;
  });
  // ensure first non-empty line is "use client";
  let firstIdx = 0;
  while (firstIdx < lines.length && lines[firstIdx].trim() === '') firstIdx++;
  if (!(lines[firstIdx] && (lines[firstIdx].trim() === '"use client";' || lines[firstIdx].trim() === "'use client';"))) {
    lines.splice(firstIdx, 0, '"use client";');
  }
  // Remove standalone import { useState } from 'react'; if another import contains useState
  const hasReactNamedImportWithUseState = lines.some(ln => /from\s+['"]react['"]/i.test(ln) && /\{[^}]*useState[^}]*\}/.test(ln));
  if (hasReactNamedImportWithUseState) {
    lines = lines.filter(ln => !/^import\s*\{\s*useState\s*\}\s*from\s*['"]react['"]\s*;?\s*$/.test(ln));
  }
  const newSrc = lines.join('\n');
  if (newSrc !== src) {
    fs.writeFileSync(p, newSrc, 'utf8');
    changedCount++;
  }
}
console.log('Cleaned files:', changedCount);
process.exit(0);
