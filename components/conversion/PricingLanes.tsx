"use client";

import Link from "next/link";
import { CheckCircle2, XCircle, Info } from "lucide-react";
import { PRICING_LANES, PRICING_ADD_ONS, COURIER_STRUCTURE, PAYMENT_STRUCTURE, PRICING_DISCLAIMER } from "@/lib/config/pricing";

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.45)";
const BORDER = "rgba(212,175,55,0.14)";
const SURFACE = "rgba(255,255,255,0.025)";

export function PricingLanes() {
  return (
    <section
      id="pricing"
      style={{ background: "rgba(8,5,1,0.99)", padding: "64px 0", fontFamily: "monospace" }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{ fontSize: 9, letterSpacing: "0.28em", color: GOLD_DIM, marginBottom: 8 }}>
            EXECUTION LANES
          </p>
          <h2 style={{
            fontFamily: "var(--font-playfair, Georgia, serif)",
            fontWeight: "normal",
            fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
            color: "#f4e5b8",
            marginBottom: 12,
          }}>
            Service Architecture
          </h2>
          <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", maxWidth: 560, margin: "0 auto" }}>
            Each lane includes a defined scope. Courier costs are billed separately at carrier cost — never bundled.
          </p>
        </div>

        {/* Lane cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {PRICING_LANES.map((lane) => {
            const isPriority = lane.id === "priority";
            return (
              <div
                key={lane.id}
                className="rounded-sm flex flex-col"
                style={{
                  border: `1px solid ${isPriority ? "rgba(212,175,55,0.35)" : BORDER}`,
                  background: isPriority ? "rgba(212,175,55,0.04)" : SURFACE,
                  padding: 24,
                }}
              >
                {isPriority && (
                  <div style={{ fontSize: 8, color: GOLD, letterSpacing: "0.25em", marginBottom: 10 }}>
                    ◆ MOST SELECTED
                  </div>
                )}

                {/* Lane name + price */}
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 10, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 4 }}>
                    {lane.name.toUpperCase()}
                  </div>
                  <div style={{
                    fontFamily: "var(--font-playfair, Georgia, serif)",
                    fontSize: "2rem",
                    color: "#f4e5b8",
                    lineHeight: 1,
                    marginBottom: 8,
                  }}>
                    {lane.priceLabel}
                  </div>
                  <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                    {lane.description}
                  </p>
                </div>

                <div style={{ height: 1, background: BORDER, marginBottom: 16 }} />

                {/* Inclusions */}
                <div style={{ marginBottom: 16, flex: 1 }}>
                  <div style={{ fontSize: 8, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 10 }}>
                    INCLUDED
                  </div>
                  <div className="space-y-2">
                    {lane.inclusions.map((item) => (
                      <div key={item} className="flex gap-2">
                        <CheckCircle2 size={11} style={{ color: "rgba(34,197,94,0.65)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Not included */}
                <div style={{ marginBottom: 20 }}>
                  <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.2em", marginBottom: 10 }}>
                    NOT INCLUDED
                  </div>
                  <div className="space-y-1.5">
                    {lane.notIncluded.map((item) => (
                      <div key={item} className="flex gap-2">
                        <XCircle size={10} style={{ color: "rgba(255,255,255,0.2)", flexShrink: 0, marginTop: 2 }} />
                        <span style={{ fontSize: 9, color: "rgba(255,255,255,0.28)", lineHeight: 1.5 }}>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <Link
                  href={`/intake?lane=${lane.id}`}
                  className="block text-center rounded-sm py-2.5 text-[10px] tracking-widest transition-colors hover:opacity-90"
                  style={{
                    background: isPriority ? "rgba(212,175,55,0.15)" : "transparent",
                    border: `1px solid ${isPriority ? "rgba(212,175,55,0.5)" : BORDER}`,
                    color: isPriority ? GOLD : GOLD_DIM,
                  }}
                >
                  {lane.cta.toUpperCase()}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Courier structure */}
        <div className="rounded-sm p-5 mb-6" style={{ border: "1px solid rgba(59,130,246,0.15)", background: "rgba(59,130,246,0.03)" }}>
          <div className="flex items-start gap-3">
            <Info size={13} style={{ color: "rgba(59,130,246,0.6)", flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 9, color: "rgba(59,130,246,0.6)", letterSpacing: "0.2em", marginBottom: 6 }}>
                INTERNATIONAL COURIER & DISPATCH — BILLED SEPARATELY
              </div>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", lineHeight: 1.6, marginBottom: 8 }}>
                {COURIER_STRUCTURE.note}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Carriers: {COURIER_STRUCTURE.carriers.join(" · ")}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Estimate: {COURIER_STRUCTURE.estimate}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Customs: {COURIER_STRUCTURE.customsClassification.type} — HS {COURIER_STRUCTURE.customsClassification.hsCode}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>
                  Duties & taxes: {COURIER_STRUCTURE.customsClassification.dutiesAndTaxes}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Payment structure */}
        <div className="rounded-sm p-5 mb-6" style={{ border: BORDER, background: SURFACE }}>
          <div style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 10 }}>
            PAYMENT STRUCTURE
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 3 }}>RETAINER</div>
              <div style={{ fontSize: 11, color: "#e8e4dc" }}>{PAYMENT_STRUCTURE.retainer}</div>
            </div>
            <div>
              <div style={{ fontSize: 8, color: "rgba(255,255,255,0.2)", letterSpacing: "0.15em", marginBottom: 3 }}>BALANCE</div>
              <div style={{ fontSize: 11, color: "#e8e4dc" }}>{PAYMENT_STRUCTURE.balance}</div>
            </div>
          </div>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", lineHeight: 1.6 }}>
            {PAYMENT_STRUCTURE.note}
          </p>
        </div>

        {/* Add-ons */}
        <div className="rounded-sm p-5 mb-8" style={{ border: BORDER, background: SURFACE }}>
          <div style={{ fontSize: 9, color: GOLD_DIM, letterSpacing: "0.2em", marginBottom: 12 }}>
            ADD-ON SERVICES
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {PRICING_ADD_ONS.map((addon) => (
              <div key={addon.name} className="flex items-baseline justify-between gap-4">
                <span style={{ fontSize: 10, color: "rgba(255,255,255,0.45)" }}>{addon.name}</span>
                <span style={{ fontSize: 10, color: GOLD_DIM, flexShrink: 0 }}>{addon.priceLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <p style={{ fontSize: 9, color: "rgba(255,255,255,0.2)", lineHeight: 1.7, textAlign: "center", maxWidth: 700, margin: "0 auto" }}>
          {PRICING_DISCLAIMER}
        </p>

      </div>
    </section>
  );
}
