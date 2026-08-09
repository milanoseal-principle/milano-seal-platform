import { notFound } from "next/navigation";
import MilanoWorkbookModule from "@/components/workbook/MilanoWorkbookModule";
import { WORKBOOK_SOURCE } from "@/lib/workbook/generatedWorkbookSource";
import { MODULES } from "@/lib/workbook/moduleRegistry";

export const dynamic = "force-dynamic";

export default async function WorkbookSheetPage({ params }: { params: Promise<{ sheet: string }> }) {
  const { sheet } = await params;
  const normalized = decodeURIComponent(sheet).toUpperCase();
  const module = MODULES.find((item) => item.sheet === normalized);
  const source = (WORKBOOK_SOURCE as Record<string, any>)[normalized];
  if (!module || !source) return notFound();

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
