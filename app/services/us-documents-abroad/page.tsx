import Link from "next/link";

const details = {
  title: "U.S. Documents Abroad",
  audience: "U.S. citizens abroad, foreign nationals, executives, students, and professional coordinators",
  coordinates: "coordinates execution pathway review, document routing, Secure Records Intake, authentication planning, and courier release visibility",
  review: "Receiving authority, country use, language requirements, and execution method must be reviewed manually",
  cta: "Start International Review",
  source: "svc_us_documents_abroad",
};

export default function ServiceRevenuePage() {
  return (
    <main className="min-h-screen bg-[#050505] px-6 py-16 text-white">
      <section className="mx-auto max-w-5xl rounded-3xl border border-amber-400/25 bg-gradient-to-br from-zinc-950 via-black to-zinc-900 p-8">
        <p className="text-xs uppercase tracking-[0.32em] text-amber-300">Secure International Document Execution & Authentication Infrastructure</p>
        <h1 className="mt-4 text-4xl font-semibold">{details.title}</h1>
        <p className="mt-4 text-lg text-zinc-300">For {details.audience}.</p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="text-lg font-semibold text-amber-200">What Milano Seal coordinates</h2>
            <p className="mt-2 text-sm text-zinc-300">The Milano Seal {details.coordinates}.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="text-lg font-semibold text-amber-200">Manual review required</h2>
            <p className="mt-2 text-sm text-zinc-300">{details.review}.</p>
          </article>
          <article className="rounded-2xl border border-white/10 bg-black/40 p-5">
            <h2 className="text-lg font-semibold text-amber-200">Safe disclaimer</h2>
            <p className="mt-2 text-sm text-zinc-300">Receiving-authority acceptance, destination-country requirements, signer eligibility, and timing must be reviewed before execution. Milano Seal does not provide legal or immigration advice and does not claim government approval.</p>
          </article>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link href={`/intake?source=${details.source}`} className="rounded-full bg-amber-300 px-5 py-3 text-sm font-semibold text-black">{details.cta}</Link>
          <span className="text-xs uppercase tracking-[0.24em] text-zinc-500">Source tracking slug: {details.source}</span>
        </div>
      </section>
    </main>
  );
}
