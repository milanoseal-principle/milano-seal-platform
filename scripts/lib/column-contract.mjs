// Extract the columns a source file reads or writes through supabase-js query chains:
// .from("table") followed by .select("a, b:c"), .insert/.update/.upsert({ top-level keys })
// and column filters (.eq/.in/.order/...). Used to hold code to the replayed schema.
function topLevelKeys(text, open) {
  let depth = 0, body = '';
  for (let i = open; i < text.length; i++) {
    const ch = text[i];
    if ('{[('.includes(ch)) { depth++; if (depth === 1) continue; }
    if ('}])'.includes(ch)) { depth--; if (depth === 0) break; }
    if (depth === 1) body += ch;
  }
  return body.split(',').map((part) => part.trim()).filter((part) => part && !part.startsWith('...'))
    .map((part) => part.match(/^["']?(\w+)["']?\s*(?::|$)/)?.[1]).filter(Boolean);
}

export function columnUsage(source) {
  const uses = [];
  const froms = [...source.matchAll(/\.from\(\s*["'`](\w+)["'`]\s*\)/g)];
  froms.forEach((match, index) => {
    const table = match[1];
    const end = Math.min(froms[index + 1]?.index ?? source.length, match.index + 1200);
    const chain = source.slice(match.index, end);
    const select = chain.match(/\.select\(\s*["'`]([^"'`]*)["'`]/);
    if (select && !/[(*]/.test(select[1])) {
      for (const column of select[1].split(',').map((c) => c.trim().split(':').pop().trim()).filter((c) => /^\w+$/.test(c))) uses.push({ table, column, kind: 'select' });
    }
    for (const op of ['insert', 'update', 'upsert']) {
      const at = chain.search(new RegExp(`\\.${op}\\(\\s*\\[?\\s*\\{`));
      if (at >= 0) for (const column of topLevelKeys(chain, chain.indexOf('{', at))) uses.push({ table, column, kind: op });
    }
    for (const filter of chain.matchAll(/\.(?:eq|neq|is|in|order|gte|lte|gt|lt|not|ilike|like|contains)\(\s*["'`](\w+)["'`]/g)) uses.push({ table, column: filter[1], kind: 'filter' });
  });
  return uses;
}
