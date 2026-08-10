"use client";

import { useEffect, useMemo, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { toast } from "sonner";
import { AlertCircle, CheckCircle2, Copy, ExternalLink, Sparkles } from "lucide-react";
import { DashboardPageHeader } from "@/components/dashboard/system/DashboardPageHeader";
import { Reveal } from "@/components/dashboard/system/DashboardMotion";
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

const RON_STATUS = [
  "required",
  "not_required",
  "completed",
  "failed",
  "review_required",
] as const;

const schema = z
  .object({
    client_name: z.string().min(1, "Required"),
    client_type: z.enum(["individual", "business"]),
    company_name: z.string().optional(),
    email: z.string().email("Valid email required"),
    phone: z.string().optional(),
    document_type: z.string().min(1, "Required"),
    use_case: z.string().optional(),
    destination_country: z.string().min(1, "Required"),
    origin_state: z.string().min(1, "Required"),
    docs_count: z.coerce.number().min(1).max(50).default(1),
    signers: z.coerce.number().min(1).max(10).default(1),
    witnesses: z.coerce.number().min(0).max(6).default(0),
    witness_type: z.enum(["ron", "in_person"]).optional(),
    after_hours: z.boolean().default(false),
    urgency: z.enum(["standard", "urgent"]).default("standard"),
    miles: z.coerce.number().min(0).max(200).default(0),
    translation: z.boolean().default(false),
    multi_country: z.boolean().default(false),
    notarization_requirement: z.enum([
      "required",
      "not_required",
      "review_required",
    ]),
    execution_method: z.enum([
      "ron",
      "in_person",
      "mobile",
      "already_notarized",
      "third_party_notary",
      "review_required",
    ]),
    notarial_act: z.enum([
      "acknowledgment",
      "jurat",
      "oath_affirmation",
      "signature_witnessing",
      "other",
      "review_required",
    ]),
    authentication_requirement: z.enum([
      "apostille",
      "authentication_legalization",
      "not_required",
      "review_required",
    ]),
    signer_location: z.string().optional(),
    execution_location: z.string().optional(),
    assigned_notary: z.string().optional(),
    notary_jurisdiction: z.string().optional(),
    certificate_type: z.string().optional(),
    ron_kba_status: z.enum(RON_STATUS).optional(),
    ron_credential_analysis_status: z.enum(RON_STATUS).optional(),
    notes: z.string().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.execution_method === "ron") {
      if (!value.signer_location?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["signer_location"],
          message: "Signer location is required for RON",
        });
      }
      if (!value.ron_kba_status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ron_kba_status"],
          message: "KBA status is required for RON",
        });
      }
      if (!value.ron_credential_analysis_status) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["ron_credential_analysis_status"],
          message: "Credential-analysis status is required for RON",
        });
      }
    }
    if (
      (value.execution_method === "mobile" ||
        value.execution_method === "in_person") &&
      !value.execution_location?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["execution_location"],
        message: "Execution location is required",
      });
    }
    if (value.execution_method === "already_notarized") {
      if (!value.notary_jurisdiction?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["notary_jurisdiction"],
          message: "Notary jurisdiction is required",
        });
      }
      if (!value.certificate_type?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["certificate_type"],
          message: "Certificate type is required",
        });
      }
    }
    if (
      value.execution_method === "third_party_notary" &&
      !value.notary_jurisdiction?.trim()
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["notary_jurisdiction"],
        message: "Third-party notary jurisdiction is required",
      });
    }
  });

type FormValues = z.infer<typeof schema>;

interface QuoteData {
  lane: string;
  base: number;
  witness_total: number;
  total: number | null;
  breakdown: { label: string; amount: number }[];
  rationale: string;
  review_required?: boolean;
  triggers?: string[];
}

interface SuccessData {
  deal_id: string;
  payment_link: string;
  pricing: QuoteData;
}

interface IntakeFailure {
  code: string;
  correlationId: string | null;
  message: string;
  reason?: string;
  httpStatus?: number;
  retryable?: boolean;
}

const DEFAULTS: FormValues = {
  client_name: "",
  client_type: "individual",
  company_name: "",
  email: "",
  phone: "",
  document_type: "Power of Attorney",
  use_case: "",
  destination_country: "Italy",
  origin_state: "Florida",
  docs_count: 1,
  signers: 1,
  witnesses: 0,
  witness_type: "in_person",
  after_hours: false,
  urgency: "standard",
  miles: 0,
  translation: false,
  multi_country: false,
  notarization_requirement: "review_required",
  execution_method: "review_required",
  notarial_act: "review_required",
  authentication_requirement: "review_required",
  signer_location: "",
  execution_location: "",
  assigned_notary: "",
  notary_jurisdiction: "",
  certificate_type: "",
  ron_kba_status: undefined,
  ron_credential_analysis_status: undefined,
  notes: "",
};

