"use client";

const RAIL_A = [
  { label: "GLOBAL DOCUMENT INTELLIGENCE", tone: "gold" },
  { label: "HAGUE ROUTE REVIEW",            tone: "gold" },
  { label: "PAYMENT-GATED EXECUTION",       tone: "emerald" },
  { label: "CHAIN-OF-CUSTODY VISIBILITY",   tone: "emerald" },
  { label: "WISE PAYMENT REFERENCE",        tone: "gold" },
  { label: "COURIER RELEASE TRACKING",      tone: "gold" },
  { label: "PRE-FLIGHT REVIEW",             tone: "gold" },
  { label: "DOCUMENT VAULT",                tone: "emerald" },
  { label: "PAID & RELEASED",               tone: "emerald" },
  { label: "APOSTILLE COORDINATION",        tone: "gold" },
  { label: "INTERNATIONAL COORDINATION",    tone: "gold" },
  { label: "COORDINATOR VISIBILITY",        tone: "gold" },
];

const RAIL_B = [
  "FLORIDA -> ITALY",
  "FLORIDA -> SPAIN",
  "FLORIDA -> GREECE",
  "FLORIDA -> PORTUGAL",
  "FLORIDA -> BRAZIL",
  "FLORIDA -> UAE",
  "FLORIDA -> GERMANY",
  "FLORIDA -> FRANCE",
  "FLORIDA -> MEXICO",
  "FLORIDA -> UNITED KINGDOM",
  "FLORIDA -> ARGENTINA",
  "FLORIDA -> AUSTRALIA",
];

export function CredentialTicker() {
  return (
    <div
      className="border-b border-[#D4AF37]/10 bg-black/60 overflow-hidden relative"
      aria-hidden="true"
    >
      {/* Rail A — operational signals, scrolls left */}
      <div className="flex ticker-anim whitespace-nowrap py-1.5 relative">
        {[...RAIL_A, ...RAIL_A].map((item, i) => (
          <span
            key={`a-${i}`}
            className="text-[9px] font-mono tracking-[0.3em] mx-8 flex items-center gap-2.5"
            style={{ color: "rgba(220, 195, 120, 0.92)" }}
          >
            <span
              className="w-1 h-1 rounded-full flex-shrink-0"
              style={{
                background:
                  item.tone === "emerald"
                    ? "rgba(52,211,153,0.85)"
                    : "rgba(212,175,55,0.85)",
                boxShadow:
                  item.tone === "emerald"
                    ? "0 0 6px rgba(16,185,129,0.5)"
                    : "0 0 5px rgba(212,175,55,0.4)",
              }}
            />
            {item.label}
          </span>
        ))}
      </div>

      {/* Hairline separator with traveling gold sweep */}
      <div className="relative h-px bg-[#D4AF37]/10 overflow-hidden">
        <div className="absolute inset-y-0 w-[20%] bg-gradient-to-r from-transparent via-[#D4AF37]/60 to-transparent rail-sweep" />
      </div>

      {/* Rail B — corridor map, scrolls right */}
      <div className="flex ticker-anim-reverse whitespace-nowrap py-1.5 relative">
        {[...RAIL_B, ...RAIL_B].map((label, i) => (
          <span
            key={`b-${i}`}
            className="text-[8px] font-mono tracking-[0.35em] mx-8 flex items-center gap-2.5"
            style={{ color: "rgba(210, 185, 110, 0.75)" }}
          >
            <span
              className="w-2 h-px flex-shrink-0"
              style={{ background: "rgba(212,175,55,0.6)" }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
