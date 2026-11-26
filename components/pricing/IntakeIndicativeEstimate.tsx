import type { IntakeIndicativeQuote } from "@/lib/pricing/intakeIndicativeQuote";

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function IntakeIndicativeEstimate({ quote }: { quote: IntakeIndicativeQuote }) {
  return (
    <section className="mt-5 border-t border-white/10 pt-4 text-sm text-white/70">
      <h2 className="font-semibold text-white">Indicative estimate</h2>
      <p className="mt-1">This estimate is for planning. No payment is due. The final amount depends on confirmed execution requirements.</p>
      <dl className="mt-4 space-y-2 tabular-nums">
        {quote.lineItems.map((item, index) => (
          <div key={`${item.key}-${index}`} className="flex justify-between gap-4">
            <dt>{item.label}</dt><dd>{usd.format(item.amount)}</dd>
          </div>
        ))}
        <div className="flex justify-between gap-4 border-t border-white/10 pt-2 font-semibold text-white">
          <dt>Estimated total</dt><dd>{usd.format(quote.total)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Estimated 50% engagement retainer</dt><dd>{usd.format(quote.retainer)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Estimated 50% final balance</dt><dd>{usd.format(quote.balance)}</dd>
        </div>
      </dl>
    </section>
  );
}
