import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";
import {
  PRICING_LANES,
  RON_PRICING,
  MOBILE_NOTARY_PRICING,
  APOSTILLE_PRICING,
  COURIER_PRICING,
  PRICING_ADD_ONS,
  PAYMENT_STRUCTURE,
  PRICING_DISCLAIMER,
} from "@/lib/config/pricing";

export const metadata: Metadata = {
  title: "Pricing | The Milano Seal™ — Execution Lanes, RON, Mobile Notary & Apostille",
  description:
    "Transparent pricing for international document execution: Signature/Priority/Executive lanes, Remote Online Notarization, Florida mobile notary, apostille coordination, courier, and add-on fees. Final quote confirmed after review.",
  alternates: { canonical: "https://themilanoseal.com/pricing" },
};

type PriceItem = { id: string; name: string; priceLabel: string; note?: string };

function PriceList({ title, subtitle, items }: { title: string; subtitle?: string; items: readonly PriceItem[] }) {
  return (
    <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
      <h2 className="font-serif text-2xl text-white">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-[#8A8A8A]">{subtitle}</p>}
      <div className="mt-6 divide-y divide-[#1A1A1A] rounded-xl border border-[#1A1A1A] bg-[#0E0E0E]">
        {items.map((it) => (
          <div key={it.id} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-white">{it.name}</p>
              {it.note && <p className="mt-0.5 text-[12px] leading-relaxed text-[#8A8A8A]">{it.note}</p>}
            </div>
            <p className="shrink-0 font-mono text-sm text-[#C6A55A] sm:text-right">{it.priceLabel}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#0A0A0A] overflow-x-hidden">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 pt-32 pb-10">
          <p className="mb-4 font-mono text-[10px] uppercase tracking-[0.3em] text-[#C6A55A]/70">Pricing</p>
          <h1 className="font-serif text-3xl leading-tight text-white sm:text-5xl">
            Structured pricing for <span className="italic text-[#C6A55A]">international document execution</span>
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-[#8A8A8A]">
            Execution lanes for coordinated matters, plus standalone Remote Online Notarization, Florida mobile notary,
            apostille coordination, courier, and add-on services. Final quote is confirmed after document, signer,
            jurisdiction, apostille, and receiving-authority review.
          </p>
          <div className="mt-8">
            <Link
              href="/intake"
              className="inline-flex min-h-12 items-center justify-center rounded-lg px-6 py-3 font-mono text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a1206]"
              style={{ background: "linear-gradient(180deg,#ECD79A,#C6A55A)" }}
            >
              Begin Secure Intake
            </Link>
          </div>
        </section>

        {/* Execution Lanes */}
        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Execution Lanes</h2>
          <p className="mt-1.5 text-sm text-[#8A8A8A]">Bundled matters — single coordinated document execution.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {PRICING_LANES.map((lane) => (
              <div key={lane.id} className="rounded-2xl border border-[#C6A55A]/20 bg-[#0E0E0E] p-6">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h3 className="font-serif text-lg text-white">{lane.name}</h3>
                  <span className="font-mono text-xl text-[#C6A55A]">{lane.priceLabel}</span>
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[#8A8A8A]">{lane.description}</p>
                <ul className="mt-4 space-y-1.5">
                  {lane.inclusions.map((inc) => (
                    <li key={inc} className="flex items-start gap-2 text-[12px] text-white/70">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#C6A55A]/70" />
                      {inc}
                    </li>
                  ))}
                </ul>
                {lane.notIncluded?.length > 0 && (
                  <p className="mt-3 border-t border-[#1A1A1A] pt-3 text-[11px] leading-relaxed text-[#8A8A8A]">
                    Not included: {lane.notIncluded.join(" · ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        <PriceList title="Remote Online Notarization" subtitle="Standalone RON — no apostille required." items={RON_PRICING} />
        <PriceList title="Florida Mobile Notary" subtitle="In-person signing, mileage, statutory, and wait-time fees." items={MOBILE_NOTARY_PRICING} />
        <PriceList title="Apostille Coordination" subtitle="Florida Department of State submission and handling." items={APOSTILLE_PRICING} />
        <PriceList title="International Courier & Dispatch" items={COURIER_PRICING} />
        <PriceList title="Add-On Services & Fees" items={PRICING_ADD_ONS} />

        {/* Payment structure */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-10 border-t border-[#1A1A1A]">
          <h2 className="font-serif text-2xl text-white">Payment</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/75">
            <li>Retainer: {PAYMENT_STRUCTURE.retainer}</li>
            <li>Balance: {PAYMENT_STRUCTURE.balance}</li>
            <li>Method: {PAYMENT_STRUCTURE.method}</li>
          </ul>
          <p className="mt-3 text-[12.5px] leading-relaxed text-[#8A8A8A]">{PAYMENT_STRUCTURE.note}</p>
        </section>

        {/* Disclaimer */}
        <section className="mx-auto max-w-4xl px-4 sm:px-6 py-12 border-t border-[#1A1A1A]">
          <p className="text-[11px] leading-relaxed text-[#8A8A8A]/80">{PRICING_DISCLAIMER}</p>
          <p className="mt-3 text-[11px] leading-relaxed text-[#8A8A8A]/80">
            Final acceptance is determined by the receiving authority.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
