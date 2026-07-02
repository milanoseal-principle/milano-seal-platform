// Launch Status — static internal readiness card. No metrics, no matter counts,
// no revenue. Each item reflects a shipped surface / preserved guarantee.

const LAUNCH_ITEMS = [
  "Pricing Page Live",
  "Secure Portal Live",
  "Intake Confirmation Live",
  "Discount Engine Live",
  "Sales Intelligence Lab Live",
  "Payment Gate Preserved",
  "Wise Webhook Preserved",
  "Release Gate Preserved",
] as const;

export function LaunchStatusCard() {
  return (
    <section className="mb-8 rounded border border-[#C6A55A]/15 bg-[#0D0B08] p-6">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-[0.28em] text-[#C6A55A]/60">
        Launch Status
      </p>
      <p className="mb-5 text-xs text-white/50">Ready for production launch.</p>
      <ul className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {LAUNCH_ITEMS.map((item) => (
          <li key={item} className="flex min-w-0 items-center gap-2.5 text-xs text-white/70">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-green-400/70" />
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
