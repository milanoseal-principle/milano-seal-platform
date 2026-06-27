"use client";

import Link from "next/link";

export function FinalCTA() {
  return (
    <section
      className="py-24 px-6"
      style={{ background: "#0A0A0A", borderTop: "1px solid rgba(212,175,55,0.15)" }}
    >
      <div className="max-w-2xl mx-auto text-center">
        <h2
          className="text-3xl md:text-4xl font-medium text-white mb-4"
          style={{ fontFamily: "var(--font-playfair, Georgia, serif)" }}
        >
          Ready to prepare a document for use abroad?
        </h2>

        <p className="text-sm mb-10" style={{ color: "#8A8A8A" }}>
          Submit the request first. We will review the matter before scheduling or release.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/intake"
            className="inline-block text-sm font-medium py-3 px-8 rounded transition-colors"
            style={{
              background: "#C6A55A",
              color: "#0A0A0A",
            }}
          >
            Start Controlled Intake
          </Link>
          <Link
            href="/portal"
            className="inline-block text-sm font-medium py-3 px-8 rounded transition-colors"
            style={{
              background: "transparent",
              color: "#C6A55A",
              border: "1px solid rgba(212,175,55,0.5)",
            }}
          >
            Open Secure Matter Portal
          </Link>
        </div>
      </div>
    </section>
  );
}
