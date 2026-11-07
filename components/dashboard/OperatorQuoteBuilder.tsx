"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Calculator, CheckCircle2, LockKeyhole, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isQuoteMutationLocked } from "@/lib/pricing/quoteMutationLock";

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

type NotarizationRequirement = "required" | "not_required" | "review_required";
type AuthenticationRequirement =
  | "apostille"
  | "authentication_legalization"
  | "not_required"
  | "review_required";
type NotarialAct =
  | "acknowledgment"
  | "jurat"
  | "oath_affirmation"
  | "signature_witnessing"
  | "other"
  | "review_required";
type IssuingAuthority = "unknown" | "state" | "federal" | "county" | "court" | "private";

const DOCUMENT_CATEGORIES = [
  "state_public_record",
  "federal_document",
  "private_document",
  "court_document",
  "corporate_document",
  "educational_record",
  "vital_record",
  "notarized_affidavit",
  "power_of_attorney",
  "certified_copy",
  "fbi_background_check",
  "consular_document",
  "other_review_required",
] as const;

type RouteIntelligence = {
  destination: string;
  documentCategory: string;
  routeType: string;
  routeLabel: string;
  authorityStatus: string;
  reviewRequired: boolean;
  reviewReasons: string[];
  safetyNotice: string;
  acceptanceNotice?: string;
  issuingLane?: "state" | "federal" | "unresolved";
  federalAgency?: string | null;
  authorityPath?: string[];
  advisories?: string[];
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
  route_intelligence?: RouteIntelligence;
};

type OperatorQuoteBuilderProps = {
  matterId: string;
  paymentStatus?: string | null;
  amountPaid?: number | null;
  paymentObservedAt?: string | null;
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
    destinationCountry?: string | null;
    originState?: string | null;
    documentType?: string | null;
    receivingAuthority?: string | null;
    executionTruth?: Record<string, unknown> | null;
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
  destination_country: string;
  origin_state: string;
  document_type: string;
  document_category: "" | (typeof DOCUMENT_CATEGORIES)[number];
  issuing_authority: IssuingAuthority;
  issuing_agency: string;
  receiving_authority: string;
  notarization_requirement: NotarizationRequirement;
  notarial_act: NotarialAct;
  authentication_requirement: AuthenticationRequirement;
  signer_location: string;
  execution_location: string;
};

const pickString = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;

// Builder execution method is a pricing view of canonical execution truth.
// It is read only from recorded truth or an explicit fact — never inferred.
function initialExecutionMethod(
  truth: Record<string, unknown> | null | undefined,
  explicit: ExecutionMethod | null | undefined,
): ExecutionMethod {
  const method = typeof truth?.execution_method === "string" ? truth.execution_method : "";
  if (method === "ron") return "ron";
  if (method === "in_person" || method === "mobile") return "in_person";
  if (method === "already_notarized" || method === "third_party_notary") return "none";
  return explicit ?? "none";
}

