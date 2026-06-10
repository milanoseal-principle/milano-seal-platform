"use client";

import Link from "next/link";
import { PRICING_LANES, PRICING_ADD_ONS, PRICING_DISCLAIMER } from "@/lib/config/pricing";

export function PricingLanes() {
  return (
    <section
      id="pricing"
      className="py-24 px-6"
      style={{ background: "#0A0A0A" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Eyebrow */}
        <p
          className="text-center text-xs tracking-[0.25em] mb-4"
          style={{ fontFamily: "monospace", color: "rgba(212,175,55,0.5)" }}
        >
          EXECUTION LANES
        </p>

        {/* Heading */}
        <h2
          className="text-center text-3xl md:text-4xl font-medium text-white mb-16"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Execution Lanes
        </h2>

        {/* Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {PRICING_LANES.map((lane) => {
            const isHighlighted = lane.id === "priority";
            return (
              <div
                key={lane.id}
                className="flex flex-col p-8 rounded-lg"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: isHighlighted
                    ? "1px solid rgba(212,175,55,0.5)"
                    : "1px solid rgba(212,175,55,0.15)",
                }}
              >
                {isHighlighted && (
                  <p
                    className="text-xs tracking-[0.2em] mb-4"
                    style={{ fontFamily: "monospace", color: "rgba(212,175,55,0.7)" }}
                  >
                    MOST REQUESTED
                  </p>
                )}

                <h3
                  className="text-xl font-medium text-white mb-2"
                  style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
                >
                  {lane.name}
                </h3>

                <p
                  className="text-2xl font-semibold mb-3"
                  style={{ color: "#C6A55A" }}
                >
                  {lane.priceLabel}
                </p>

                <p className="text-sm mb-6" style={{ color: "#8A8A8A" }}>
                  {lane.description}
                </p>

                <ul className="flex-1 space-y-3 mb-8">
                  {lane.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-white/80">
                      <span style={{ color: "#C6A55A", flexShrink: 0 }}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link
                  href={`/intake?lane=${lane.id}`}
                  className="block text-center text-sm font-medium py-3 px-6 rounded transition-colors"
                  style={{
                    background: isHighlighted ? "#C6A55A" : "transparent",
                    color: isHighlighted ? "#0A0A0A" : "#C6A55A",
                    border: isHighlighted ? "none" : "1px solid rgba(212,175,55,0.5)",
                  }}
                >
                  {lane.cta}
                </Link>
              </div>
            );
          })}
        </div>

        {/* Add-ons */}
        <div
          className="flex flex-wrap gap-4 justify-center mb-8 py-6 rounded-lg"
          style={{ border: "1px solid rgba(212,175,55,0.15)" }}
        >
          <p
            className="w-full text-center text-xs tracking-[0.2em] mb-2"
            style={{ fontFamily: "monospace", color: "rgba(212,175,55,0.5)" }}
          >
            ADD-ONS
          </p>
          {PRICING_ADD_ONS.map((addon) => (
            <div
              key={addon.name}
              className="flex items-center gap-2 text-sm"
            >
              <span style={{ color: "#8A8A8A" }}>{addon.name}</span>
              <span style={{ color: "#C6A55A" }}>{addon.priceLabel}</span>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.3)" }}>
          {PRICING_DISCLAIMER}
        </p>
      </div>
    </section>
  );
}
