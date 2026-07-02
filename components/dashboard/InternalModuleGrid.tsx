import Link from "next/link";
import { getInternalModules, getModuleRiskLabel, getModuleStatusLabel } from "@/lib/internal/moduleHealth";
import type { InternalModule, InternalModuleRiskLevel, InternalModuleStatus } from "@/lib/internal/moduleRegistry";

const sectionOrder: InternalModule["section"][] = ["Operations", "Revenue", "Growth", "Execution", "Intelligence", "Documents", "System", "Staged"];

const statusClass: Record<InternalModuleStatus, string> = {
  live: "border-emerald-400/40 bg-emerald-400/10 text-emerald-100",
  staged: "border-amber-300/40 bg-amber-300/10 text-amber-100",
  planned: "border-blue-300/35 bg-blue-300/10 text-blue-100",
  blocked: "border-red-300/35 bg-red-300/10 text-red-100",
  staged_only: "border-stone-300/25 bg-stone-300/10 text-stone-100",
};

const riskClass: Record<InternalModuleRiskLevel, string> = {
  low: "border-emerald-300/25 text-emerald-100",
  medium: "border-amber-300/25 text-amber-100",
  high: "border-red-300/30 text-red-100",
  payment_sensitive: "border-fuchsia-300/30 text-fuchsia-100",
};

export function InternalModuleGrid() {
  const modules = getInternalModules();
  const sections = sectionOrder.filter((section) => modules.some((module) => module.section === section));

  return (
    <section className="space-y-6" aria-labelledby="internal-modules-heading">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium">Internal Route Control</p>
          <h2 id="internal-modules-heading" className="font-serif text-3xl text-foreground">Internal Modules</h2>
        </div>
        <p className="max-w-xl text-sm text-muted-foreground">Single internal registry for operator-only modules. Cards show status and risk only; no fake metrics, no public exposure.</p>
      </div>

      <div className="space-y-7">
        {sections.map((section) => {
          const sectionModules = modules.filter((module) => module.section === section);
          return (
            <div key={section} className="space-y-3">
              <h3 className="text-xs uppercase tracking-[0.22em] text-muted-foreground">{section}</h3>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {sectionModules.map((module) => (
                  <article key={module.id} className="rounded-2xl border border-gold/25 bg-card p-5 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <h4 className="font-serif text-xl text-foreground">{module.label}</h4>
                      <div className="flex flex-wrap gap-2">
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${statusClass[module.status]}`}>{getModuleStatusLabel(module.status)}</span>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.16em] ${riskClass[module.riskLevel]}`}>{getModuleRiskLabel(module.riskLevel)}</span>
                      </div>
                    </div>
                    <p className="mt-3 min-h-16 text-sm leading-6 text-muted-foreground">{module.description}</p>
                    <div className="mt-5 flex items-center justify-between gap-3">
                      <span className="truncate text-xs text-muted-foreground">{module.href}</span>
                      <Link href={module.href} className="shrink-0 rounded-full border border-gold/35 px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-gold hover:bg-gold/10">
                        Open Module
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