// Wire format for the governed composer: canonical execution truth fields plus
// pricing scope. RON identity checks are stated as provider requirements only;
// their completion is never asserted here.
function quoteRequestBody(form: QuoteForm) {
  return {
    ...form,
    document_category: form.document_category || undefined,
    execution_method: form.execution_method,
    ron_kba_status: form.execution_method === "ron" ? "required" : undefined,
    ron_credential_analysis_status: form.execution_method === "ron" ? "required" : undefined,
    signer_location: form.signer_location || undefined,
    execution_location: form.execution_location || undefined,
  };
}

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
  paymentObservedAt,
  initial,
  onCommitted,
}: OperatorQuoteBuilderProps) {
  const [reviewing, setReviewing] = useState(false);
  const [reviewConfirmed, setReviewConfirmed] = useState(false);
  const [reviewReason, setReviewReason] = useState("");
  const truth = initial?.executionTruth ?? null;
  const [form, setForm] = useState<QuoteForm>({
    matter_base: initial?.matterBase ?? "authentication",
    execution_method: initialExecutionMethod(truth, initial?.executionMethod),
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
    destination_country: initial?.destinationCountry ?? "",
    origin_state: initial?.originState ?? "",
    document_type: initial?.documentType ?? "",
    document_category: "",
    issuing_authority: "unknown",
    issuing_agency: "",
    receiving_authority: initial?.receivingAuthority ?? "",
    notarization_requirement: pickString(
      truth?.notarization_requirement,
      ["required", "not_required", "review_required"] as const,
      "review_required",
    ),
    notarial_act: pickString(
      truth?.notarial_act,
      ["acknowledgment", "jurat", "oath_affirmation", "signature_witnessing", "other", "review_required"] as const,
      "review_required",
    ),
    authentication_requirement: pickString(
      truth?.authentication_requirement,
      ["apostille", "authentication_legalization", "not_required", "review_required"] as const,
      Number(initial?.apostilleCount ?? 0) > 0 ? "apostille" : "review_required",
    ),
    signer_location: typeof truth?.signer_location === "string" ? truth.signer_location : "",
    execution_location: typeof truth?.execution_location === "string" ? truth.execution_location : "",
  });
  const [preview, setPreview] = useState<QuotePreview | null>(null);
  const [loading, setLoading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const locked = useMemo(
    () =>
      isQuoteMutationLocked({
        payment_status: paymentStatus,
        amount_paid: amountPaid,
        payment_observed_at: paymentObservedAt,
      }),
    [paymentStatus, amountPaid, paymentObservedAt],
  );

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
        body: JSON.stringify(quoteRequestBody(form)),
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

  async function confirmExecutionReview() {
    setReviewing(true);
    setError(null);
    try {
      const response = await fetch(`/api/dashboard/matters/${matterId}/execution-review`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...quoteRequestBody(form), review: {
          document_reviewed: reviewConfirmed, signer_reviewed: reviewConfirmed,
          witness_reviewed: reviewConfirmed, eligibility_reviewed: reviewConfirmed,
          signer_count: form.signer_count,
          witness_count: form.remote_witness_count + form.in_person_witness_count,
          reason: reviewReason,
        } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Execution review was not saved.");
      toast.success("Execution review saved. Private quote approval remains a separate step.");
      onCommitted?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Execution review was not saved.");
    } finally { setReviewing(false); }
  }

  async function commitQuote() {
    if (locked || committing) return;
    setCommitting(true);
    setError(null);
    try {
      const response = await fetch(`/api/deals/${matterId}/quote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(quoteRequestBody(form)),
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
  const routeIntelligence = preview?.route_intelligence;
  const routeUnresolved = !routeIntelligence || routeIntelligence.reviewRequired;
  const approveDisabled =
    locked ||
    committing ||
    loading ||
    !preview ||
    preview.review_required ||
    routeUnresolved ||
    preview.total == null;

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
          <section className="rounded-md border border-[#C6A65B]/20 bg-[#C6A65B]/[0.03] p-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-[#C6A65B]">Destination & document route</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Destination country">
                <Input value={form.destination_country} disabled={locked} onChange={(e) => patch("destination_country", e.target.value)} />
              </Field>
              <Field label="Document origin">
                <Input value={form.origin_state} disabled={locked} onChange={(e) => patch("origin_state", e.target.value)} placeholder="Issuing / execution state" />
              </Field>
              <Field label="Document type">
                <Input value={form.document_type} disabled={locked} onChange={(e) => patch("document_type", e.target.value)} />
              </Field>
              <Field label="Document category">
                <Select
                  value={form.document_category}
                  disabled={locked}
                  onChange={(value) => patch("document_category", value as QuoteForm["document_category"])}
                  options={[
                    ["", "Auto-classify (review if unclear)"],
                    ...DOCUMENT_CATEGORIES.map((category) => [category, category.replaceAll("_", " ")] as [string, string]),
                  ]}
                />
              </Field>
              <Field label="Issuing authority">
                <Select
                  value={form.issuing_authority}
                  disabled={locked}
                  onChange={(value) => patch("issuing_authority", value as IssuingAuthority)}
                  options={[
                    ["unknown", "Review required"],
                    ["state", "State"],
                    ["federal", "Federal"],
                    ["county", "County"],
                    ["court", "Court"],
                    ["private", "Private / executed document"],
                  ]}
                />
              </Field>
              <Field label="Federal issuing agency">
                <Input value={form.issuing_agency} disabled={locked} onChange={(e) => patch("issuing_agency", e.target.value)} placeholder="FBI, USCIS, IRS… (federal only)" />
              </Field>
              <Field label="Receiving authority (if known)">
                <Input value={form.receiving_authority} disabled={locked} onChange={(e) => patch("receiving_authority", e.target.value)} placeholder="Court, comune, bank, counsel…" />
              </Field>
            </div>
          </section>

          <section className="rounded-md border border-border/60 p-4">
            <div className="mb-3 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">Canonical execution truth</div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <Field label="Notarization">
                <Select
                  value={form.notarization_requirement}
                  disabled={locked}
                  onChange={(value) => patch("notarization_requirement", value as NotarizationRequirement)}
                  options={[
                    ["review_required", "Review required"],
                    ["required", "Required"],
                    ["not_required", "Not required"],
                  ]}
                />
              </Field>
              <Field label="Notarial act">
                <Select
                  value={form.notarial_act}
                  disabled={locked || form.notarization_requirement !== "required"}
                  onChange={(value) => patch("notarial_act", value as NotarialAct)}
                  options={[
                    ["review_required", "Review required"],
                    ["acknowledgment", "Acknowledgment"],
                    ["jurat", "Jurat"],
                    ["oath_affirmation", "Oath / affirmation"],
                    ["signature_witnessing", "Signature witnessing"],
                    ["other", "Other (documented instruction)"],
                  ]}
                />
              </Field>
              <Field label="Authentication">
                <Select
                  value={form.authentication_requirement}
                  disabled={locked}
                  onChange={(value) => patch("authentication_requirement", value as AuthenticationRequirement)}
                  options={[
                    ["review_required", "Review required"],
                    ["apostille", "Apostille"],
                    ["authentication_legalization", "Authentication / legalization"],
                    ["not_required", "Not required"],
                  ]}
                />
              </Field>
              <Field label="Signer location">
                <Input value={form.signer_location} disabled={locked} onChange={(e) => patch("signer_location", e.target.value)} />
              </Field>
              <Field label="Execution location (in person)">
                <Input value={form.execution_location} disabled={locked || form.execution_method !== "in_person"} onChange={(e) => patch("execution_location", e.target.value)} />
              </Field>
            </div>
          </section>

          <section className="space-y-3 rounded-md border border-border/60 p-4">
            <p className="text-sm">Confirm the document title, readiness, deadline, signer count and locations, witness requirements, and execution eligibility. Review applicable provider and receiving-authority restrictions. This review does not establish legal sufficiency or payment.</p>
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" checked={reviewConfirmed} disabled={locked || reviewing} onChange={(e) => setReviewConfirmed(e.target.checked)} />
              I have reviewed these facts and resolved the execution blockers.
            </label>
            <label className="block text-sm">Review evidence / instruction reference
              <Input value={reviewReason} disabled={locked || reviewing} onChange={(e) => setReviewReason(e.target.value)} />
            </label>
            <Button type="button" disabled={locked || reviewing || !reviewConfirmed || reviewReason.trim().length < 10} onClick={() => void confirmExecutionReview()}>
              {reviewing ? "Saving review…" : "Confirm execution review"}
            </Button>
          </section>

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
            <Button size="sm" variant="ghost" onClick={() => void loadPreview()} disabled={loading || locked}>
              <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Recalculate
            </Button>
          </div>

          {locked && (
            <div className="rounded-md border border-amber-500/30 bg-amber-500/8 p-3 text-xs text-amber-200">
              Payment activity has begun on this Matter. The quote is locked and cannot be mutated.
            </div>
          )}

          {routeIntelligence && (
            <section
              aria-label="Route intelligence"
              className={`rounded-md border p-3 ${routeIntelligence.reviewRequired ? "border-amber-500/30 bg-amber-500/[0.04]" : "border-[#C6A65B]/25 bg-[#C6A65B]/[0.03]"}`}
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#C6A65B]">Route intelligence</div>
              <div className="mt-1 font-serif text-base text-foreground">{routeIntelligence.routeLabel}</div>
              <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[11px]">
                <dt className="text-muted-foreground">Document category</dt>
                <dd className="text-foreground">{routeIntelligence.documentCategory.replaceAll("_", " ")}</dd>
                <dt className="text-muted-foreground">Authority status</dt>
                <dd className="text-foreground">{routeIntelligence.authorityStatus.replaceAll("_", " ")}</dd>
                {routeIntelligence.issuingLane && (
                  <>
                    <dt className="text-muted-foreground">Issuing lane</dt>
                    <dd className="text-foreground">
                      {routeIntelligence.issuingLane === "federal"
                        ? `Federal authentication${routeIntelligence.federalAgency ? ` · ${routeIntelligence.federalAgency}` : ""}`
                        : routeIntelligence.issuingLane === "state"
                          ? "State authentication / apostille"
                          : "Unresolved"}
                    </dd>
                  </>
                )}
              </dl>
              {routeIntelligence.reviewReasons.length > 0 && (
                <ul className="mt-2 space-y-1 text-[11px] leading-4 text-amber-300/90">
                  {routeIntelligence.reviewReasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              )}
              {routeIntelligence.advisories?.length ? (
                <ul className="mt-2 space-y-1 text-[10px] leading-4 text-muted-foreground">
                  {routeIntelligence.advisories.map((advisory) => (
                    <li key={advisory}>{advisory}</li>
                  ))}
                </ul>
              ) : null}
              <p className="mt-2 text-[10px] leading-4 text-muted-foreground">{routeIntelligence.safetyNotice}</p>
              <p className="mt-1 text-[10px] leading-4 text-[#F6F1E6]/70">
                {routeIntelligence.acceptanceNotice ?? "Final acceptance remains subject to the receiving authority."}
              </p>
            </section>
          )}

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
                disabled={approveDisabled}
              >
                <Calculator className="mr-2 h-4 w-4" />
                {committing
                  ? "Approving quote…"
                  : routeUnresolved
                    ? "Route review required"
                    : "Approve Quote & Set Payment Gate"}
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

function Select({
  value,
  disabled,
  onChange,
  options,
}: {
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  options: Array<[string, string]>;
}) {
  return (
    <select
      className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    >
      {options.map(([optionValue, label]) => (
        <option key={optionValue || "auto"} value={optionValue}>
          {label}
        </option>
      ))}
    </select>
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
