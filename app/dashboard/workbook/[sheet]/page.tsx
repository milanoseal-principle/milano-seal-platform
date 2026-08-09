import { notFound } from "next/navigation";
import MilanoWorkbookModule from "@/components/workbook/MilanoWorkbookModule";
import { getWorkbookSource } from "@/lib/workbook/generatedWorkbookSource";
import { MODULES } from "@/lib/workbook/moduleRegistry";

export const dynamic = "force-dynamic";

export default async function WorkbookSheetPage({ params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  const normalized = decodeURIComponent(sheet).toUpperCase();
  const module = MODULES.find((item) => item.sheet === normalized);
  if (!module) return notFound();

  const source = getWorkbookSource(normalized);

  if (!source) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-16">
        <section className="rounded-2xl border border-amber-400/30 bg-black p-8 text-white shadow-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-amber-300">The Milano Seal™ · Protected Workbook OS</p>
          <h1 className="mt-4 text-3xl font-semibold">Workbook source temporarily unavailable</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/70">
            The protected workbook module registry is online, but this source shard could not be decoded safely. No workbook evidence was modified or discarded. Repair is required before this sheet can be rendered.
          </p>
          <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/70">
            Sheet: <span className="font-mono text-white">{module.sheet}</span>
          </div>
        </section>
      </main>
    );
  }

  return (
    <MilanoWorkbookModule
      moduleId={module.sheet}
      title={module.title}
      eyebrow={`${module.domain} · source-preserved workbook intelligence`}
      description={module.purpose}
      domain={module.domain}
      view={module.view}
      sourceRange={module.range}
      source={source}
      route={`/dashboard/workbook/${encodeURIComponent(module.sheet)}`}
      access={module.access}
      capabilities={["source-evidence","formula-traceability","operator-search","runtime-policy-separation","wise-only-payment-runtime"]}
      confidential
      redactSensitive={module.sheet === "CREDENTIALS_INDEX"}
      canonicalMatterSchema={module.sheet === "COMMAND_CENTER"}
      enforcePaymentBeforeScheduling={module.sheet === "COMMAND_CENTER"}
    />
  );
}
