export function ConversionSafetyPanel() {
  return (
    <section className="rounded-2xl border border-amber-400/20 bg-black/40 p-5 text-sm text-zinc-200 shadow-[0_0_30px_rgba(212,175,55,0.08)]">
      <p className="text-xs uppercase tracking-[0.28em] text-amber-300">Revenue Operations</p>
      <h3 className="mt-2 text-lg font-semibold text-white">Conversion Safety Panel</h3>
      <p className="mt-2 text-zinc-400">Internal sample queues show the next operator action without changing payment confirmation, Wise webhook, release, or custody logic.</p>
    </section>
  );
}
