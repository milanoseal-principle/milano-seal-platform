"use client";

import { useMemo, useState } from "react";
import { Check, ChevronRight, Loader2, PackageCheck, RefreshCw, ShieldCheck, Sparkles } from "lucide-react";

type Rate = {
  rate_id: string;
  provider: string;
  servicelevel_name: string;
  servicelevel_token: string;
  estimated_days: number | null;
  duration_terms: string | null;
  arrives_by: string | null;
  rank: number;
  recommended: boolean;
  selection_policy: string;
  selection_reason: string;
  amount?: string;
  currency?: string;
};

type RateResponse = {
  success: boolean;
  matter_id: string;
  matter_reference: string;
  execution_lane: string;
  shipment_id: string;
  rates: Rate[];
  recommended_rate: Rate | null;
  auto_selection_available: boolean;
  package_template_used: string;
  customs_required: boolean;
  customs_advisory?: string | null;
  error?: string;
  message?: string;
};

type PurchaseResponse = {
  success?: boolean;
  error?: string;
  matter_reference?: string;
  execution_lane?: string;
  rate_selection?: string;
  selection_policy?: string | null;
  selected_servicelevel?: string;
  carrier?: string;
  tracking_number_display?: string;
  tracking_url?: string | null;
};

function money(amount?: string, currency?: string) {
  if (!amount) return "Rate available";
  const value = Number.parseFloat(amount);
  if (!Number.isFinite(value)) return `${amount} ${currency ?? ""}`.trim();
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
  }).format(value);
}

function laneLabel(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (character) => character.toUpperCase());
}

