import { ComplimentaryStatusBadge } from "./ComplimentaryStatusBadge";

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function ComplimentarySummary({ originalValue, authorized, reasonLabel, authorizedBy }: { originalValue: number; authorized: boolean; reasonLabel?: string; authorizedBy?: string }) {
  return (
    <div className="rounded-2xl border border-[#8d6a22]/30 bg-black/30 p-4 text-sm text-neutral-300">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] uppercase tracking-[0.18em] text-[#c99a3a]">Complimentary Authorization</p>
        <ComplimentaryStatusBadge authorized={authorized} />
      </div>
      <div className="grid gap-2">
        <Row label="Original Matter Value" value={money(originalValue)} />
        <Row label="Complimentary Adjustment" value={`-${money(originalValue)}`} tone="gold" />
        <Row label="Amount Due" value="$0.00" tone="emerald" />
        <Row label="Amount Paid" value="$0.00" />
        <Row label="Verified Revenue" value="$0.00" tone="emerald" />
        {authorizedBy ? <Row label="Authorization" value={authorizedBy} /> : null}
        {reasonLabel ? <Row label="Reason" value={reasonLabel} /> : null}
      </div>
    </div>
  );
}

function Row({ label, value, tone = "default" }: { label: string; value: string; tone?: "default" | "gold" | "emerald" }) {
  const toneClass = tone === "emerald" ? "text-emerald-300" : tone === "gold" ? "text-[#e3bd65]" : "text-[#f4e5b8]";
  return <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-2 last:border-0 last:pb-0"><span>{label}</span><strong className={toneClass}>{value}</strong></div>;
}
