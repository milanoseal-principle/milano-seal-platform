"use client";

import { useEffect, useState } from "react";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { CheckCircle2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { formatCurrencyDetailed } from "@/lib/format";

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
  "Israel",
  "South Africa",
  "Australia",
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

const schema = z.object({
  client_name: z.string().min(1, "Required"),
  client_type: z.enum(["individual", "business"]),
  company_name: z.string().optional(),
  email: z.string().email("Valid email required"),
  phone: z.string().optional(),
  document_type: z.string().min(1, "Required"),
  use_case: z.string().optional(),
  destination_country: z.string().min(1, "Required"),
  origin_state: z.string().min(1, "Required"),
  apostille_required: z.boolean(),
  docs_count: z.coerce.number().min(1).max(50).default(1),
  signers: z.coerce.number().min(1).max(10).default(1),
  witnesses: z.coerce.number().min(0).max(6).default(0),
  witness_type: z.enum(["ron", "in_person"]).optional(),
  after_hours: z.boolean().default(false),
  urgency: z.enum(["standard", "urgent"]).default("standard"),
  mobile: z.boolean().default(false),
  miles: z.coerce.number().min(0).max(200).default(0),
  translation: z.boolean().default(false),
  multi_country: z.boolean().default(false),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface QuoteData {
  lane: string;
  base: number;
  witness_total: number;
  total: number;
  breakdown: { label: string; amount: number }[];
  rationale: string;
}

interface SuccessData {
  deal_id: string;
  payment_link: string;
  pricing: QuoteData;
}

export default function Intake() {
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      client_name: "",
      client_type: "individual",
      company_name: "",
      email: "",
      phone: "",
      document_type: "Power of Attorney",
      use_case: "",
      destination_country: "Italy",
      origin_state: "Florida",
      apostille_required: true,
      docs_count: 1,
      signers: 1,
      witnesses: 0,
      witness_type: "in_person",
      after_hours: false,
      urgency: "standard",
      mobile: false,
      miles: 0,
      translation: false,
      multi_country: false,
      notes: "",
    },
  });

  const watched = form.watch();

  useEffect(() => {
    if (
      !watched.document_type ||
      !watched.destination_country ||
      !watched.origin_state
    )
      return;
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            origin_state: watched.origin_state,
            destination_country: watched.destination_country,
            document_type: watched.document_type,
            apostille_required: watched.apostille_required,
            docs_count: watched.docs_count,
            signers: watched.signers,
            witnesses: watched.witnesses,
            witness_type:
              watched.witnesses > 0
                ? (watched.witness_type ?? "in_person")
                : undefined,
            after_hours: watched.after_hours,
            urgency: watched.urgency,
            mobile: watched.mobile,
            miles: watched.miles,
            translation: watched.translation,
            multi_country: watched.multi_country,
          }),
        });
        if (res.ok) setQuoteData(await res.json());
      } catch {}
    }, 250);
    return () => clearTimeout(t);
  }, [
    watched.document_type,
    watched.destination_country,
    watched.origin_state,
    watched.apostille_required,
    watched.docs_count,
    watched.signers,
    watched.witnesses,
    watched.witness_type,
    watched.after_hours,
    watched.urgency,
    watched.mobile,
    watched.miles,
    watched.translation,
    watched.multi_country,
  ]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          name: values.client_name,
          country: values.destination_country,
          docs: values.docs_count,
          apostille: values.apostille_required,
          witness_type:
            values.witnesses > 0
              ? (values.witness_type ?? "in_person")
              : undefined,
          source_channel: "admin",
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        toast.error(data.error || "Failed to create matter.");
        return;
      }
      toast.success(`Matter ${data.deal_id} created.`);
      setSuccess({
        deal_id: data.deal_id,
        payment_link: data.payment_link ?? data.wise_invoice?.wise_link ?? "",
        pricing: data.pricing as QuoteData,
      });
    } catch {
      toast.error("Failed to create matter.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="bg-card border-gold gold-glow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-7 h-7 text-gold" />
              <div>
                <CardTitle className="font-serif text-2xl">
                  Matter accepted
                </CardTitle>
                <CardDescription>
                  Reference number, payment link, and lane assignment are below.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="p-4 rounded-md border border-gold bg-gold-soft">
              <div className="text-[11px] uppercase tracking-widest text-gold mb-1">
                Reference
              </div>
              <div className="font-mono text-2xl text-foreground">
                {success.deal_id}
              </div>
            </div>

            <div className="p-4 rounded-md border border-border bg-secondary/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {success.pricing.lane} Lane
                </span>
                <span className="font-serif text-2xl text-gold">
                  {formatCurrencyDetailed(success.pricing.total)}
                </span>
              </div>
              <p className="text-sm text-muted-foreground italic">
                {success.pricing.rationale}
              </p>
              <Separator className="bg-border" />
              {success.pricing.breakdown.map((b) => (
                <div key={b.label} className="flex justify-between text-sm">
                  <span className="text-foreground/80">{b.label}</span>
                  <span className="text-foreground">
                    {formatCurrencyDetailed(b.amount)}
                  </span>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                Wise Payment Link
              </div>
              <div className="flex items-center gap-2 p-3 rounded-md border border-border bg-background">
                <code className="flex-1 text-xs text-foreground/80 break-all">
                  {success.payment_link}
                </code>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(success.payment_link);
                    toast.success("Copied", { id: "clipboard" });
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                {success.payment_link && (
                  <a
                    href={success.payment_link}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </a>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Link href={`/dashboard/deals/${success.deal_id}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Open Matter Detail
                </Button>
              </Link>
              <Link href={`/dashboard/pro-forma/${success.deal_id}`}>
                <Button variant="outline">Open Pro Forma</Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  form.reset();
                }}
              >
                Submit another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const live = quoteData?.total ?? null;

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-8">
      <div>
        <Reveal>
          <div className="mb-8">
            <DashboardPageHeader
              eyebrow="Intake Review Center"
              title="New Matter Intake"
              description="Capture matter facts. Lane and pricing are determined automatically from jurisdiction, document type, and execution constraints."
            />
          </div>
        </Reveal>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="bg-card border-gold">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Client</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="client_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Client name</FormLabel>
                      <FormControl>
                        <Input data-testid="input-client-name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="client_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watched.client_type === "business" && (
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Company</FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-gold">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Matter</CardTitle>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map((d) => (
                            <SelectItem key={d} value={d}>
                              {d}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="use_case"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Use case (optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Italian dual citizenship"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="origin_state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Origin state</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="destination_country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Destination country</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((c) => (
                            <SelectItem key={c} value={c}>
                              {c}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="docs_count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Documents</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="standard">Standard</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="bg-card border-gold">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Execution</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="signers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signers</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="witnesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Witnesses</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {watched.witnesses > 0 && (
                    <FormField
                      control={form.control}
                      name="witness_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Witness type</FormLabel>
                          <Select
                            value={field.value ?? "in_person"}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="in_person">
                                In-person
                              </SelectItem>
                              <SelectItem value="ron">Remote (RON)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="apostille_required"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border border-border rounded-md">
                        <FormLabel className="m-0">
                          Apostille required
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="translation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border border-border rounded-md">
                        <FormLabel className="m-0">
                          Certified translation
                        </FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="multi_country"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border border-border rounded-md">
                        <FormLabel className="m-0">Multi-country</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="after_hours"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border border-border rounded-md">
                        <FormLabel className="m-0">After-hours</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="mobile"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between p-3 border border-border rounded-md">
                        <FormLabel className="m-0">Mobile (Florida)</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  {watched.mobile && (
                    <FormField
                      control={form.control}
                      name="miles"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Miles (round trip)</FormLabel>
                          <FormControl>
                            <Input type="number" min={0} {...field} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          rows={3}
                          placeholder="Anything the operator should know."
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-primary text-primary-foreground hover:bg-primary/90 gold-glow"
                data-testid="submit-intake"
              >
                {submitting ? "Submitting…" : "Submit Intake"}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      <aside className="lg:sticky lg:top-24 self-start">
        <Card className="bg-card border-gold gold-glow">
          <CardHeader>
            <CardTitle className="font-serif text-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-gold" /> Live Quote
            </CardTitle>
            <CardDescription>Updates as you fill the form.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!quoteData ? (
              <div className="text-sm text-muted-foreground">
                Computing pricing…
              </div>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {quoteData.lane} Lane
                </div>
                <div className="font-serif text-4xl text-gold">
                  {formatCurrencyDetailed(quoteData.total)}
                </div>
                <p className="text-xs text-muted-foreground italic">
                  {quoteData.rationale}
                </p>
                <Separator className="bg-border" />
                {quoteData.breakdown.map((b) => (
                  <div key={b.label} className="flex justify-between text-sm">
                    <span className="text-foreground/80">{b.label}</span>
                    <span className="text-foreground">
                      {formatCurrencyDetailed(b.amount)}
                    </span>
                  </div>
                ))}
                <Separator className="bg-border" />
                <div className="text-[11px] text-muted-foreground">
                  Total reflects all execution constraints. Final balance is
                  charged via Wise after intake review.
                </div>
                {live !== null && <div className="hidden">{live}</div>}
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