export function MatterRateOptimizer({ matterReference }: { matterReference: string }) {
  const [quote, setQuote] = useState<RateResponse | null>(null);
  const [selectedRateId, setSelectedRateId] = useState<string | null>(null);
  const [stage, setStage] = useState<"idle" | "loading" | "review" | "confirm" | "purchasing" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [purchase, setPurchase] = useState<PurchaseResponse | null>(null);

  const selected = useMemo(
    () => quote?.rates.find((rate) => rate.rate_id === selectedRateId) ?? quote?.recommended_rate ?? null,
    [quote, selectedRateId],
  );

  async function compareRates() {
    setError(null);
    setPurchase(null);
    setStage("loading");
    try {
      const response = await fetch("/api/dashboard/shippo/rates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matter_id: matterReference }),
      });
      const payload = (await response.json()) as RateResponse;
      if (!response.ok || !payload.success) throw new Error(payload.message || payload.error || "Unable to load Shippo rates");
      setQuote(payload);
      setSelectedRateId(payload.recommended_rate?.rate_id ?? null);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load Shippo rates");
      setStage("idle");
    }
  }

  async function purchaseSelected() {
    if (!quote || !selected) return;
    setError(null);
    setStage("purchasing");
    try {
      const isRecommended = selected.rate_id === quote.recommended_rate?.rate_id;
      const response = await fetch("/api/dashboard/shippo/labels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matter_id: quote.matter_id,
          shipment_id: quote.shipment_id,
          ...(isRecommended ? {} : { selected_rate_id: selected.rate_id }),
          package_template_id: quote.package_template_used,
        }),
      });
      const payload = (await response.json()) as PurchaseResponse;
      if (!response.ok || !payload.success) throw new Error(payload.error || "Label purchase failed");
      setPurchase(payload);
      setStage("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Label purchase failed");
      setStage("review");
    }
  }

  return (
    <section className="rounded-2xl border border-[rgba(198,166,91,0.16)] bg-[rgba(198,166,91,0.025)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 font-mono text-[8px] uppercase tracking-[0.18em] text-[var(--ms-gold)]/62">
            <Sparkles className="h-4 w-4" /> Live Matter Rate Intelligence
          </div>
          <h3 className="mt-2 font-serif text-xl text-white">Shippo Rate Optimizer</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/42">
            Pull approved-carrier rates for this Matter, apply its canonical execution lane, and preselect the governed recommendation. Nothing is purchased until you confirm.
          </p>
        </div>
        <button
          type="button"
          onClick={compareRates}
          disabled={stage === "loading" || stage === "purchasing"}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgba(198,166,91,0.25)] bg-[rgba(198,166,91,0.055)] px-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)] transition-colors hover:bg-[rgba(198,166,91,0.09)] disabled:opacity-40 motion-reduce:transition-none"
        >
          {stage === "loading" ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="h-4 w-4" />}
          {quote ? "Refresh live rates" : "Compare live rates"}
        </button>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-300/15 bg-red-300/[0.035] px-4 py-3 text-sm text-red-100/70" role="alert">
          {error}
        </div>
      ) : null}

      {quote && stage !== "done" ? (
        <div className="mt-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/[0.06] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] text-white/42">
              {quote.matter_reference}
            </span>
            <span className="rounded-full border border-[rgba(198,166,91,0.14)] px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] text-[var(--ms-gold)]/70">
              {laneLabel(quote.execution_lane)} lane
            </span>
            {quote.customs_required ? (
              <span className="rounded-full border border-amber-300/10 px-3 py-1.5 font-mono text-[8px] uppercase tracking-[0.13em] text-amber-200/60">Document customs review</span>
            ) : null}
          </div>

          <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
            {quote.rates.map((rate) => {
              const active = selected?.rate_id === rate.rate_id;
              return (
                <button
                  type="button"
                  key={rate.rate_id}
                  onClick={() => {
                    setSelectedRateId(rate.rate_id);
                    setStage("review");
                  }}
                  className={`min-h-[132px] rounded-xl border p-4 text-left transition-all motion-reduce:transition-none ${active ? "border-[rgba(198,166,91,0.4)] bg-[rgba(198,166,91,0.07)]" : "border-white/[0.055] bg-black/20 hover:border-white/10"}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-medium text-white/82">{rate.provider}</div>
                      <div className="mt-1 text-[11px] text-white/38">{rate.servicelevel_name}</div>
                    </div>
                    {rate.recommended ? (
                      <span className="rounded-full border border-emerald-300/15 bg-emerald-300/[0.04] px-2 py-1 font-mono text-[7px] uppercase tracking-[0.12em] text-emerald-200/70">Recommended</span>
                    ) : null}
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div className="font-serif text-xl text-[var(--ms-gold)]">{money(rate.amount, rate.currency)}</div>
                    <div className="text-right text-[10px] text-white/34">{rate.estimated_days ? `${rate.estimated_days} est. days` : "Carrier timing"}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {selected ? (
            <div className="rounded-xl border border-white/[0.06] bg-black/25 p-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-white/28">Selected for confirmation</p>
                  <p className="mt-2 text-sm font-medium text-white/76">{selected.provider} · {selected.servicelevel_name} · {money(selected.amount, selected.currency)}</p>
                  <p className="mt-1 max-w-3xl text-[11px] leading-5 text-white/34">{selected.selection_reason}</p>
                </div>
                {stage === "confirm" ? (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setStage("review")} className="min-h-11 rounded-lg border border-white/10 px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-white/48">Cancel</button>
                    <button type="button" onClick={purchaseSelected} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-emerald-300/20 bg-emerald-300/[0.055] px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-emerald-200/80">
                      <Check className="h-4 w-4" /> Confirm label purchase
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => setStage("confirm")} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-[rgba(198,166,91,0.24)] px-4 font-mono text-[9px] uppercase tracking-[0.13em] text-[var(--ms-gold)]">
                    Review purchase <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}

      {stage === "purchasing" ? (
        <div className="mt-5 flex min-h-24 items-center justify-center gap-3 rounded-xl border border-white/[0.06] bg-black/25 text-sm text-white/46" aria-live="polite">
          <Loader2 className="h-4 w-4 animate-spin text-[var(--ms-gold)] motion-reduce:animate-none" /> Purchasing selected Shippo label…
        </div>
      ) : null}

      {stage === "done" && purchase ? (
        <div className="mt-5 rounded-xl border border-emerald-300/15 bg-emerald-300/[0.035] p-4" aria-live="polite">
          <div className="flex items-center gap-2 text-emerald-200/80"><PackageCheck className="h-5 w-5" /><span className="font-serif text-lg">Label created and tracking registered</span></div>
          <div className="mt-3 grid gap-2 text-[11px] text-white/46 sm:grid-cols-2 lg:grid-cols-4">
            <div><span className="text-white/24">Carrier</span><div className="mt-1 text-white/68">{purchase.carrier ?? "—"}</div></div>
            <div><span className="text-white/24">Service</span><div className="mt-1 text-white/68">{purchase.selected_servicelevel ?? "—"}</div></div>
            <div><span className="text-white/24">Selection</span><div className="mt-1 text-white/68">{purchase.rate_selection ?? "—"}</div></div>
            <div><span className="text-white/24">Tracking</span><div className="mt-1 break-all font-mono text-white/68">{purchase.tracking_number_display ?? "Pending"}</div></div>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-white/30"><ShieldCheck className="h-3.5 w-3.5" /> Delivery evidence remains separate from final release authority.</div>
        </div>
      ) : null}
    </section>
  );
}
