import type { Metadata } from "next";
import { SEO_PHASE_1_ROUTES, SEO_PHASE_2_TARGET, SEO_PHASE_3_STATUS, SEO_PHASE_3_TARGET } from "@/lib/seo/phaseAuthority";

export const metadata: Metadata = { title: "SEO Authority Engine — The Milano Seal™", robots: { index: false, follow: false } };

export default function SeoAuthorityPage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-gold/25 bg-card p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Growth</p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">SEO Authority Engine</h1>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">Programmatic Engine — Staged Only. Programmatic authority generation remains staged until verified content, canonical URLs, duplicate-content guards, and operator approval are complete.</p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-serif text-xl">Phase 1</h2><p className="mt-2 text-sm text-muted-foreground">{SEO_PHASE_1_ROUTES.join(" · ")}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-serif text-xl">Phase 2</h2><p className="mt-2 text-sm text-muted-foreground">Target: {SEO_PHASE_2_TARGET}</p></div>
        <div className="rounded-2xl border border-border bg-card p-5"><h2 className="font-serif text-xl">Phase 3</h2><p className="mt-2 text-sm text-muted-foreground">Target: {SEO_PHASE_3_TARGET} · {SEO_PHASE_3_STATUS}</p></div>
      </section>
    </main>
  );
}
