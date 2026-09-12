import type { ReactNode } from "react";

const skeletonClass = "bg-white/[0.045] motion-safe:animate-pulse motion-reduce:animate-none";

export const milanoStateActionClass =
  "inline-flex min-h-11 items-center justify-center rounded-lg border px-5 py-2.5 text-sm font-medium transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B] focus-visible:ring-offset-2 focus-visible:ring-offset-[#060608] active:scale-[0.985] motion-reduce:transition-none motion-reduce:active:scale-100";

export function MilanoProductState({
  eyebrow,
  title,
  description,
  tone = "neutral",
  actions,
  children,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  tone?: "neutral" | "gold" | "danger";
  actions?: ReactNode;
  children?: ReactNode;
}>) {
  const toneClasses =
    tone === "danger"
      ? "border-red-400/18 bg-red-400/[0.025]"
      : tone === "gold"
        ? "border-[#C6A65B]/26 bg-[#C6A65B]/[0.035]"
        : "border-white/[0.07] bg-white/[0.018]";

  return (
    <section className="mx-auto flex min-h-[72dvh] w-full max-w-3xl items-center justify-center px-5 py-12 sm:px-6">
      <div
        className={`relative w-full overflow-hidden rounded-2xl border p-6 shadow-[0_32px_120px_rgba(0,0,0,0.42)] sm:p-9 ${toneClasses}`}
      >
        <div className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-[#C6A65B]/75 to-transparent" />
        <div className="font-mono text-[10px] uppercase tracking-[0.24em] text-[#D8C188]/72">{eyebrow}</div>
        <h1 className="mt-3 max-w-2xl font-serif text-3xl font-normal leading-tight text-[#F4F1EA] sm:text-4xl">{title}</h1>
        <p className="mt-4 max-w-xl text-[15px] leading-7 text-white/48">{description}</p>
        {children ? <div className="mt-6">{children}</div> : null}
        {actions ? <div className="mt-8 flex flex-wrap items-center gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}

export function MilanoRouteSkeleton() {
  return (
    <main
      className="min-h-[100dvh] bg-[#060608] px-5 py-12 text-[#F4F1EA] sm:px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#D8C188]/70">The Milano Seal™</div>
        <h1 className="mt-3 font-serif text-3xl font-normal sm:text-4xl">Preparing the next view</h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/42">
          Preserving your current context while the destination surface is prepared.
        </p>
        <div className="mt-8 h-px w-full overflow-hidden bg-[#D8C188]/10" aria-hidden="true">
          <div className="h-full w-2/3 origin-left bg-gradient-to-r from-transparent via-[#D8C188]/80 to-transparent motion-safe:animate-pulse motion-reduce:animate-none" />
        </div>
        <div className="mt-6 grid gap-3" aria-hidden="true">
          <div className={`${skeletonClass} h-16 rounded-xl border border-[#D8C188]/10`} />
          <div className={`${skeletonClass} h-28 rounded-xl border border-[#D8C188]/10`} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div className={`${skeletonClass} h-20 rounded-xl border border-white/[0.055]`} />
            <div className={`${skeletonClass} h-20 rounded-xl border border-white/[0.055]`} />
          </div>
        </div>
      </div>
    </main>
  );
}
