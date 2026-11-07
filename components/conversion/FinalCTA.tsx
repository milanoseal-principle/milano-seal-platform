"use client";

import Link from "next/link";
import { usePublicTranslations } from "@/components/i18n/PublicI18nProvider";

export function FinalCTA() {
  const { t } = usePublicTranslations();
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
          {t.finalCta.title}
        </h2>

        <p className="text-sm mb-10" style={{ color: "#8A8A8A" }}>
          {t.finalCta.body}
        </p>

        <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center">
          <Link
            href="/intake?source=homepage-final"
            className="inline-flex min-h-12 items-center justify-center text-sm font-medium py-3 px-8 rounded transition-colors"
            style={{
              background: "#C6A55A",
              color: "#0A0A0A",
            }}
          >
            Start Your Request
          </Link>
          <Link
            href="/pricing?source=homepage-final"
            className="inline-flex min-h-12 items-center justify-center text-sm font-medium py-3 px-8 rounded transition-colors"
            style={{
              background: "transparent",
              color: "#F4E7C3",
              border: "1px solid rgba(212,175,55,0.42)",
            }}
          >
            Get Pricing
          </Link>
          <a
            href="mailto:nicholas@themilanoseal.com?subject=Speak%20with%20Nicholas%20-%20The%20Milano%20Seal"
            className="inline-flex min-h-12 items-center justify-center px-6 text-sm font-medium text-white/65 underline decoration-[#C6A55A]/45 underline-offset-4 transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
          >
            Speak With Nicholas
          </a>
        </div>
        <Link
          href="/secure-portal"
          className="mt-6 inline-block min-h-11 px-4 py-3 text-xs text-white/45 underline underline-offset-4 transition-colors hover:text-white/75 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#C6A55A]"
        >
          {t.finalCta.portal}
        </Link>
      </div>
    </section>
  );
}
