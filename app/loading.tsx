export default function Loading() {
  return (
    <main className="min-h-[100dvh] bg-[#060608] px-5 py-12 text-[#F4F1EA] sm:px-6" role="status" aria-live="polite" aria-busy="true">
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center">
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#D8C188]/70">
          The Milano Seal™
        </div>
        <h1 className="mt-3 font-serif text-2xl font-normal sm:text-3xl">
          Preparing the next view
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-white/45">
          Preserving your current context.
        </p>
        <div className="mt-8 h-px w-full overflow-hidden bg-[#D8C188]/10" aria-hidden="true">
          <div className="h-full w-2/3 origin-left bg-gradient-to-r from-transparent via-[#D8C188]/80 to-transparent motion-safe:animate-pulse" />
        </div>
        <div className="mt-6 grid gap-3" aria-hidden="true">
          <div className="h-16 rounded-xl border border-[#D8C188]/10 bg-white/[0.02] motion-safe:animate-pulse" />
          <div className="h-28 rounded-xl border border-[#D8C188]/10 bg-white/[0.02] motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  );
}
