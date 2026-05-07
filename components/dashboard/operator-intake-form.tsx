"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { formatCurrency, formatCurrencyDetailed } from "@/lib/format";
import { CheckCircle2, Sparkles, Loader2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

interface PricingResult {
  lane: string;
  base: number;
  total: number;
  witness_total: number;
  addons: { item: string; amount: number }[];
}

const US_STATES = [
  "Florida",
  "California",
  "New York",
  "Texas",
  "Colorado",
  "Nevada",
  "Pennsylvania",
  "Washington",
  "Illinois",
  "Massachusetts",
];

const COUNTRIES = [
  "United States",
  "Italy",
  "Spain",
  "France",
  "Germany",
  "United Kingdom",
  "Netherlands",
  "Brazil",
  "Argentina",
  "Mexico",
  "Japan",
  "South Korea",
  "United Arab Emirates",
  "Switzerland",
  "Portugal",
  "Greece",
];

const DOC_TYPES = [
  "Power of Attorney",
  "Affidavit",
  "Birth Certificate (apostille)",
  "Marriage Certificate (apostille)",
  "Single Status Affidavit",
  "Corporate Resolution",
  "Loan Documents",
  "Educational Records",
  "Other",
];

interface FormState {
  client_name: string;
  email: string;
  phone: string;
  document_type: string;
  use_case: string;
  destination_country: string;
  origin_state: string;
  apostille: boolean;
  docs: number;
  signers: number;
  witnesses: number;
  witness_type: "ron" | "in_person";
  after_hours: boolean;
  urgency: "standard" | "urgent";
  mobile: boolean;
  miles: number;
  translation: boolean;
  multi_country: boolean;
  notes: string;
}

const INITIAL: FormState = {
  client_name: "",
  email: "",
  phone: "",
  document_type: "Power of Attorney",
  use_case: "",
  destination_country: "Italy",
  origin_state: "Florida",
  apostille: true,
  docs: 1,
  signers: 1,
  witnesses: 0,
  witness_type: "ron",
  after_hours: false,
  urgency: "standard",
  mobile: false,
  miles: 0,
  translation: false,
  multi_country: false,
  notes: "",
};

interface WiseInvoice {
  payment_method: string;
  amount: number;
  reference: string;
  note: string;
  wise_link: string;
  wise_request_id?: string | null;
  wise_mode?: "production" | "fallback";
  status: string;
}

interface SuccessData {
  deal_id: string;
  lane: string;
  estimated_value: number;
  payment_link?: string | null;
  wise_invoice?: WiseInvoice | null;
  conversion_score: number;
  priority_tier: string;
  portal_url?: string;
}

export function OperatorIntakeForm() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessData | null>(null);

  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestSeq = useRef(0);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const seq = ++requestSeq.current;
      setPricingLoading(true);
      try {
        const res = await fetch("/api/admin/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            state: form.origin_state,
            apostille: form.apostille,
            docs: form.docs,
            mobile: form.mobile,
            miles: form.miles,
            signers: form.signers,
            translation: form.translation,
            urgency: form.urgency,
            multi_country: form.multi_country,
            witnesses: form.witnesses,
            witness_type: form.witness_type,
            after_hours: form.after_hours,
          }),
        });
        if (seq !== requestSeq.current) return;
        if (res.ok) setPricing((await res.json()) as PricingResult);
      } catch {
        // ignore — leave previous value on screen
      } finally {
        if (seq === requestSeq.current) setPricingLoading(false);
      }
    }, 250);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_name: form.client_name,
          name: form.client_name,
          email: form.email,
          phone: form.phone,
          document_type: form.document_type,
          use_case: form.use_case || undefined,
          country: form.destination_country,
          destination_country: form.destination_country,
          origin_state: form.origin_state,
          apostille: form.apostille,
          docs: form.docs,
          signers: form.signers,
          witnesses: form.witnesses,
          witness_type: form.witness_type,
          after_hours: form.after_hours,
          urgency: form.urgency,
          mobile: form.mobile,
          miles: form.miles,
          translation: form.translation,
          multi_country: form.multi_country,
          notes: form.notes || undefined,
          source_channel: "admin",
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || `Intake failed (${res.status})`);
        return;
      }
      toast.success(`Matter ${data.deal_id} created · ${data.lane} lane`);
      setSuccess(data);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Network error");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <Card className="max-w-2xl mx-auto gold-glow">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-paid flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="font-serif text-xl">
                Matter created
              </CardTitle>
              <CardDescription>
                {success.deal_id} · {success.lane} lane ·{" "}
                {success.priority_tier} priority
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="space-y-2 text-sm">
            <Row
              label="Estimated value"
              value={formatCurrencyDetailed(success.estimated_value)}
            />
            <Row
              label="Conversion score"
              value={`${success.conversion_score}/100`}
            />
          </dl>

          {success.payment_link && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Wise payment link (retainer)
                </p>
                {success.wise_invoice?.wise_mode && (
                  <span
                    className={`text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                      success.wise_invoice.wise_mode === "production"
                        ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                        : "border-red-500/30 text-red-400 bg-red-500/10"
                    }`}
                  >
                    {success.wise_invoice.wise_mode === "fallback"
                      ? "Fallback (Wise call failed)"
                      : "Production · LIVE"}
                  </span>
                )}
              </div>
              <a
                href={success.payment_link}
                target="_blank"
                rel="noreferrer"
                className="block px-3 py-2 rounded-md border border-border bg-background/40 text-xs text-foreground/80 break-all hover:border-gold transition-colors"
              >
                {success.payment_link}
              </a>
              {success.wise_invoice && (
                <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                  <div>
                    Reference:{" "}
                    <span className="text-gold font-mono">
                      {success.wise_invoice.reference}
                    </span>
                  </div>
                  <div className="text-right">
                    Amount:{" "}
                    <span className="text-foreground">
                      ${Number(success.wise_invoice.amount).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
              {success.wise_invoice?.wise_mode === "fallback" && (
                <p className="mt-2 text-[11px] text-red-400 leading-relaxed">
                  Wise API call didn't succeed — this URL is the fallback stub
                  and won't track payments. Check{" "}
                  <code className="text-foreground">
                    /api/admin/wise/health
                  </code>{" "}
                  to diagnose, then create the matter again.
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
            >
              <Link href={`/dashboard/deals/${success.deal_id}`}>
                Open matter
              </Link>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSuccess(null);
                setForm(INITIAL);
              }}
            >
              Create another
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid lg:grid-cols-[1fr_360px] gap-6"
    >
      <div className="space-y-6">
        {/* Client */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Client
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field id="client_name" label="Full name" required>
              <Input
                id="client_name"
                required
                value={form.client_name}
                onChange={(e) => update("client_name", e.target.value)}
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="email" label="Email" required>
                <Input
                  id="email"
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </Field>
              <Field id="phone" label="Phone">
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </Field>
            </div>
          </CardContent>
        </Card>

        {/* Matter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Matter
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="document_type" label="Document type" required>
                <SelectInput
                  id="document_type"
                  value={form.document_type}
                  onChange={(v) => update("document_type", v)}
                  options={DOC_TYPES}
                />
              </Field>
              <Field id="use_case" label="Use case">
                <Input
                  id="use_case"
                  value={form.use_case}
                  onChange={(e) => update("use_case", e.target.value)}
                  placeholder="e.g. dual-citizenship, real-estate"
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                id="destination_country"
                label="Destination country"
                required
              >
                <SelectInput
                  id="destination_country"
                  value={form.destination_country}
                  onChange={(v) => update("destination_country", v)}
                  options={COUNTRIES}
                />
              </Field>
              <Field id="origin_state" label="Origin state" required>
                <SelectInput
                  id="origin_state"
                  value={form.origin_state}
                  onChange={(v) => update("origin_state", v)}
                  options={US_STATES}
                />
              </Field>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <Field id="docs" label="Documents">
                <Input
                  id="docs"
                  type="number"
                  min={1}
                  max={50}
                  value={form.docs}
                  onChange={(e) =>
                    update("docs", Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </Field>
              <Field id="signers" label="Signers">
                <Input
                  id="signers"
                  type="number"
                  min={1}
                  max={10}
                  value={form.signers}
                  onChange={(e) =>
                    update("signers", Math.max(1, Number(e.target.value) || 1))
                  }
                />
              </Field>
              <Field id="witnesses" label="Witnesses">
                <Input
                  id="witnesses"
                  type="number"
                  min={0}
                  max={6}
                  value={form.witnesses}
                  onChange={(e) =>
                    update(
                      "witnesses",
                      Math.max(0, Number(e.target.value) || 0),
                    )
                  }
                />
              </Field>
            </div>
            <ToggleRow
              label="Apostille required"
              checked={form.apostille}
              onChange={(v) => update("apostille", v)}
            />
          </CardContent>
        </Card>

        {/* Service options */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Service options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field id="urgency" label="Urgency">
                <SelectInput
                  id="urgency"
                  value={form.urgency}
                  onChange={(v) => update("urgency", v as FormState["urgency"])}
                  options={["standard", "urgent"]}
                />
              </Field>
              <Field id="witness_type" label="Witness type">
                <SelectInput
                  id="witness_type"
                  value={form.witness_type}
                  onChange={(v) =>
                    update("witness_type", v as FormState["witness_type"])
                  }
                  options={[
                    { value: "ron", label: "Remote (RON)" },
                    { value: "in_person", label: "In-person" },
                  ]}
                />
              </Field>
            </div>
            <div className="space-y-2">
              <ToggleRow
                label="Mobile (Florida only — adds mileage)"
                checked={form.mobile}
                onChange={(v) => update("mobile", v)}
              />
              {form.mobile && (
                <Field id="miles" label="Miles round-trip">
                  <Input
                    id="miles"
                    type="number"
                    min={0}
                    max={200}
                    value={form.miles}
                    onChange={(e) =>
                      update("miles", Math.max(0, Number(e.target.value) || 0))
                    }
                  />
                </Field>
              )}
              <ToggleRow
                label="After-hours (+$37 witness fee)"
                checked={form.after_hours}
                onChange={(v) => update("after_hours", v)}
              />
              <ToggleRow
                label="Translation needed"
                checked={form.translation}
                onChange={(v) => update("translation", v)}
              />
              <ToggleRow
                label="Multi-country execution"
                checked={form.multi_country}
                onChange={(v) => update("multi_country", v)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={form.notes}
              onChange={(e) => update("notes", e.target.value)}
              rows={4}
              placeholder="Internal context, client requests, scheduling caveats…"
            />
          </CardContent>
        </Card>

        <Button
          type="submit"
          disabled={submitting}
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
        >
          {submitting ? "Creating matter…" : "Create matter"}
        </Button>
      </div>

      {/* Live pricing sidebar */}
      <aside className="lg:sticky lg:top-20 self-start space-y-4">
        <Card className="border-gold gold-glow">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <CardTitle className="text-[10px] uppercase tracking-widest text-gold font-semibold">
                  Live preview
                </CardTitle>
              </div>
              {pricingLoading && (
                <Loader2 className="w-3.5 h-3.5 text-gold animate-spin" />
              )}
            </div>
            <CardDescription className="text-xs">
              Pricing recalculates as you type — server is source of truth on
              submit.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pricing ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Lane</span>
                  <Badge variant="outline" className="bg-await">
                    {pricing.lane}
                  </Badge>
                </div>
                <Row label="Base" value={formatCurrency(pricing.base)} />
                {pricing.witness_total > 0 && (
                  <Row
                    label="Witnesses"
                    value={formatCurrency(pricing.witness_total)}
                  />
                )}
                <Separator />
                <div className="flex justify-between items-baseline">
                  <span className="text-foreground font-medium">
                    Estimated total
                  </span>
                  <span className="font-serif text-2xl text-gold">
                    {formatCurrency(pricing.total)}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-3">
                Calculating quote…
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6 text-xs text-muted-foreground space-y-1.5 leading-relaxed">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground/80 mb-2">
              How lanes are chosen
            </p>
            <p>· Florida + mobile → Mobile Standard ($135 + miles×2)</p>
            <p>· Colorado simple RON → RON Simple ($150)</p>
            <p>· Multi-signer or translation → Priority ($975)</p>
            <p>· Urgent or multi-country → Executive ($1,850)</p>
            <p>· Otherwise → Signature ($750)</p>
          </CardContent>
        </Card>
      </aside>
    </form>
  );
}

function Field({
  id,
  label,
  required,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
        {required && <span className="text-gold"> *</span>}
      </Label>
      {children}
    </div>
  );
}

interface SelectOption {
  value: string;
  label: string;
}

function normalizeOptions(
  options: ReadonlyArray<string | SelectOption>,
): SelectOption[] {
  return options.map((o) =>
    typeof o === "string" ? { value: o, label: o } : o,
  );
}

function SelectInput({
  id,
  value,
  onChange,
  options,
}: {
  id: string;
  value: string;
  onChange: (v: string) => void;
  options: ReadonlyArray<string | SelectOption>;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full h-9 px-3 rounded-md border border-input bg-transparent text-sm focus:outline-none focus:border-primary text-foreground"
    >
      {normalizeOptions(options).map((o) => (
        <option key={o.value} value={o.value} className="bg-card">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-background/40 border border-border">
      <span className="text-sm text-foreground/80">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3 py-1">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
