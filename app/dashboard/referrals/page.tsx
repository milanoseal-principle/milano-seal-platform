import type { Metadata } from "next";
import { EMPTY_REFERRAL_STATE, REFERRAL_SOURCE_OF_TRUTH } from "@/lib/referrals/relationshipIntelligence";

export const metadata: Metadata = {
  title: "Referral Intelligence — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function ReferralIntelligencePage() {
  return (
    <main className="space-y-6">
      <section className="rounded-2xl border border-gold/25 bg-card p-6">
        <p className="text-[11px] uppercase tracking-[0.24em] text-gold">Revenue Intelligence</p>
        <h1 className="mt-2 font-serif text-3xl text-foreground">Referral Intelligence</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
          Attorney and referral pipeline intelligence attaches to deals. Deals remain the source of truth. This page does not create a competing CRM or fake referral counts.
        </p>
      </section>
      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-serif text-xl text-foreground">Connected Records</h2>
        <p className="mt-3 text-sm text-muted-foreground">No referral records connected yet.</p>
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-gold/80">Source of truth: {REFERRAL_SOURCE_OF_TRUTH}</p>
      </section>
    </main>
  );
}
