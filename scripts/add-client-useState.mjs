import fs from 'fs';
import path from 'path';

const listPath = '/tmp/useState-files.txt';
if (!fs.existsSync(listPath)) {
  console.error('List file not found:', listPath);
  process.exit(1);
}

const files = fs.readFileSync(listPath, 'utf8').split('\n').filter(Boolean);
let modified = 0;
for (const rel of files) {
  const p = path.resolve(rel);
  if (!fs.existsSync(p)) continue;
  let src = fs.readFileSync(p, 'utf8');
  const lines = src.split(/\r?\n/);
  // find first non-empty non-comment line index
  let firstIdx = 0;
  while (firstIdx < lines.length && lines[firstIdx].trim() === '') firstIdx++;
  const firstLine = lines[firstIdx] || '';
  let changed = false;
  if (firstLine !== '"use client";' && firstLine !== "'use client';") {
    lines.splice(firstIdx, 0, '"use client";');
    changed = true;
  }
  src = lines.join('\n');
  // Check for import of useState
  const hasUseStateImport = /import\s+[^;]*\buseState\b/.test(src);
  if (!hasUseStateImport) {
    // insert import after the first line (which should be "use client");
    const parts = src.split(/\r?\n/);
    // find index of use client
    let ucIdx = 0;
    while (ucIdx < parts.length && parts[ucIdx].trim() === '') ucIdx++;
    if (parts[ucIdx].trim() === '"use client";' || parts[ucIdx].trim() === "'use client';") {
      parts.splice(ucIdx+1, 0, 'import { useState } from "react";');
      src = parts.join('\n');
      changed = true;
    } else {
      // fallback: prepend import at top
      src = 'import { useState } from "react";\n' + src;
      changed = true;
    }
  }
  if (changed) {
    fs.writeFileSync(p, src, 'utf8');
    modified++;
  }
}
console.log('Modified files:', modified);
process.exit(0);
