"use client";

const TRUST_POINTS = [
  "Payment-gated scheduling",
  "Secure matter portal",
  "Chain-of-custody tracking",
  "Apostille and courier visibility",
  "Operator-reviewed execution path",
  "Document release controls",
];

export function TrustProof() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: "rgba(8,5,1,0.99)" }}
    >
      <div className="max-w-3xl mx-auto text-center">
        {/* Eyebrow */}
        <p
          className="text-xs tracking-[0.25em] mb-4"
          style={{ fontFamily: "monospace", color: "rgba(212,175,55,0.5)" }}
        >
          BUILT FOR TRUST
        </p>

        {/* Heading */}
        <h2
          className="text-3xl md:text-4xl font-medium text-white mb-12"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Built for high-trust international document execution
        </h2>

        {/* Bullet points */}
        <ul className="space-y-4 mb-12 text-left max-w-md mx-auto">
          {TRUST_POINTS.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm text-white/80">
              <span
                className="text-base flex-shrink-0 mt-0.5"
                style={{ color: "#C6A55A" }}
              >
                ✓
              </span>
              {point}
            </li>
          ))}
        </ul>

        {/* Disclaimer */}
        <p
          className="text-xs leading-relaxed max-w-xl mx-auto"
          style={{ color: "rgba(255,255,255,0.3)" }}
        >
          Document execution coordination only. The Milano Seal does not provide legal advice. Final acceptance remains subject to the receiving authority.
        </p>
      </div>
    </section>
  );
}
