import Link from "next/link";
import { MODULES } from "@/lib/workbook/moduleRegistry";

export const dynamic = "force-dynamic";

export default function WorkbookIndexPage() {
  const grouped = MODULES.reduce<Record<string, typeof MODULES>>((acc, mod) => {
    (acc[mod.domain] ||= []).push(mod);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-[#080808] text-[#f4efe5] px-4 py-8 md:px-8">
      <div className="mx-auto max-w-[1500px]">
        <div className="border-b border-[#c6a65b]/25 pb-8">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#c6a65b]">Milano Seal OS · Internal Source Layer</p>
          <h1 className="mt-3 font-serif text-4xl md:text-6xl">Legal Compliance Engine</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-[#aaa398]">Source-preserved workbook intelligence. Original values and formulas remain evidence-only; live operations continue through the canonical Milano Seal runtime, Matter schema, state machine, and Wise payment gate.</p>
        </div>
        <div className="mt-8 grid gap-8">
          {Object.entries(grouped).map(([domain, mods]) => (
            <section key={domain}>
              <h2 className="mb-3 text-xs uppercase tracking-[0.24em] text-[#c6a65b]">{domain}</h2>
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {mods.map((mod) => (
                  <Link key={mod.sheet} href={`/dashboard/workbook/${encodeURIComponent(mod.sheet)}`} className="border border-[#c6a65b]/15 bg-[#0e0e0d] p-5 transition hover:-translate-y-0.5 hover:border-[#c6a65b]/50">
                    <div className="text-[9px] uppercase tracking-[0.18em] text-[#8f887d]">{mod.sheet} · {mod.range}</div>
                    <div className="mt-2 font-serif text-xl">{mod.title}</div>
                    <p className="mt-2 text-xs leading-6 text-[#9e978b]">{mod.purpose}</p>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
