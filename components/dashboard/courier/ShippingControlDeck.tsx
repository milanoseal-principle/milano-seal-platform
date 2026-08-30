import { ArrowRight, Box, CheckCircle2, Globe2, LockKeyhole, PackageCheck, Plane, ShieldCheck, Truck } from "lucide-react";
import Link from "next/link";

import { CARRIER_POLICY } from "@/lib/shippo/carrierPolicy";
import { TierRatePolicy } from "./TierRatePolicy";

const journey = [
  { label: "Release Review", detail: "Final payment, execution, apostille/authentication, custody and destination readiness remain authoritative.", icon: ShieldCheck },
  { label: "Rate Optimization", detail: "Shippo live rates are filtered to approved carriers and ranked by the Matter's canonical execution lane.", icon: Globe2 },
  { label: "Label Purchase", detail: "The recommended rate can be auto-selected or operator-confirmed. Purchase remains Matter-linked and server-controlled.", icon: Box },
  { label: "Custody Handoff", detail: "Tracking registration and custody evidence bind shipment movement to the same canonical Matter.", icon: PackageCheck },
  { label: "International Transit", detail: "Provider events update transit, exception, return and delivery visibility without inventing ETA or GPS truth.", icon: Plane },
  { label: "Delivery Review", detail: "Delivered is evidence of delivery. It never auto-releases or auto-completes the Matter.", icon: LockKeyhole },
] as const;

const approved = Object.values(CARRIER_POLICY).filter((carrier) => carrier.status === "APPROVED");
const conditional = Object.values(CARRIER_POLICY).filter((carrier) => carrier.status === "CONDITIONAL");

export function ShippingControlDeck() {
  return (
    <div className="mb-8 space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-[rgba(198,166,91,0.22)] bg-[linear-gradient(135deg,rgba(198,166,91,0.075),rgba(255,255,255,0.018)_42%,rgba(0,0,0,0.38))] p-5 sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border border-[rgba(198,166,91,0.12)]" />
        <div className="pointer-events-none absolute -right-5 -top-10 h-36 w-36 rounded-full border border-[rgba(198,166,91,0.08)]" />
        <div className="relative grid gap-5 lg:grid-cols-[1.2fr_.8fr] lg:items-end">
          <div>
            <div className="flex items-center gap-2 font-mono text-[9px] uppercase tracking-[0.22em] text-[var(--ms-gold)]/70">
              <Truck className="h-4 w-4" /> Milano International Release
            </div>
            <h2 className="mt-3 font-serif text-2xl text-white sm:text-3xl">Shipping Control Room</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/48">
              Matter-aware rate optimization, label execution, custody handoff, tracking evidence and release review for document packets — without creating a second shipping or release engine.
            </p>
          </div>
          <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/32">Canonical guardrail</p>
            <p className="mt-2 text-sm leading-6 text-white/58">Shipment movement may update custody evidence. Delivery never authors final release or Matter completion.</p>
          </div>
        </div>
      </section>

      <TierRatePolicy />

      <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {journey.map(({ label, detail, icon: Icon }, index) => (
          <div key={label} className="group rounded-xl border border-white/[0.055] bg-white/[0.018] p-4 transition-transform duration-200 motion-reduce:transition-none md:hover:-translate-y-0.5">
            <div className="flex items-center justify-between gap-2">
              <Icon className="h-4 w-4 text-[var(--ms-gold)]/72" />
              <span className="font-mono text-[8px] tracking-[0.15em] text-white/20">0{index + 1}</span>
            </div>
            <h3 className="mt-4 font-serif text-sm text-white/86">{label}</h3>
            <p className="mt-2 text-[11px] leading-5 text-white/34">{detail}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-[1.25fr_.75fr]">
        <div className="rounded-2xl border border-white/[0.06] bg-black/20 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/62">Carrier policy registry</p>
              <h3 className="mt-2 font-serif text-xl text-white">Approved operator stack</h3>
            </div>
            <CheckCircle2 className="h-5 w-5 text-emerald-400/70" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {approved.map((carrier) => (
              <div key={carrier.id} className="rounded-xl border border-white/[0.05] bg-white/[0.015] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium text-white/76">{carrier.name}</span>
                  <span className="font-mono text-[8px] uppercase tracking-[0.14em] text-emerald-300/65">Approved</span>
                </div>
                <p className="mt-1 text-[11px] leading-5 text-white/32">{carrier.use_case}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-amber-300/10 bg-amber-300/[0.025] p-5">
          <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-amber-200/60">Controlled override</p>
          <h3 className="mt-2 font-serif text-xl text-white">Exception lane</h3>
          <p className="mt-3 text-sm leading-6 text-white/42">Conditional or unapproved carriers require founder/admin authority and an auditable carrier-override event. Operators do not bypass the carrier registry.</p>
          {conditional.map((carrier) => (
            <div key={carrier.id} className="mt-4 rounded-xl border border-white/[0.05] px-4 py-3">
              <div className="font-medium text-white/70">{carrier.name}</div>
              <div className="mt-1 text-[11px] leading-5 text-white/30">{carrier.use_case}</div>
            </div>
          ))}
          <Link href="/dashboard/deals" className="mt-5 inline-flex min-h-11 items-center gap-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)]">
            Open Matter for release review <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
