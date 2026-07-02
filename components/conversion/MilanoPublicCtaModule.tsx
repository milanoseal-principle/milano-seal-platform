import Link from "next/link";
import {
  MILANO_PUBLIC_PROMISE,
  MILANO_PAYMENT_SCHEDULING_LINE,
} from "@/data/milano-revenue-copy-system";

// Public-safe clarity + conversion module. No private workflow exposed.
export function MilanoPublicCtaModule({ className = "" }: { className?: string }) {
  const ctas = [
    { label: "Begin Secure Intake", href: "/intake", primary: true },
    { label: "Request Lawyer Access", href: "/lawyer-access" },
    { label: "Apply for Alliance Access", href: "/alliance/apply" },
    { label: "Request Private Client Review", href: "/access?interest=private-client" },
  ];

  return (
    <section className={`px-4 sm:px-6 ${className}`} data-critical-card="">
      <div className="mx-auto max-w-5xl rounded-2xl border border-[#C6A55A]/15 bg-[#0B0B0D] p-6 sm:p-8">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#C6A55A]/70 mb-3">
          Who Uses This
        </p>
        <h2 className="font-serif text-2xl text-white mb-3">What The Milano Seal Does</h2>
        <p className="text-[#B0B0B0] text-sm leading-relaxed mb-4 [overflow-wrap:anywhere]">
          {MILANO_PUBLIC_PROMISE}
        </p>
        <p className="text-[#8A8A8A] text-xs leading-relaxed mb-5 [overflow-wrap:anywhere]">
          {MILANO_PAYMENT_SCHEDULING_LINE}
        </p>
        <div className="flex flex-wrap gap-3">
          {ctas.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className={
                c.primary
                  ? "inline-flex items-center gap-2 rounded-lg bg-[#C6A55A] px-5 py-2.5 text-[#0A0A0A] font-semibold text-sm hover:bg-[#D4B76A] transition-colors"
                  : "inline-flex items-center gap-2 rounded-lg border border-[#C6A55A]/30 px-5 py-2.5 text-[#C6A55A] text-sm hover:border-[#C6A55A] transition-colors"
              }
            >
              {c.label}
            </Link>
          ))}
        </div>
        <p className="mt-5 font-mono text-[9px] uppercase tracking-[0.1em] text-[#5A5A5A] [overflow-wrap:anywhere]">
          The Milano Seal is not a law firm. Routing snapshots remain subject to receiving-authority review.
        </p>
      </div>
    </section>
  );
}
