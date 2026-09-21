"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, LockKeyhole, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type MatterBase =
  | "authentication"
  | "signature"
  | "priority"
  | "executive"
  | "international_passport_execution";

type ExecutionMethod = "none" | "ron" | "in_person";

type QuoteLine = {
  code: string;
  label: string;
  amount: number;
  category: string;
};

type QuotePreview = {
  matter_base: MatterBase | null;
  execution_method: ExecutionMethod;
  lane: string;
  base: number;
  subtotal?: number | null;
  total: number | null;
  deposit_amount: number | null;
  balance_due: number | null;
  eligible_subtotal: number | null;
  non_discountable_total: number | null;
  breakdown: QuoteLine[];
  review_required: boolean;
  review_reasons?: string[];
  rationale?: string;
};

type OperatorQuoteBuilderProps = {
  matterId: string;
  paymentStatus?: string | null;
  amountPaid?: number | null;
  initial?: {
    matterBase?: MatterBase | null;
    executionMethod?: ExecutionMethod | null;
    documentCount?: number | null;
    apostilleCount?: number | null;
    signerCount?: number | null;
    witnesses?: number | null;
    witnessType?: string | null;
    miles?: number | null;
    urgency?: string | null;
    translation?: boolean | null;
    multiCountry?: boolean | null;
    discountCode?: string | null;
  };
  onCommitted?: () => void;
};

type QuoteForm = {
  matter_base: MatterBase;
  execution_method: ExecutionMethod;
  document_count: number;
  apostille_count: number;
  signer_count: number;
  florida_notarial_act_count: number;
  remote_witness_count: number;
  in_person_witness_count: number;
  international_signer_count: number;
  jurisdiction_count: number;
  mobile_miles: number;
  urgency: "standard" | "expedited" | "rush" | "weekend" | "holiday";
  after_hours: boolean;
  translation_coordination: boolean;
  federal_apostille: boolean;
  executive_state_handling: boolean;
  consular_legalization: boolean;
  certified_translation: boolean;
  receiving_authority_uncertain: boolean;
  document_preparation: boolean;
  courier_cost: number;
  external_authority_fees: number;
  discount_code: string;
};

const money = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value ?? 0));

const n = (value: string) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};

