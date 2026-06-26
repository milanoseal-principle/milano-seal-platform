"use client";
import { DESTINATIONS } from "@/data/destinations";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ArrowRight } from "lucide-react";

export { DESTINATIONS };

export function GlobalIntel({
  highlightCountry,
}: {
  highlightCountry?: string;
}) {
  const router = useRouter();
  const sectionRef = useRef<HTMLElement>(null);
  const [sectionVisible, setSectionVisible] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSectionVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Show top 12 by demand for the homepage grid
  const gridDestinations = [...DESTINATIONS]
    .sort((a, b) => (b.demand || 0) - (a.demand || 0))
    .slice(0, 12);

  return (
    <section ref={sectionRef} className="py-20 px-6 border-t border-[#1A1A1A]">
      <div className="max-w-6xl mx-auto">
        {/* Header with route-shimmer effect */}
        <div className={`flex items-end justify-between mb-10 ms-reveal${sectionVisible ? " is-visible" : ""}`}>
          <div>
            <p className="text-[var(--ms-gold)] text-[9px] tracking-[0.3em] uppercase font-semibold mb-3">
              Global Document Intelligence™
            </p>
            <h2 className="font-serif text-3xl text-white font-normal">
              Global Document Intelligence™
            </h2>
            <p className="text-[#8A8A8A] text-sm mt-2 max-w-xl">
              Select your destination to view compliance requirements, execution
              path, and apostille status.
            </p>
          </div>
          <Link
            href="/map"
            className="text-[10px] tracking-[0.15em] uppercase text-[var(--ms-gold)] border border-[var(--ms-gold)]/30 px-4 py-2 hover:bg-[var(--ms-gold)]/10 transition-colors hidden md:block"
          >
            Explore Global Document Intelligence →
          </Link>
        </div>

        {/* Atmospheric route shimmer bar */}
        <div className={`ms-route-shimmer w-full h-px bg-gradient-to-r from-transparent via-[var(--ms-gold)]/20 to-transparent mb-8${sectionVisible ? " is-visible" : ""}`} />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {gridDestinations.map((d, i) => (
            <Link
              key={d.slug}
              href={`/apostille/${d.slug}`}
              className={`ms-reveal group bg-[#111111] border rounded-xl p-4 transition-all hover:border-[var(--ms-gold)]/30 hover:bg-[#151515]${sectionVisible ? " is-visible" : ""} ${
                highlightCountry === d.slug
                  ? "border-[var(--ms-gold)]/50 bg-[#141210]"
                  : "border-[#1E1E1E]"
              }`}
              style={{ animationDelay: sectionVisible ? `${80 + i * 50}ms` : undefined }}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl">{d.flag}</span>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                    d.hague
                      ? "bg-green-500/10 text-green-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {d.hague ? "Hague" : "Non-Hague"}
                </span>
              </div>
              <p className="text-white text-sm font-medium mb-1">{d.name}</p>
              <p className="text-[#8A8A8A] text-[10px] leading-relaxed">
                {d.note}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <div className="flex-1 bg-[#1A1A1A] rounded-full h-1">
                  <div
                    className="bg-[var(--ms-gold)] h-1 rounded-full"
                    style={{ width: `${d.demand || 20}%` }}
                  />
                </div>
                <span className="text-[9px] text-[var(--ms-gold)]">
                  {d.demand || 0}
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* CTA row */}
        <div className={`mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 ms-reveal${sectionVisible ? " is-visible ms-delay-400" : ""}`}>
          <Link
            href="/map"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--ms-gold)] text-[#0A0A0A] text-sm font-semibold rounded-lg hover:bg-[#D4B76A] transition-colors"
          >
            Explore Global Document Intelligence
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/intake"
            className="inline-flex items-center gap-2 px-6 py-3 border border-[var(--ms-gold)]/30 text-[var(--ms-gold)] text-sm font-medium rounded-lg hover:border-[var(--ms-gold)] hover:bg-[var(--ms-gold)]/5 transition-colors"
          >
            Begin Secure Intake
          </Link>
        </div>
      </div>
    </section>
  );
}
