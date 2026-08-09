'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MODULES } from '@/lib/workbook/moduleRegistry';
import { classifyWorkbookValue } from '@/lib/workbook/runtimePolicy';

type WorkbookSource = { range: string; rows: unknown[][]; formulas?: string[][] };

type Props = {
  moduleId: string;
  title: string;
  eyebrow: string;
  description: string;
  domain: string;
  view: string;
  sourceRange: string;
  source: WorkbookSource;
  route: string;
  access: readonly string[];
  capabilities?: string[];
  confidential?: boolean;
  redactSensitive?: boolean;
  canonicalMatterSchema?: boolean;
  enforcePaymentBeforeScheduling?: boolean;
};

function colName(index: number) {
  let n = index + 1;
  let out = '';
  while (n > 0) {
    const r = (n - 1) % 26;
    out = String.fromCharCode(65 + r) + out;
    n = Math.floor((n - 1) / 26);
  }
  return out;
}

function displayValue(value: unknown, redact: boolean) {
  const raw = value == null ? '' : String(value);
  if (!redact) return raw;
  if (/password|secret|token|private key|auth|2fa|credential/i.test(raw)) return '[REDACTED]';
  return raw;
}

export default function MilanoWorkbookModule(props: Props) {
  const [query, setQuery] = useState('');
  const [showFormulas, setShowFormulas] = useState(false);
  const rows = props.source?.rows || [];
  const formulas = props.source?.formulas || [];
  const width = rows.reduce((max, row) => Math.max(max, row.length), 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows.map((row, index) => ({ row, index }));
    return rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.some((value) => String(value ?? '').toLowerCase().includes(q)));
  }, [query, rows]);

  return (
    <main className="min-h-screen bg-[#080808] text-[#f4efe5] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1600px]">
        <div className="flex flex-col gap-5 border-b border-[#c6a65b]/25 pb-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-4xl">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#c6a65b]">{props.eyebrow}</p>
            <h1 className="mt-3 font-serif text-4xl md:text-6xl">{props.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa398]">{props.description}</p>
          </div>
          <div className="grid min-w-[280px] grid-cols-2 gap-2 text-[10px] uppercase tracking-[0.12em] text-[#9b9488]">
            <div className="border border-[#c6a65b]/15 p-3"><span className="block text-[#c6a65b]">Sheet</span>{props.moduleId}</div>
            <div className="border border-[#c6a65b]/15 p-3"><span className="block text-[#c6a65b]">Range</span>{props.sourceRange}</div>
            <div className="border border-[#c6a65b]/15 p-3"><span className="block text-[#c6a65b]">Rows</span>{rows.length}</div>
            <div className="border border-[#c6a65b]/15 p-3"><span className="block text-[#c6a65b]">Access</span>{props.access.join(' · ')}</div>
          </div>
        </div>

        <section className="my-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="border border-[#c6a65b]/15 bg-[#0e0e0d] p-4"><div className="text-[9px] uppercase tracking-[0.18em] text-[#c6a65b]">Runtime</div><strong className="mt-2 block font-serif text-lg">Wise only</strong><p className="mt-1 text-xs leading-5 text-[#999286]">Legacy payment references remain source evidence and cannot execute.</p></article>
          <article className="border border-[#c6a65b]/15 bg-[#0e0e0d] p-4"><div className="text-[9px] uppercase tracking-[0.18em] text-[#c6a65b]">Source Lock</div><strong className="mt-2 block font-serif text-lg">No deletion</strong><p className="mt-1 text-xs leading-5 text-[#999286]">Workbook values and formulas are preserved without replacing newer live modules.</p></article>
          <article className="border border-[#c6a65b]/15 bg-[#0e0e0d] p-4"><div className="text-[9px] uppercase tracking-[0.18em] text-[#c6a65b]">Matter Control</div><strong className="mt-2 block font-serif text-lg">{props.canonicalMatterSchema ? 'Canonical' : 'Reference'}</strong><p className="mt-1 text-xs leading-5 text-[#999286]">Live Matter schema and state machine remain authoritative.</p></article>
          <article className="border border-[#c6a65b]/15 bg-[#0e0e0d] p-4"><div className="text-[9px] uppercase tracking-[0.18em] text-[#c6a65b]">Payment Gate</div><strong className="mt-2 block font-serif text-lg">{props.enforcePaymentBeforeScheduling ? 'Enforced' : 'Inherited'}</strong><p className="mt-1 text-xs leading-5 text-[#999286]">Scheduling follows current production payment-gating policy.</p></article>
        </section>

        <div className="sticky top-0 z-10 mb-3 flex flex-wrap items-center gap-2 border border-[#c6a65b]/15 bg-[#0b0b0a]/95 p-3 backdrop-blur">
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search preserved source…" className="min-w-[220px] flex-1 border border-[#c6a65b]/20 bg-[#11110f] px-3 py-2 text-sm outline-none placeholder:text-[#70695f] focus:border-[#c6a65b]/55" />
          <button onClick={() => setShowFormulas((v) => !v)} className="border border-[#c6a65b]/25 px-3 py-2 text-[10px] uppercase tracking-[0.14em] text-[#c6a65b]">{showFormulas ? 'Hide formulas' : 'Show formulas'}</button>
          <span className="text-[10px] uppercase tracking-[0.12em] text-[#7f786e]">{filtered.length} / {rows.length} rows</span>
        </div>

        <div className="max-h-[68vh] overflow-auto border border-[#c6a65b]/15 bg-[#0d0d0c]">
          <table className="min-w-full border-separate border-spacing-0 text-left text-[11px] leading-5">
            <thead>
              <tr>
                <th className="sticky left-0 top-0 z-30 min-w-12 border-b border-r border-[#c6a65b]/15 bg-[#151412] p-2 text-[#c6a65b]">#</th>
                {Array.from({ length: width }, (_, i) => <th key={i} className="sticky top-0 z-20 min-w-[150px] border-b border-r border-[#c6a65b]/10 bg-[#151412] p-2 text-[#c6a65b]">{colName(i)}</th>)}
              </tr>
            </thead>
            <tbody>
              {filtered.map(({ row, index }) => (
                <tr key={index}>
                  <td className="sticky left-0 z-10 border-b border-r border-[#c6a65b]/10 bg-[#10100f] p-2 text-[#756f64]">{index + 1}</td>
                  {Array.from({ length: width }, (_, col) => {
                    const value = row[col];
                    const classified = classifyWorkbookValue(value);
                    const formula = formulas[index]?.[col];
                    const legacy = classified.classification === 'legacy_prohibited';
                    return <td key={col} className={`max-w-[360px] whitespace-pre-wrap break-words border-b border-r border-[#c6a65b]/[.06] p-2 align-top text-[#d9d2c5] ${legacy ? 'bg-red-950/20' : ''}`}>
                      {displayValue(value, Boolean(props.redactSensitive))}
                      {legacy && <small className="mt-1 block text-[8px] uppercase tracking-[0.1em] text-red-300">Legacy source evidence · prohibited at runtime</small>}
                      {showFormulas && formula && <code className="mt-1 block text-[9px] text-sky-300">{formula}</code>}
                    </td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <section className="py-10">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-serif text-2xl">Workbook Intelligence</h2><Link href="/dashboard/workbook" className="text-[10px] uppercase tracking-[0.16em] text-[#c6a65b]">All 38 modules</Link></div>
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {MODULES.slice(0, 12).map((mod) => <Link key={mod.sheet} href={`/dashboard/workbook/${encodeURIComponent(mod.sheet)}`} className={`border border-[#c6a65b]/15 bg-[#0e0e0d] p-4 hover:border-[#c6a65b]/50 ${mod.sheet === props.moduleId ? 'border-[#c6a65b]/60' : ''}`}><small className="text-[8px] uppercase tracking-[0.16em] text-[#c6a65b]">{mod.domain}</small><b className="mt-1 block font-serif">{mod.title}</b><span className="mt-1 block text-[9px] text-[#817a70]">{mod.sheet} · {mod.range}</span></Link>)}
          </div>
        </section>
      </div>
    </main>
  );
}