export function OperatorQuoteBuilder({
  matterId,
  paymentStatus,
  amountPaid,
  initial,
  onCommitted,
}: OperatorQuoteBuilderProps) {
  const [form, setForm] = useState<QuoteForm>({
    matter_base: initial?.matterBase ?? "authentication",
    execution_method: initial?.executionMethod ?? "none",
    document_count: Math.max(1, Number(initial?.documentCount ?? 1)),
    apostille_count: Math.max(0, Number(initial?.apostilleCount ?? 0)),
    signer_count: Math.max(1, Number(initial?.signerCount ?? 1)),
    florida_notarial_act_count: 0,
    remote_witness_count:
      initial?.witnessType === "ron" || initial?.witnessType === "remote"
        ? Number(initial?.witnesses ?? 0)
        : 0,
    in_person_witness_count:
      initial?.witnessType === "in_person" || initial?.witnessType === "in-person"
        ? Number(initial?.witnesses ?? 0)
        : 0,
    international_signer_count: 0,
    jurisdiction_count: initial?.multiCountry ? 3 : 1,
    mobile_miles: Number(initial?.miles ?? 0),
    urgency:
      initial?.urgency === "urgent"
        ? "rush"
        : initial?.urgency === "expedited"
          ? "expedited"
          : "standard",
    after_hours: false,
    translation_coordination: Boolean(initial?.translation),
    federal_apostille: false,
    executive_state_handling: false,
    consular_legalization: false,
    certified_translation: false,
    receiving_authority_uncertain: false,
    document_preparation: false,
    courier_cost: 0,
    external_authority_fees: 0,
    discount_code: initial?.discountCode ?? "",
  });
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = useMemo(() => {
    const status = String(paymentStatus ?? "unpaid").toLowerCase();
    return Number(amountPaid ?? 0) > 0 ||
      ["pending", "observed_pending", "processing", "paid", "refunded"].includes(status);
  }, [paymentStatus, amountPaid]);

  function patch<K extends keyof QuoteForm>(key: K, value: QuoteForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function loadPreview(signal?: AbortSignal) {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/pricing/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        signal,
      });
      const body = (await response.json()) as QuotePreview & { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Quote preview failed.");
      setPreview(body);
    } catch (e) {
      if (e instanceof DOMException && e.name === "AbortError") return;
      setPreview(null);
      setError(e instanceof Error ? e.message : "Quote preview failed.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadPreview(controller.signal), 220);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [form]);

  async function commitQuote() {
    if (locked || committing) return;
    setCommitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${matterId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const body = (await response.json()) as {
        ok?: boolean;
        error?: string;
        code?: string;
        review_required?: boolean;
        review_reasons?: string[];
      };
      if (!response.ok) {
        if (body.review_required) {
          const reason = (body.review_reasons ?? []).join(", ") || "Manual review required.";
          toast.warning(`Quote held for review: ${reason}`);
        } else {
          toast.error(body.error ?? "Quote commit failed.");
        }
        setError(body.error ?? "Quote commit blocked.");
        return;
      }
      toast.success("Canonical Matter quote approved and payment gate updated.");
      onCommitted?.();
      await loadPreview();
    } catch (e) {
      const message = e instanceof Error ? e.message : "Quote commit failed.";
      setError(message);
      toast.error(message);
    } finally {
      setCommitting(false);
    }
  }

  const reviewReasons = preview?.review_reasons ?? [];

  return (
    <Card className="border-gold bg-card overflow-hidden">
      <CardHeader className="border-b border-border/60 bg-black/10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="font-serif text-xl">Internal Quote Builder</CardTitle>
            <CardDescription>
              Canonical private pricing composer. One Matter base, governed add-ons, exact 50/50 Wise split.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {locked ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[11px] font-medium text-amber-300">
                <LockKeyhole className="h-3.5 w-3.5" /> Pricing locked
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-medium text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" /> Editable
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,.8fr)]">
        <div className="space-y-5">
          <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            <Field label="Matter base">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.matter_base}
                disabled={locked}
                onChange={(e) => patch("matter_base", e.target.value as MatterBase)}
              >
                <option value="authentication">Authentication Matter</option>
                <option value="signature">Signature Matter</option>
                <option value="priority">Priority Matter</option>
                <option value="executive">Executive Matter</option>
                <option value="international_passport_execution">International Passport Execution</option>
              </select>
            </Field>

            <Field label="Execution method">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.execution_method}
                disabled={locked}
                onChange={(e) => patch("execution_method", e.target.value as ExecutionMethod)}
              >
                <option value="none">No new execution</option>
                <option value="ron">RON</option>
                <option value="in_person">In person</option>
              </select>
            </Field>

            <Field label="Urgency">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.urgency}
                disabled={locked}
                onChange={(e) => patch("urgency", e.target.value as QuoteForm["urgency"])}
              >
                <option value="standard">Standard</option>
                <option value="expedited">Expedited</option>
                <option value="rush">Rush / same day</option>
                <option value="weekend">Weekend</option>
                <option value="holiday">Holiday</option>
              </select>
            </Field>
          </section>

          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <NumberField label="Documents" value={form.document_count} min={1} disabled={locked} onChange={(v) => patch("document_count", Math.max(1, v))} />
            <NumberField label="Apostilles" value={form.apostille_count} min={0} disabled={locked} onChange={(v) => patch("apostille_count", Math.min(form.document_count, v))} />
            <NumberField label="Signers" value={form.signer_count} min={1} disabled={locked} onChange={(v) => patch("signer_count", Math.max(1, v))} />
            <NumberField label="FL notarial acts" value={form.florida_notarial_act_count} min={0} disabled={locked} onChange={(v) => patch("florida_notarial_act_count", v)} />
            <NumberField label="Remote witnesses" value={form.remote_witness_count} min={0} disabled={locked} onChange={(v) => patch("remote_witness_count", v)} />
            <NumberField label="In-person witnesses" value={form.in_person_witness_count} min={0} disabled={locked} onChange={(v) => patch("in_person_witness_count", v)} />
            <NumberField label="International signers" value={form.international_signer_count} min={0} disabled={locked} onChange={(v) => patch("international_signer_count", v)} />
            <NumberField label="Jurisdictions" value={form.jurisdiction_count} min={1} disabled={locked} onChange={(v) => patch("jurisdiction_count", Math.max(1, v))} />
            <NumberField label="Mobile miles" value={form.mobile_miles} min={0} step={0.1} disabled={locked || form.execution_method !== "in_person"} onChange={(v) => patch("mobile_miles", v)} />
            <MoneyField label="Courier cost" value={form.courier_cost} disabled={locked} onChange={(v) => patch("courier_cost", v)} />
            <MoneyField label="Authority fees" value={form.external_authority_fees} disabled={locked} onChange={(v) => patch("external_authority_fees", v)} />
            <Field label="Discount code">
              <Input value={form.discount_code} disabled={locked} onChange={(e) => patch("discount_code", e.target.value.toUpperCase())} placeholder="Optional" />
            </Field>
          </section>

          <section>
            <div className="mb-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Execution & handling flags</div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <Toggle label="After-hours / evening" checked={form.after_hours} disabled={locked} onChange={(v) => patch("after_hours", v)} />
              <Toggle label="Translation coordination" checked={form.translation_coordination} disabled={locked} onChange={(v) => patch("translation_coordination", v)} />
              <Toggle label="Federal / FBI apostille" checked={form.federal_apostille} disabled={locked} onChange={(v) => patch("federal_apostille", v)} />
              <Toggle label="Executive in-person state handling" checked={form.executive_state_handling} disabled={locked} onChange={(v) => patch("executive_state_handling", v)} />
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5 text-amber-400" /> Governed manual-review triggers
            </div>
            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <Toggle label="Consular legalization" checked={form.consular_legalization} disabled={locked} onChange={(v) => patch("consular_legalization", v)} />
              <Toggle label="Certified translation" checked={form.certified_translation} disabled={locked} onChange={(v) => patch("certified_translation", v)} />
              <Toggle label="Receiving authority uncertain" checked={form.receiving_authority_uncertain} disabled={locked} onChange={(v) => patch("receiving_authority_uncertain", v)} />
              <Toggle label="Document preparation / formatting" checked={form.document_preparation} disabled={locked} onChange={(v) => patch("document_preparation", v)} />
            </div>
          </section>
        </div>

        <aside className="space-y-4 xl:border-l xl:border-border/60 xl:pl-5">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Live canonical quote</div>
            <Button size="sm" variant="ghost" onClick={() => void loadPreview()} disabled={loading}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Recalculate
            </Button>
          </div>

          {error && (
            <div className="rounded-md border border-red-500/25 bg-red-500/5 p-3 text-xs text-red-300">{error}</div>
          )}

          {preview ? (
            <>
              {preview.review_required && (
                <div className="rounded-md border border-amber-500/30 bg-amber-500/8 p-3">
                  <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-300">
                    <AlertTriangle className="h-4 w-4" /> Manual review required
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {reviewReasons.length ? reviewReasons.join(" · ") : "A governed exception blocks automatic pricing."}
                  </div>
                </div>
              )}

              <div className="space-y-2 rounded-md border border-border/70 bg-background/40 p-3">
                {preview.breakdown?.map((line) => (
                  <div key={line.code} className="flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="text-foreground">{line.label}</div>
                      <div className="mt-0.5 uppercase tracking-wider text-[9px] text-muted-foreground">{line.category}</div>
                    </div>
                    <div className="font-mono text-foreground">{money(line.amount)}</div>
                  </div>
                ))}
              </div>

              <div className="space-y-2 rounded-md border border-gold/40 bg-gold-soft p-4">
                <SummaryRow label="Subtotal" value={money(preview.subtotal ?? preview.total)} />
                <SummaryRow label="Discountable subtotal" value={money(preview.eligible_subtotal)} />
                <SummaryRow label="Pass-through / non-discountable" value={money(preview.non_discountable_total)} />
                <div className="my-2 h-px bg-border" />
                <SummaryRow label="Matter total" value={preview.total == null ? "Review required" : money(preview.total)} strong />
                <SummaryRow label="50% Wise deposit" value={preview.deposit_amount == null ? "—" : money(preview.deposit_amount)} strong />
                <SummaryRow label="Final balance" value={preview.balance_due == null ? "—" : money(preview.balance_due)} strong />
              </div>

              <Button
                className="w-full"
                onClick={commitQuote}
                disabled={locked || committing || loading || preview.review_required || preview.total == null}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {committing ? "Approving quote…" : "Approve Quote & Set Payment Gate"}
              </Button>
            </>
          ) : (
            <div className="rounded-md border border-border/70 p-4 text-sm text-muted-foreground">
              {loading ? "Composing quote…" : "No quote preview available."}
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-muted-foreground">
            Public pricing remains hidden. This tool writes only reviewed Matter pricing, payment amounts, and evidence to the canonical Matter record.
          </p>
        </aside>
      </CardContent>
    </Card>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1.5">
      <span className="block text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  step,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" min={min} step={step ?? 1} value={value} disabled={disabled} onChange={(e) => onChange(n(e.target.value))} />
    </Field>
  );
}

function MoneyField({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number;
  disabled?: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <Field label={label}>
      <Input type="number" min={0} step="0.01" value={value} disabled={disabled} onChange={(e) => onChange(n(e.target.value))} />
    </Field>
  );
}

function Toggle({
  label,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-border/60 bg-background/30 px-3 py-2 text-sm">
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#C6A65B]" />
      <span className={disabled ? "text-muted-foreground" : "text-foreground"}>{label}</span>
    </label>
  );
}

function SummaryRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 text-xs ${strong ? "font-semibold" : ""}`}>
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-mono text-gold" : "font-mono text-foreground"}>{value}</span>
    </div>
  );
}