function executionTruth(values: FormValues) {
  return {
    version: 1 as const,
    notarization_requirement: values.notarization_requirement,
    execution_method: values.execution_method,
    notarial_act: values.notarial_act,
    authentication_requirement: values.authentication_requirement,
    signer_location: values.signer_location?.trim() || null,
    execution_location: values.execution_location?.trim() || null,
    assigned_notary: values.assigned_notary?.trim() || null,
    notary_jurisdiction: values.notary_jurisdiction?.trim() || null,
    certificate_type: values.certificate_type?.trim() || null,
    ron_kba_status:
      values.execution_method === "ron" ? values.ron_kba_status ?? null : null,
    ron_credential_analysis_status:
      values.execution_method === "ron"
        ? values.ron_credential_analysis_status ?? null
        : null,
  };
}

function titleCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function Intake() {
  const [success, setSuccess] = useState<SuccessData | null>(null);
  const [failure, setFailure] = useState<IntakeFailure | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: DEFAULTS,
  });

  const watched = form.watch();
  const quoteRequestJson = useMemo(() => {
    const truth = executionTruth(watched);
    return JSON.stringify({
      origin_state: watched.origin_state,
      destination_country: watched.destination_country,
      document_type: watched.document_type,
      docs_count: watched.docs_count,
      signers: watched.signers,
      witnesses: watched.witnesses,
      witness_type:
        watched.witnesses > 0
          ? watched.witness_type ?? "in_person"
          : undefined,
      after_hours: watched.after_hours,
      urgency: watched.urgency,
      miles: watched.miles,
      translation: watched.translation,
      multi_country: watched.multi_country,
      execution_truth: truth,
      notarization_requirement: truth.notarization_requirement,
      execution_method: truth.execution_method,
      notarial_act: truth.notarial_act,
      authentication_requirement: truth.authentication_requirement,
    });
  }, [
    watched.origin_state,
    watched.destination_country,
    watched.document_type,
    watched.docs_count,
    watched.signers,
    watched.witnesses,
    watched.witness_type,
    watched.after_hours,
    watched.urgency,
    watched.miles,
    watched.translation,
    watched.multi_country,
    watched.notarization_requirement,
    watched.execution_method,
    watched.notarial_act,
    watched.authentication_requirement,
    watched.signer_location,
    watched.execution_location,
    watched.assigned_notary,
    watched.notary_jurisdiction,
    watched.certificate_type,
    watched.ron_kba_status,
    watched.ron_credential_analysis_status,
  ]);

  useEffect(() => {
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch("/api/pricing/quote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: quoteRequestJson,
        });
        const json = (await response.json().catch(() => null)) as QuoteData | null;
        setQuoteData(json);
      } catch (error) {
        console.warn("[dashboard/intake] live quote unavailable", error);
        setQuoteData(null);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [quoteRequestJson]);

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    setFailure(null);
    try {
      const canonicalTruth = executionTruth(values);
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          name: values.client_name,
          country: values.destination_country,
          docs: values.docs_count,
          apostille: values.authentication_requirement === "apostille",
          apostille_required:
            values.authentication_requirement === "apostille",
          mobile: values.execution_method === "mobile",
          ron_required: values.execution_method === "ron",
          notarization_required:
            values.notarization_requirement === "required",
          witness_type:
            values.witnesses > 0
              ? values.witness_type ?? "in_person"
              : undefined,
          execution_truth: canonicalTruth,
          source_channel: "admin",
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.success) {
        setFailure({
          code:
            typeof data.code === "string"
              ? data.code
              : "UNKNOWN_INTAKE_FAILURE",
          correlationId:
            typeof data.correlation_id === "string"
              ? data.correlation_id
              : null,
          message:
            typeof data.error === "string"
              ? data.error
              : "Unable to create Matter",
          reason: typeof data.reason === "string" ? data.reason : undefined,
          httpStatus: response.status,
          retryable: Boolean(data.retryable),
        });
        toast.error("Unable to create Matter");
        return;
      }

      toast.success(`Matter ${data.deal_id} created.`);
      setSuccess({
        deal_id: data.deal_id,
        payment_link: data.payment_link ?? data.wise_invoice?.wise_link ?? "",
        pricing: data.pricing as QuoteData,
      });
    } catch {
      setFailure({
        code: "NETWORK_FAILURE",
        correlationId: null,
        message: "Unable to create Matter",
        reason: "The request did not reach a successful server response.",
        retryable: true,
      });
      toast.error("Unable to create Matter");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card className="border-gold bg-card gold-glow">
          <CardHeader>
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-gold" />
              <div>
                <CardTitle className="font-serif text-2xl">Matter accepted</CardTitle>
                <CardDescription>
                  Reference number, payment link, and lane assignment are below.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="rounded-md border border-gold bg-gold-soft p-4">
              <div className="mb-1 text-[11px] uppercase tracking-widest text-gold">
                Reference
              </div>
              <div className="font-mono text-2xl text-foreground">
                {success.deal_id}
              </div>
            </div>

            <div className="space-y-3 rounded-md border border-border bg-secondary/40 p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {success.pricing.lane} Lane
                </span>
                {success.pricing.total != null && (
                  <span className="font-serif text-2xl text-gold">
                    {formatCurrencyDetailed(success.pricing.total)}
                  </span>
                )}
              </div>
              <p className="text-sm italic text-muted-foreground">
                {success.pricing.rationale}
              </p>
            </div>

            {success.payment_link && (
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  Wise Payment Link
                </div>
                <div className="flex items-center gap-2 rounded-md border border-border bg-background p-3">
                  <code className="flex-1 break-all text-xs text-foreground/80">
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
                    <Copy className="h-4 w-4" />
                  </Button>
                  <a href={success.payment_link} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="ghost">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link href={`/dashboard/deals/${success.deal_id}`}>
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Open Matter Detail
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={() => {
                  setSuccess(null);
                  setFailure(null);
                  setQuoteData(null);
                  form.reset(DEFAULTS);
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

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0">
        <Reveal>
          <div className="mb-8">
            <DashboardPageHeader
              eyebrow="Intake Review Center"
              title="New Matter Intake"
              description="Capture authoritative Matter facts. Notarization, execution method, notarial act, and authentication are separate operator decisions."
            />
          </div>
        </Reveal>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card className="border-gold bg-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Client</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
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
                      <Select value={field.value} onValueChange={field.onChange}>
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

            <Card className="border-gold bg-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">Matter</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="document_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Document type</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DOC_TYPES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
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
                      <FormLabel>Document origin / state</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {US_STATES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
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
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COUNTRIES.map((item) => (
                            <SelectItem key={item} value={item}>
                              {item}
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="urgency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Urgency</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
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

            <Card className="border-gold bg-card">
              <CardHeader>
                <CardTitle className="font-serif text-xl">
                  Execution truth
                </CardTitle>
                <CardDescription>
                  No field is inferred from another. Apostille does not imply
                  notarization, and non-mobile never implies RON.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="notarization_requirement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notarization</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="required">Required</SelectItem>
                            <SelectItem value="not_required">
                              Not Required
                            </SelectItem>
                            <SelectItem value="review_required">
                              Review Required
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="execution_method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Execution method</FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            if (value === "already_notarized") {
                              form.setValue(
                                "notarization_requirement",
                                "not_required",
                              );
                            }
                            if (value !== "mobile") form.setValue("miles", 0);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ron">RON</SelectItem>
                            <SelectItem value="in_person">In-Person</SelectItem>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="already_notarized">
                              Already Notarized
                            </SelectItem>
                            <SelectItem value="third_party_notary">
                              Third-Party Notary
                            </SelectItem>
                            <SelectItem value="review_required">
                              Review Required
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notarial_act"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notarial act</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="acknowledgment">
                              Acknowledgment
                            </SelectItem>
                            <SelectItem value="jurat">Jurat</SelectItem>
                            <SelectItem value="oath_affirmation">
                              Oath / Affirmation
                            </SelectItem>
                            <SelectItem value="signature_witnessing">
                              Signature Witnessing
                            </SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                            <SelectItem value="review_required">
                              Review Required
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="authentication_requirement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Authentication</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apostille">Apostille</SelectItem>
                            <SelectItem value="authentication_legalization">
                              Authentication / Legalization
                            </SelectItem>
                            <SelectItem value="not_required">
                              Not Required
                            </SelectItem>
                            <SelectItem value="review_required">
                              Review Required
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="signers"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Signers</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} {...field} />
                        </FormControl>
                        <FormMessage />
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
                        <FormMessage />
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
                              <SelectItem value="in_person">In-Person</SelectItem>
                              <SelectItem value="ron">Remote (RON)</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                {watched.execution_method === "ron" && (
                  <div className="grid gap-4 rounded-md border border-gold/30 bg-gold-soft/30 p-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="signer_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Signer location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="City, State / Country"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="ron_kba_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>RON KBA</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {RON_STATUS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {titleCase(item)}
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
                      name="ron_credential_analysis_status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credential analysis</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              {RON_STATUS.map((item) => (
                                <SelectItem key={item} value={item}>
                                  {titleCase(item)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {(watched.execution_method === "mobile" ||
                  watched.execution_method === "in_person") && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="execution_location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Execution location</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Full execution address / venue"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {watched.execution_method === "mobile" && (
                      <FormField
                        control={form.control}
                        name="miles"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Miles (round trip)</FormLabel>
                            <FormControl>
                              <Input type="number" min={0} {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )}

                {(watched.execution_method === "already_notarized" ||
                  watched.execution_method === "third_party_notary") && (
                  <div className="grid gap-4 md:grid-cols-3">
                    <FormField
                      control={form.control}
                      name="notary_jurisdiction"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notary jurisdiction</FormLabel>
                          <FormControl>
                            <Input placeholder="State / jurisdiction" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="certificate_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Certificate type</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Acknowledgment, jurat, other"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="assigned_notary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assigned notary</FormLabel>
                          <FormControl>
                            <Input placeholder="Optional until assigned" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="translation"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                        <FormLabel className="m-0">Certified translation</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="multi_country"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                        <FormLabel className="m-0">Multi-country</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="after_hours"
                    render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-md border border-border p-3">
                        <FormLabel className="m-0">After-hours</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={(checked) =>
                              field.onChange(Boolean(checked))
                            }
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
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

            {failure && (
              <Card className="border-destructive/60 bg-destructive/5">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="min-w-0 space-y-2">
                      <div>
                        <div className="font-medium text-foreground">
                          {failure.message}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          The Matter was not accepted as saved. Correct the issue
                          below and try again.
                        </div>
                      </div>
                      <div className="grid gap-1 text-xs sm:grid-cols-2">
                        <div>
                          <span className="text-muted-foreground">
                            Error code:
                          </span>{" "}
                          <code className="font-mono text-foreground">
                            {failure.code}
                          </code>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Reference:
                          </span>{" "}
                          <code className="font-mono text-foreground">
                            {failure.correlationId ?? "Not available"}
                          </code>
                        </div>
                        {failure.httpStatus && (
                          <div>
                            <span className="text-muted-foreground">HTTP:</span>{" "}
                            <code className="font-mono text-foreground">
                              {failure.httpStatus}
                            </code>
                          </div>
                        )}
                      </div>
                      {failure.reason && (
                        <p className="text-xs text-muted-foreground">
                          {failure.reason}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

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

      <aside className="self-start lg:sticky lg:top-24">
        <Card className="border-gold bg-card gold-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <Sparkles className="h-4 w-4 text-gold" /> Live Quote
            </CardTitle>
            <CardDescription>
              Server-priced from the same execution truth submitted with the
              Matter.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!quoteData ? (
              <div className="text-sm text-muted-foreground">
                Computing pricing…
              </div>
            ) : quoteData.review_required || quoteData.total == null ? (
              <>
                <div className="text-[11px] uppercase tracking-widest text-gold">
                  Review Required
                </div>
                <p className="text-sm text-muted-foreground">
                  {quoteData.rationale}
                </p>
                {quoteData.triggers?.map((trigger) => (
                  <div
                    key={trigger}
                    className="rounded border border-border px-2 py-1 text-xs text-muted-foreground"
                  >
                    {titleCase(trigger)}
                  </div>
                ))}
                <div className="text-[11px] text-muted-foreground">
                  No payment amount is approved from unresolved execution facts.
                </div>
              </>
            ) : (
              <>
                <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                  {quoteData.lane} Lane
                </div>
                <div className="font-serif text-4xl text-gold">
                  {formatCurrencyDetailed(quoteData.total)}
                </div>
                <p className="text-xs italic text-muted-foreground">
                  {quoteData.rationale}
                </p>
                {quoteData.triggers && quoteData.triggers.length > 0 && (
                  <div className="space-y-1">
                    {quoteData.triggers.map((trigger) => (
                      <div
                        key={trigger}
                        className="text-[11px] text-muted-foreground"
                      >
                        • {trigger}
                      </div>
                    ))}
                  </div>
                )}
                <Separator className="bg-border" />
                {quoteData.breakdown.map((item) => (
                  <div
                    key={item.label}
                    className="flex justify-between gap-3 text-sm"
                  >
                    <span className="text-foreground/80">{item.label}</span>
                    <span className="text-foreground">
                      {formatCurrencyDetailed(item.amount)}
                    </span>
                  </div>
                ))}
                <Separator className="bg-border" />
                <div className="text-[11px] text-muted-foreground">
                  Final persisted amount, invoice, portal, discount calculation,
                  and Wise request must use this server-authoritative quote.
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
