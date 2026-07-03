import fs from 'fs';
import path from 'path';
const listPath = '/tmp/useState-files.txt';
if (!fs.existsSync(listPath)) { console.error('List not found'); process.exit(1); }
const files = fs.readFileSync(listPath,'utf8').split('\n').filter(Boolean);
let modified = 0;
for (const rel of files) {
  const p = path.resolve(rel);
  if (!fs.existsSync(p)) continue;
  let src = fs.readFileSync(p,'utf8');
  if (!/\buseState\b/.test(src)) continue; // nothing to do
  if (/from\s+['"]react['"]/i.test(src) && /\buseState\b/.test(src)) continue; // already imported
  // if there's an import from react
  const reactImportRegex = /^import\s+([^;]+)\s+from\s+['"]react['"];?/m;
  const match = src.match(reactImportRegex);
  if (match) {
    const importClause = match[1];
    let newImport;
    if (/^\w+$/.test(importClause)) {
      // default import like React
      newImport = `import ${importClause}, { useState } from 'react';`;
    } else if (/^\{/.test(importClause)) {
      // named imports - just add useState if missing
      const names = importClause.replace(/[{}]/g, '').trim();
      const parts = names.split(',').map(s=>s.trim()).filter(Boolean);
      if (!parts.includes('useState')) parts.push('useState');
      newImport = `import { ${parts.join(', ')} } from 'react';`;
    } else if (/^\w+,\s*\{/.test(importClause)) {
      // default and named
      const parts = importClause.split(',').map(s=>s.trim());
      const def = parts[0];
      const named = parts.slice(1).join(',');
      const names = named.replace(/[{}]/g, '').split(',').map(s=>s.trim()).filter(Boolean);
      if (!names.includes('useState')) names.push('useState');
      newImport = `import ${def}, { ${names.join(', ')} } from 'react';`;
    } else {
      // fallback
      newImport = `import { useState } from 'react';\n` + match[0];
    }
    src = src.replace(reactImportRegex, newImport);
    fs.writeFileSync(p, src, 'utf8');
    modified++;
  } else {
    // no react import; insert after first non-empty line (likely "use client")
    const lines = src.split(/\r?\n/);
    let idx = 0; while (idx < lines.length && lines[idx].trim() === '') idx++;
    lines.splice(idx+1, 0, "import { useState } from 'react';");
    fs.writeFileSync(p, lines.join('\n'), 'utf8');
    modified++;
  }
}
console.log('Ensured useState imports for files:', modified);
process.exit(0);
