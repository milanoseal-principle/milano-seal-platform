import Link from "next/link";
import { SERVICE_ENTRIES, serviceIntakeHref } from "@/lib/intake/serviceIntent";
import { ArrowRight, FileSignature, FolderLock, Landmark } from "lucide-react";

// Public persona routing — every visitor gets an explicit door. Brand-aligned to
// the locked Milano Seal system (International Document Execution & Apostille
// Coordination); no legal-advice or guarantee language. Links only — no logic.
const PATHWAYS = [
  ...SERVICE_ENTRIES.map(entry => ({eyebrow:"Your request",icon:FileSignature,title:entry.label,desc:entry.description,cta:entry.cta,href:serviceIntakeHref(entry.intent),primary:true})),
  {
    eyebrow: "Existing Matter",
    icon: FolderLock,
    title: "Open Secure Matter Portal",
    desc: "For clients who already have a Milano Seal matter reference or portal access.",
    cta: "Open Secure Matter Portal",
    href: "/secure-portal",
    primary: true,
  },
  {
    eyebrow: "RON / Notary / Alliance",
    icon: Landmark,
    title: "The Milano Seal™ Alliance Network",
    desc: "For remote online notaries, mobile notaries, witness, courier, and apostille-support partners seeking review for the Milano Seal execution network.",
    cta: "Apply to Join the Alliance Network",
    href: "/alliance/apply",
    primary: false,
  },
] as const;

export function PersonaRouting() {
  return (
    <section className="relative w-full border-t border-[var(--ms-gold)]/12 bg-[#070708] py-16 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-3 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--ms-gold)]/65">
          Choose Your Pathway
        </div>
        <h2 className="text-center font-serif text-3xl text-white">
          What do you need help with?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm leading-relaxed text-white/55">
          From a straightforward online notarization to international document execution, start with what you need. We’ll confirm the appropriate path after review.
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PATHWAYS.map((p) => {
            const Icon = p.icon;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-label={p.cta}
                className={`group relative flex flex-col rounded-2xl border p-6 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/60 ${
                  p.primary
                    ? "border-[var(--ms-gold)]/35 hover:border-[var(--ms-gold)]/55"
                    : "border-[var(--ms-gold)]/16 hover:border-[var(--ms-gold)]/35"
                }`}
                style={{
                  background: p.primary
                    ? "linear-gradient(180deg, rgba(14,13,11,0.95), rgba(8,7,6,0.96))"
                    : "rgba(9,9,11,0.7)",
                  boxShadow: "0 16px 44px rgba(0,0,0,0.4)",
                }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--ms-gold)]/25 transition-all duration-300 group-hover:border-[var(--ms-gold)]/50 group-hover:shadow-[inset_0_0_14px_rgba(198,165,90,0.18)]">
                    <Icon className="h-4 w-4 text-[var(--ms-gold)]/80 transition-colors group-hover:text-[var(--ms-gold)]" />
                  </div>
                  <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/55">
                    {p.eyebrow}
                  </span>
                </div>
                <h3 className="font-serif text-[17px] leading-snug text-[#E8DCC0] transition-colors group-hover:text-[var(--ms-gold)]">
                  {p.title}
                </h3>
                <p className="mt-2 flex-1 text-[12.5px] leading-relaxed text-white/55">{p.desc}</p>
                <span className={`mt-4 inline-flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.14em] ${p.primary ? "text-[var(--ms-gold)]" : "text-[var(--ms-gold)]/70 group-hover:text-[var(--ms-gold)]"}`}>
                  {p.cta}
                  <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            );
          })}
        </div>

        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-white/35">
          The Milano Seal™ coordinates U.S. document execution, remote online notarization,
          apostille/authentication routing, and international release coordination. Availability and
          acceptance depend on document type, jurisdiction, destination country, and receiving-authority
          requirements. Clients should obtain guidance on legal rights and document content from qualified independent counsel.
        </p>
      </div>
    </section>
  );
}
