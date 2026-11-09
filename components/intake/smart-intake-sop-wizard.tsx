"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartMatterIntake } from "@/components/intake/SmartMatterIntake";
import { FileUploadZone } from "@/components/intake/FileUploadZone";
import type { MatterAnalysis } from "@/lib/intake/matterAnalysis";
import { classifyIntake, type AiExtraction, type ClassificationInput } from "@/lib/intake/smartClassification";
import { buildIntakeClarifications, type IntakeQuestion } from "@/lib/intake/intakeClarifications";
import { QUOTE_AFTER_REVIEW_PREVIEW, type IntakeQuotePreview } from "@/lib/pricing/intakeQuotePreviewTypes";
import { buildIntakeAnalyticsPayload, type IntakeAnalyticsEvent } from "@/lib/intake/intakeAnalytics";
import {
  documentIdentityLabel,
  isQuoteReady,
  outstandingRequirements,
  serviceStateLabel,
  type DeliveryChoice,
  type TimelineChoice,
} from "@/lib/intake/reviewReadiness";

import { getSmartIntakeQuestionPlan, normalizeSmartIntakeIntent, type TriState } from "@/lib/intake/serviceIntent";
import { INTAKE_DRAFT_KEY, intakeFormSchema, intakeAnalysisSchema, restoreIntakeDraft, type IntakeFormState as FormState } from "@/lib/intake/intakeDraft";

interface IntakePrefill {
  country?: string;
  document?: string;
  useCase?: string;
  matter?: string;
}

interface Props {
  initialTier?: "signature" | "priority" | "executive";
  prefill?: IntakePrefill;
  courtesyCode?: string;
  /** Governed professional handoff (verified server-side, never trusted here). */
  professionalReferral?: { profileId: string; reference: string };
  /** Non-authoritative service intent from the entry lane (e.g. /intake?intent=ron). */
  serviceIntent?: string;
}

type UploadState = "pending" | "uploading" | "uploaded" | "failed";

const INITIAL: FormState = {
  description: "",
  name: "",
  email: "",
  phone: "",
  documentType: "",
  documentCount: 0,
  signerCount: 0,
  originState: "",
  signerLocation: "",
  destinationCountry: "",
  executionType: "",
  mobileAddress: "",
  notarizationChoice: "",
  apostilleChoice: "",
  translationChoice: "",
  deadline: "",
  courierRequired: false,
  timelineChoice: "",
  deliveryChoice: "",
  internationalUse: "",
  alreadyExecuted: "",
  witnessMentioned: "",
  witnessWording: "",
};

const COUNTRIES = [
  "United States", "Italy", "Spain", "Portugal", "Mexico", "Brazil", "Colombia", "France", "Germany", "Greece",
  "United Kingdom", "Canada", "Australia", "Netherlands", "Switzerland", "Austria", "Argentina", "Japan", "South Korea",
  "United Arab Emirates", "India", "South Africa", "New Zealand", "Ireland", "Poland", "Czech Republic", "Hungary", "Romania",
  "Bulgaria", "Croatia", "Sweden", "Norway", "Denmark", "Finland", "Belgium", "Luxembourg", "Turkey", "Israel", "Qatar",
  "Saudi Arabia", "Other",
];

const inputCls = "w-full min-h-12 rounded-sm border border-[rgba(198,165,90,0.18)] bg-[#0A0A0A] px-4 py-3 text-base text-white placeholder:text-[#9A9488]/50 focus:border-[var(--ms-gold)] focus:outline-none sm:text-sm";
const labelCls = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)]/70";
const primaryCls = "min-h-14 w-full rounded-sm bg-[var(--ms-gold)] px-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#0A0A0A] transition hover:bg-[#D4BB7A] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto";
const secondaryCls = "min-h-11 rounded-sm border border-[rgba(198,165,90,0.22)] px-4 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)]";

function fileKey(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function TriChoice({ id, label, value, onChange }: { id: string; label: string; value: TriState; onChange: (value: Exclude<TriState, "">) => void }) {
  const options: Array<[Exclude<TriState, "">, string]> = [["yes", "Yes"], ["no", "No"], ["unsure", "Not sure"]];
  return (
    <div role="radiogroup" aria-labelledby={`${id}-label`}>
      <p id={`${id}-label`} className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--ms-gold)]/70">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map(([option, text]) => (
          <button key={option} type="button" role="radio" aria-checked={value === option} id={`${id}-${option}`} onClick={() => onChange(option)}
            className={`min-h-11 min-w-[5.5rem] rounded-sm border px-4 text-[11px] font-semibold uppercase tracking-[0.12em] focus-visible:outline-2 focus-visible:outline-offset-2 ${value === option ? "border-[var(--ms-gold)] bg-[var(--ms-gold)]/15 text-[#E8DCC0]" : "border-[rgba(198,165,90,0.22)] text-[#9A9488]"}`}>
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

function ReviewRow({ label, value, onEdit }: { label: string; value: string; onEdit?: () => void }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 border-b border-[rgba(198,165,90,0.08)] px-4 py-3 last:border-0">
      <div>
        <div className="text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9A9488]">{label}</div>
        <div className="mt-1 break-words text-sm font-light text-[#E8DCC0]">{value || "To be confirmed"}</div>
      </div>
      {onEdit && <button type="button" onClick={onEdit} aria-label={`Edit ${label}`} className={secondaryCls}>Edit</button>}
    </div>
  );
}

export function SmartIntakeSOPWizard({ initialTier = "priority", prefill, courtesyCode, professionalReferral, serviceIntent }: Props) {
  const intent = normalizeSmartIntakeIntent(serviceIntent);
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    destinationCountry: prefill?.country || "",
    documentType: prefill?.document?.replace(/-/g, " ") || "",
    description: prefill?.matter ? prefill.matter.replace(/_/g, " ") : "",
  });
  const [analysis, setAnalysis] = useState<AiExtraction | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [questionDrafts, setQuestionDrafts] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [matterId, setMatterId] = useState<string | null>(null);
  const [uploadStates, setUploadStates] = useState<Record<string, UploadState>>({});
  const [savedWithUploadFailure, setSavedWithUploadFailure] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const [saveNotice, setSaveNotice] = useState("");
  const [executionDraft, setExecutionDraft] = useState<FormState["executionType"]>("");
  const [draftStorageAvailable, setDraftStorageAvailable] = useState(true);
  const draftContext = JSON.stringify([initialTier, prefill?.country, prefill?.document, prefill?.matter, courtesyCode, professionalReferral?.profileId]);
  const startedRef = useRef(false);
  const submittedRef = useRef(false);
  const reviewViewedRef = useRef(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  // One central question plan decides visibility only; never legal/execution truth.
  const plan = useMemo(() => getSmartIntakeQuestionPlan({
    intent,
    answers: {
      internationalUse: form.internationalUse,
      alreadyExecuted: form.alreadyExecuted,
      witnessMentioned: form.witnessMentioned,
      destinationCountry: form.destinationCountry,
      apostilleChoice: form.apostilleChoice,
    },
  }), [intent, form.internationalUse, form.alreadyExecuted, form.witnessMentioned, form.destinationCountry, form.apostilleChoice]);
  const shows = (question: Parameters<typeof plan.visible.includes>[0]) => plan.visible.includes(question);

  useEffect(() => {
    try {
      const draft = restoreIntakeDraft(sessionStorage.getItem(INTAKE_DRAFT_KEY), draftContext);
      if (draft) { setForm(draft.form); setAnalysis(draft.analysis ?? null); setExecutionDraft(draft.form.executionType); setStep(draft.step); }
    } catch { setDraftStorageAvailable(false); }
    setDraftReady(true);
  }, [draftContext]);

  useEffect(() => {
    if (!draftReady || submittedRef.current) return;
    try { sessionStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ version: 1, context: draftContext, savedAt: Date.now(), step, form, analysis: analysis ? intakeAnalysisSchema.parse(analysis) : null })); }
    catch { setDraftStorageAvailable(false); }
  }, [draftReady, draftContext, form, analysis, step]);

  const focusField = (id: string) => {
    requestAnimationFrame(() => {
      const field = document.getElementById(id);
      const details = field?.closest("details");
      if (details) details.open = true;
      field?.scrollIntoView({ block: "center", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      field?.focus({ preventScroll: true });
    });
  };

  const saveExecutionMethod = () => {
    if (!executionDraft || !intakeFormSchema.shape.executionType.safeParse(executionDraft).success) {
      setError("Choose a supported execution method or request document review, then save it.");
      focusField("review-execution-method");
      return;
    }
    setForm((prev) => ({ ...prev, executionType: executionDraft,
      notarizationChoice: executionDraft === "None" ? "no" : executionDraft === "Unsure" ? "unsure" : "yes" }));
    setError(null);
    setSaveNotice("Execution preference saved. Document review will confirm the authorized route and final quote.");
  };

  const classificationInput = useMemo((): ClassificationInput => ({
    text: form.description,
    structured: {
      documentType: form.documentType || undefined,
      documentCount: form.documentCount > 0 ? form.documentCount : undefined,
      signerCount: form.signerCount > 0 ? form.signerCount : undefined,
      originState: form.originState || undefined,
      signerLocation: form.signerLocation || undefined,
      destinationCountry: form.destinationCountry || undefined,
      notarization: form.notarizationChoice === "already" ? "already_completed" as const : form.notarizationChoice === "yes" ? true : form.notarizationChoice === "no" ? false : undefined,
      ron: form.executionType === "RON" ? true : form.executionType ? false : undefined,
      mobile: form.executionType ? false : undefined,
      apostille: form.apostilleChoice === "yes" ? true : form.apostilleChoice === "no" ? false : undefined,
      translation: form.translationChoice === "yes" ? true : form.translationChoice === "no" ? false : undefined,
    },
    ai: analysis ? {
      documentType: analysis.documentType || undefined,
      country: analysis.country || undefined,
      originState: analysis.originState || undefined,
      documentCount: analysis.documentCount || undefined,
      signerCount: analysis.signerCount || undefined,
      apostilleRequired: analysis.apostilleRequired,
      translationNeeded: analysis.translationNeeded,
    } : undefined,
  }), [form, analysis]);
  const classification = useMemo(() => classifyIntake(classificationInput), [classificationInput]);

  const clarifications = useMemo(() => buildIntakeClarifications(classification), [classification]);
  // Pricing runs server-side only (/api/intake/quote-preview). The browser gets
  // a client-safe projection; until it arrives the quote stays after-review.
  const [clientPricing, setClientPricing] = useState<IntakeQuotePreview>(QUOTE_AFTER_REVIEW_PREVIEW);
  useEffect(() => {
    if (step !== 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetch("/api/intake/quote-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...classificationInput, selectedLane: initialTier, timeline: form.timelineChoice, delivery: form.deliveryChoice }),
        signal: controller.signal,
      })
        .then((response) => (response.ok ? response.json() : null))
        .then((preview: IntakeQuotePreview | null) => setClientPricing(preview?.mode ? preview : QUOTE_AFTER_REVIEW_PREVIEW))
        .catch(() => { if (!controller.signal.aborted) setClientPricing(QUOTE_AFTER_REVIEW_PREVIEW); });
    }, 250);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [step, classificationInput, initialTier, form.timelineChoice, form.deliveryChoice]);

  const outstanding = useMemo(
    () =>
      outstandingRequirements({
        classification,
        timeline: form.timelineChoice,
        delivery: form.deliveryChoice,
        pricingApproved: clientPricing.mode === "approved_price" && !form.executionType,
        executionReviewRequested: Boolean(form.executionType),
      }),
    [classification, form.timelineChoice, form.deliveryChoice, clientPricing.mode, form.executionType],
  );

  const quoteReady = useMemo(
    () =>
      isQuoteReady({
        classification,
        timeline: form.timelineChoice,
        delivery: form.deliveryChoice,
        pricingApproved: clientPricing.mode === "approved_price" && !form.executionType,
        executionReviewRequested: Boolean(form.executionType),
      }),
    [classification, form.timelineChoice, form.deliveryChoice, clientPricing.mode, form.executionType],
  );

  const matterTypeLabel = useMemo(() => {
    if (classification.apostille === "required") return "International Apostille Coordination";
    if (classification.authentication === "required") return "International Authentication Coordination";
    if (classification.ron === "required" || form.executionType === "RON") return "Remote Online Notarization";
    if (form.executionType === "InPerson") return "In-person Notarization";
    if (classification.mobile === "required") return "Mobile Notary Deployment";
    if (classification.notarization === "required") return "Notarization Coordination";
    return "Document Execution Coordination";
  }, [classification, form.executionType]);

  const scopeBullets = useMemo(() => {
    const bullets: string[] = [];
    bullets.push(`${classification.documentCount || files.length || 1} document${(classification.documentCount || files.length || 1) === 1 ? "" : "s"}`);
    if (classification.destinationCountry) bullets.push(`Destination: ${classification.destinationCountry}`);
    if (classification.apostille === "required") bullets.push(`Apostille coordination required${classification.apostilleQuantity > 1 ? ` (${classification.apostilleQuantity})` : ""}`);
    else if (classification.authentication === "required") bullets.push("Authentication coordination required");
    bullets.push(classification.ron === "required" || form.executionType === "RON" ? "RON included" : classification.notarization === "required" ? "Notarization included" : "RON not required");
    bullets.push(classification.translation === "required" ? "Translation included" : "Translation not required");
    return bullets;
  }, [classification, form.executionType, files.length]);

  const track = (event: IntakeAnalyticsEvent, metadata: Record<string, unknown> = {}, id?: string) => {
    try {
      const payload = buildIntakeAnalyticsPayload(event, metadata, id || matterId || undefined);
      void fetch("/api/intake/analytics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    } catch {
      // Observational only. Never block intake.
    }
  };

  const markStarted = () => {
    if (startedRef.current) return;
    startedRef.current = true;
    track("intake_started", { step });
  };

  const handleAnalysisReady = (next: MatterAnalysis) => {
    markStarted();
    setAnalysis(next);
    setForm((prev) => ({
      ...prev,
      description: prev.description || next.documentDescription,
      name: prev.name || next.clientName,
      email: prev.email || next.email,
      phone: prev.phone || next.phone,
    }));
    track("analysis_completed", { documentFamily: classification.documentFamily });
  };

  const answerQuestion = (question: IntakeQuestion, value: string) => {
    markStarted();
    if (question.id === "destination") setField("destinationCountry", value);
    else if (question.id === "document_origin") setField("originState", value);
    else if (question.id === "signer_location") setField("signerLocation", value);
    else if (question.id === "apostille_needed" || question.id === "resolve_apostille") {
      setField("apostilleChoice", value === "Yes" ? "yes" : value === "No" ? "no" : "unsure");
    } else if (question.id === "resolve_translation") {
      setField("translationChoice", value === "Yes" ? "yes" : value === "No" ? "no" : "unsure");
    } else if (question.id === "resolve_notarization") {
      setField("notarizationChoice", value === "Already notarized" ? "already" : "yes");
    } else if (question.id === "resolve_ron") {
      setField("executionType", value === "Yes" ? "RON" : "Unsure");
    } else if (question.id === "resolve_mobile") {
      setField("executionType", value === "Yes" ? "InPerson" : "Unsure");
    }
    setQuestionDrafts((prev) => ({ ...prev, [question.id]: "" }));
    track("clarification_completed", { questionCount: clarifications.questions.length });
  };

  const continueFromStep1 = () => {
    markStarted();
    if (!form.description.trim()) return setError("Tell us what you need before continuing.");
    if (!form.name.trim()) return setError("Your name is required.");
    if (!form.email.includes("@")) return setError("A valid email is required.");
    track("description_completed", { documentFamily: classification.documentFamily, destinationCountry: classification.destinationCountry });
    track("step_1_completed", { questionCount: clarifications.questions.length });
    if (clarifications.questions.length === 0) {
      track("step_2_completed", { questionCount: 0 });
      setStep(3);
    } else {
      track("clarification_requested", { questionCount: clarifications.questions.length });
      setStep(2);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (step === 2 && clarifications.questions.length === 0) {
      track("step_2_completed", { questionCount: 0 });
      setStep(3);
    }
    if (step === 3 && !reviewViewedRef.current) {
      reviewViewedRef.current = true;
      track("review_viewed", { pricingState: clientPricing.mode });
    }
  }, [step, clarifications.questions.length, clientPricing.mode]);

  useEffect(() => {
    const onUnload = () => {
      if (!startedRef.current || submittedRef.current) return;
      try {
        const payload = buildIntakeAnalyticsPayload("intake_abandoned", { step });
        navigator.sendBeacon?.("/api/intake/analytics", new Blob([JSON.stringify(payload)], { type: "application/json" }));
      } catch {}
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [step]);

  const uploadFilesForMatter = async (id: string, targets: File[], baseStates: Record<string, UploadState>) => {
    const next = { ...baseStates };
    for (const file of targets) {
      const key = fileKey(file);
      if (next[key] === "uploaded") continue;
      next[key] = "uploading";
      setUploadStates({ ...next });
      try {
        const body = new FormData();
        body.append("deal_id", id);
        body.append("files", file);
        const response = await fetch("/api/intake/upload", { method: "POST", body });
        const received=await response.json().catch(()=>null);
        if (!response.ok||received?.errors?.length||!received?.files?.length) throw new Error('Upload was not confirmed');
        next[key] = "uploaded";
        track("document_uploaded", { uploadCount: 1 }, id);
      } catch {
        next[key] = "failed";
        track("upload_failed", { failureCategory: "file_upload" }, id);
      }
      setUploadStates({ ...next });
    }
    return next;
  };

  const submit = async () => {
    // Gate on client-resolvable facts, NOT on pricing approval: matters that
    // intentionally price as quote_after_review (mobile / authentication /
    // translation coordination) must still be submittable so a Matter is
    // created for the operator to review and quote.
    if (executionDraft !== form.executionType) {
      setError("Save your execution method before submitting, or choose document review and save it.");
      focusField("save-execution-method");
      return;
    }
    if (outstanding.length > 0) {
      setError("Complete the details below, or request document review for the execution method.");
      focusField(requirementField(outstanding[0]));
      return;
    }
    if (!consent) { setError("Confirm the review notice before submitting."); focusField("review-consent"); return; }
    setSubmitting(true);
    setError(null);
    markStarted();

    const payload = {
      source_channel: "Website Form",
      ...(form.executionType ? {
        execution_method: form.executionType === "RON" ? "ron" : form.executionType === "InPerson" ? "in_person" : "review_required",
        notarization_requirement: form.executionType === "None" ? "not_required" : form.executionType === "Unsure" ? "review_required" : "required",
        authentication_requirement: classification.apostille === "required" ? "apostille" : classification.authentication === "required" ? "authentication_legalization" : "review_required",
        notarial_act: "review_required",
      } : {}),
      tier: initialTier,
      client_quoted_total: quoteReady ? clientPricing.amount : undefined,
      pricing_engine_version: "canonical-pricing-v1",
      name: form.name,
      client_name: form.name,
      email: form.email,
      phone: form.phone,
      document_type: classification.documentType || "Unspecified",
      document_description: form.description,
      docs: classification.documentCount,
      signers: classification.signerCount,
      state: classification.originJurisdiction || "",
      signer_location: classification.signerLocation || undefined,
      country: classification.destinationCountry || "United States",
      destination_country: classification.destinationCountry || "",
      mobile: classification.mobile === "required",
      notarization_required: classification.notarization === "required",
      ron_required: classification.ron === "required",
      apostille: classification.apostille === "required",
      apostille_count: classification.apostilleQuantity,
      translation: classification.translation === "required",
      // Timeline/delivery are explicit quote inputs. Client projection and
      // server recomputation consume the same selections so the accepted
      // quote cannot diverge from the amount persisted for Wise checkout.
      urgency: classification.urgency === "same_day" || classification.urgency === "urgent" ? "urgent" : "standard",
      timeline_preference: form.timelineChoice || undefined,
      delivery_method: form.deliveryChoice || undefined,
      deadline_date: form.deadline,
      notes: [
        form.executionType === "InPerson" && form.mobileAddress ? `Requested in-person location: ${form.mobileAddress}` : "",
        `[client_requested_service] ${intent} (context only; Milano review confirms execution, witness, apostille and route)`,
        form.witnessMentioned ? `[client_witness_context] mentions witnesses: ${form.witnessMentioned}${form.witnessWording ? ` — ${form.witnessWording}` : ""} (context only)` : "",
        form.internationalUse ? `[client_international_use] ${form.internationalUse} (context only)` : "",
        form.alreadyExecuted ? `[client_already_executed] ${form.alreadyExecuted} (context only)` : "",
      ].filter(Boolean).join("\n"),
      service_intent: intent,
      courier_required: form.courierRequired ? "yes" : undefined,
      name_match: true,
      files_uploaded: files.length > 0,
      courtesy_code: courtesyCode || undefined,
      professional_profile_id: professionalReferral?.profileId,
      referral_reference: professionalReferral?.reference,
    };

    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) throw new Error(json.error || "Failed to submit");
      const id = json.deal?.id || json.deal_id;
      if (!id) throw new Error("Matter was created without an identifier");
      setMatterId(id);
      submittedRef.current = true;
      try { sessionStorage.removeItem(INTAKE_DRAFT_KEY); } catch {}
      track("intake_submitted", { uploadCount: files.length, pricingState: clientPricing.mode }, id);

      if (typeof sessionStorage !== "undefined") {
        if (json.payment_link) sessionStorage.setItem("ms_payment_link", json.payment_link);
        if (json.wise_invoice) sessionStorage.setItem("ms_wise_invoice", JSON.stringify(json.wise_invoice));
        sessionStorage.setItem("ms_intake_response", JSON.stringify(json));
      }

      const seeded = Object.fromEntries(files.map((file) => [fileKey(file), "pending" as UploadState]));
      setUploadStates(seeded);
      const finalStates = files.length ? await uploadFilesForMatter(id, files, seeded) : seeded;
      const failed = files.some((file) => finalStates[fileKey(file)] === "failed");
      if (failed) {
        setSavedWithUploadFailure(true);
        setSubmitting(false);
        return;
      }
      router.push(`/intake/confirmation?id=${id}`);
    } catch (cause) {
      track("intake_error", { failureCategory: "matter_submission" });
      setError(cause instanceof Error ? cause.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  const retryFailedUploads = async () => {
    if (!matterId) return;
    track("upload_retry_started", { retryCount: 1 }, matterId);
    const failedFiles = files.filter((file) => uploadStates[fileKey(file)] === "failed");
    const finalStates = await uploadFilesForMatter(matterId, failedFiles, uploadStates);
    const stillFailed = files.some((file) => finalStates[fileKey(file)] === "failed");
    setSavedWithUploadFailure(stillFailed);
    if (!stillFailed) {
      track("upload_retry_completed", { success: true }, matterId);
      router.push(`/intake/confirmation?id=${matterId}`);
    }
  };

  const requirementField = (requirement: string) => {
    if (requirement.includes("document title")) return "review-document-title";
    if (requirement.includes("Issuing")) return "review-origin";
    if (requirement.includes("Destination")) return "review-destination";
    if (requirement.includes("timeline")) return "review-timeline";
    if (requirement.includes("Delivery")) return "review-delivery";
    return "review-execution-method";
  };

  const edit = (target: "matter" | "documents" | "destination" | "notarization" | "apostille" | "translation" | "timeline" | "delivery") => {
    track("review_edited", { step: 3 });
    const targets = { matter: "review-document-title", documents: "review-document-count", destination: "review-destination", notarization: "review-execution-method", apostille: "review-apostille", translation: "review-translation", timeline: "review-timeline", delivery: "review-delivery" };
    focusField(targets[target]);
  };

  if (savedWithUploadFailure && matterId) {
    const uploaded = files.filter((file) => uploadStates[fileKey(file)] === "uploaded").length;
    const failed = files.filter((file) => uploadStates[fileKey(file)] === "failed").length;
    return (
      <div className="mx-auto min-w-0 w-full max-w-2xl pb-[calc(2rem+env(safe-area-inset-bottom))]">
        <div className="rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[#0A0A0A] px-6 py-8 sm:px-10">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]">Your request was saved</div>
          <h2 className="mb-3 font-serif text-2xl text-[#E8DCC0]">Some documents did not finish uploading.</h2>
          <p className="mb-6 text-base font-light text-[#9A9488] sm:text-sm">{uploaded} uploaded. {failed} need retry. Your Matter ID is preserved and no second Matter will be created.</p>
          <button type="button" onClick={retryFailedUploads} className={primaryCls}>Retry Upload</button>
        </div>
      </div>
    );
  }

  const progress = step === 1 ? 0 : step === 2 ? 50 : 100;


  return (
    <div className="mx-auto min-w-0 w-full max-w-2xl pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-[9px] font-semibold uppercase tracking-[0.14em] text-[#9A9488]">
          <span>Your Matter</span><span>Execution</span><span>Review</span>
        </div>
        <div className="h-px bg-[rgba(198,165,90,0.14)]"><div className="h-px bg-[var(--ms-gold)] transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[linear-gradient(180deg,rgba(13,13,15,.97),rgba(7,7,8,.99))] shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        <div className="px-5 py-7 sm:px-10 sm:py-10">
          {step === 1 && (
            <>
              <h2 className="mb-1 font-serif text-2xl text-[#E8DCC0]">{intent === "unsure" ? "Tell Us What You Need" : plan.heading}</h2>
              <p className="mb-3 text-[12px] font-light tracking-[0.04em] text-[#9A9488]">Start with the Matter. We will structure it before asking for anything unnecessary.</p>
              <p data-testid="intake-intent-notice" className="mb-7 text-[11px] leading-5 text-[#9A9488]">{plan.authorityNotice}</p>

              <SmartMatterIntake onAnalysisReady={handleAnalysisReady} onFilesPicked={(picked) => { markStarted(); setFiles((prev) => [...prev, ...picked.filter((file) => !prev.some((existing) => fileKey(existing) === fileKey(file)))].slice(0, 10)); }} initialMessage={form.description} />

              <div className="mt-6">
                <label htmlFor="intake-description" className={labelCls}>{plan.descriptionPrompt} <span className="text-[var(--ms-gold)]">*</span></label>
                <textarea id="intake-description" value={form.description} onFocus={markStarted} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder="I need a power of attorney notarized for use in Italy." className={`${inputCls} min-h-28 resize-none`} />
              </div>

              <div className="mt-5">
                <label className={labelCls}>Upload document <span className="normal-case tracking-normal text-[#9A9488]">(optional)</span></label>
                <FileUploadZone value={files} onChange={(next) => { markStarted(); setFiles(next); }} maxFiles={5} maxSizeMB={10} />
              </div>

              {(form.description || analysis) && (
                <div className="mt-7 rounded-sm border border-[rgba(198,165,90,0.24)] bg-[rgba(198,165,90,0.05)] p-5">
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]">We Understand</span>
                    <button type="button" onClick={() => { track("analysis_corrected", { step: 1 }); focusField("intake-description"); }} className={secondaryCls}>Edit</button>
                  </div>
                  <ReviewRow label="Document" value={classification.documentType || "Not yet confirmed"} />
                  <ReviewRow label="Destination" value={classification.destinationCountry || "Not yet confirmed"} />
                  <ReviewRow label="Requested service" value={form.executionType === "RON" ? "Remote Online Notarization" : form.executionType === "InPerson" ? "In-person Notarization" : classification.notarization === "required" ? "Notarization" : "To be confirmed"} />
                  <ReviewRow label="Already completed" value={classification.notarization === "already_completed" ? "Notarization" : classification.apostille === "already_completed" ? "Apostille" : "None confirmed"} />
                  <ReviewRow label="Potential requirements" value={classification.manualReviewReasons.length ? "Additional route review may be required" : "No additional requirements confirmed yet"} />
                </div>
              )}

              <fieldset className="mt-6 space-y-5" aria-label="A few context questions">
                {shows("alreadyExecuted") && <TriChoice id="intake-already-executed" label="Has the document already been signed or notarized?" value={form.alreadyExecuted} onChange={(v) => setField("alreadyExecuted", v)} />}
                {shows("witnessContext") && <TriChoice id="intake-witness" label="Does the document mention witnesses?" value={form.witnessMentioned} onChange={(v) => setField("witnessMentioned", v)} />}
                {shows("witnessContext") && form.witnessMentioned === "yes" && (
                  <div><label htmlFor="intake-witness-wording" className={labelCls}>What does it say about witnesses? <span className="normal-case tracking-normal text-[#9A9488]">(optional)</span></label><input id="intake-witness-wording" value={form.witnessWording} onChange={(e) => setField("witnessWording", e.target.value)} className={inputCls} placeholder="e.g. Signed in the presence of two witnesses" /></div>
                )}
                {shows("internationalUse") && <TriChoice id="intake-international-use" label="Will this document be used outside the United States?" value={form.internationalUse} onChange={(v) => setField("internationalUse", v)} />}
              </fieldset>

              <div className="mt-7 border-t border-[rgba(198,165,90,0.1)] pt-6">
                <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ms-gold)]/70">Your contact</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label htmlFor="intake-name" className={labelCls}>Name *</label><input id="intake-name" value={form.name} onFocus={markStarted} onChange={(e) => setField("name", e.target.value)} className={inputCls} autoComplete="name" /></div>
                  <div><label htmlFor="intake-email" className={labelCls}>Email *</label><input id="intake-email" type="email" value={form.email} onFocus={markStarted} onChange={(e) => setField("email", e.target.value)} className={inputCls} autoComplete="email" /></div>
                </div>
                <div className="mt-4"><label htmlFor="intake-phone" className={labelCls}>Phone <span className="normal-case tracking-normal text-[#9A9488]">(optional)</span></label><input id="intake-phone" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} autoComplete="tel" /></div>
              </div>

              {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
              <button type="button" onClick={continueFromStep1} className={`${primaryCls} mt-7`}>Continue <ArrowRight className="ml-2 inline h-4 w-4" /></button>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="mb-1 font-serif text-2xl text-[#E8DCC0]">A Few Details</h2>
              <p className="mb-7 text-[12px] font-light tracking-[0.04em] text-[#9A9488]">Only the facts still needed to route or price your Matter.</p>
              <div className="space-y-5">
                {clarifications.questions.map((question) => (
                  <div key={question.id} className="rounded-sm border border-[rgba(198,165,90,0.18)] bg-[#0A0A0A] p-5">
                    <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-[var(--ms-gold)]/65">Required detail</div>
                    <div className="mb-4 text-base font-light text-[#E8DCC0]">{question.prompt}</div>
                    {question.options ? (
                      <div className="grid grid-cols-1 gap-2">
                        {question.options.map((option) => <button key={option} type="button" onClick={() => answerQuestion(question, option)} className="min-h-14 rounded-sm border border-[rgba(198,165,90,0.2)] bg-[rgba(198,165,90,0.03)] px-4 text-left text-base text-[#E8DCC0] hover:border-[var(--ms-gold)] sm:text-sm">{option}</button>)}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {question.id === "destination" ? (
                          <select value={questionDrafts[question.id] || ""} onChange={(e) => setQuestionDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))} className={inputCls}>
                            <option value="">— Select destination —</option>{COUNTRIES.map((country) => <option key={country}>{country}</option>)}
                          </select>
                        ) : (
                          <input value={questionDrafts[question.id] || ""} onChange={(e) => setQuestionDrafts((prev) => ({ ...prev, [question.id]: e.target.value }))} placeholder={question.id === "document_origin" ? "State or federal issuing authority" : "City and state"} className={inputCls} />
                        )}
                        <button type="button" disabled={!questionDrafts[question.id]?.trim()} onClick={() => answerQuestion(question, questionDrafts[question.id])} className={primaryCls}>Confirm</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => setStep(1)} className={`${secondaryCls} mt-7`}><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button>
            </>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 font-serif text-2xl text-[#E8DCC0]">Your Matter</h2>
              <p className="mb-7 text-[12px] font-light tracking-[0.04em] text-[#9A9488]">Review exactly what we understood before completing your order.</p>

              <div className="mb-6 overflow-hidden rounded-sm border border-[rgba(198,165,90,0.14)] bg-[#0A0A0A]">
                <div className="border-b border-[rgba(198,165,90,0.1)] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/60">Your Matter</div>
                <ReviewRow label="Matter Type" value={matterTypeLabel} onEdit={() => edit(classification.apostille === "required" || classification.authentication === "required" ? "apostille" : "notarization")} />
                <ReviewRow label="Documents" value={`${classification.documentCount || files.length || 1} document${(classification.documentCount || files.length || 1) === 1 ? "" : "s"}`} onEdit={() => edit("documents")} />
                <ReviewRow label="Document Titles" value={documentIdentityLabel(classification.documentType)} onEdit={() => edit("matter")} />
                <ReviewRow label="Destination" value={classification.destinationCountry || "Destination confirmation required"} onEdit={() => edit("destination")} />
                <ReviewRow label="Requested Service" value={classification.apostille === "required" ? "Apostille Coordination" : classification.authentication === "required" ? "Authentication Coordination" : matterTypeLabel} onEdit={() => edit(classification.apostille === "required" || classification.authentication === "required" ? "apostille" : "notarization")} />
                <ReviewRow label="Notarization" value={serviceStateLabel(classification.notarization, "Notarization required")} onEdit={() => edit("notarization")} />
                <ReviewRow label="Remote Online Notarization" value={serviceStateLabel(classification.ron, "Remote Online Notarization")} onEdit={() => edit("notarization")} />
                <ReviewRow label="Apostille / Authentication" value={classification.apostille === "required" ? "Apostille Coordination" : classification.authentication === "required" ? "Authentication Coordination" : serviceStateLabel(classification.apostille, "Apostille Coordination")} onEdit={() => edit("apostille")} />
                <ReviewRow label="Translation" value={serviceStateLabel(classification.translation, "Translation required")} onEdit={() => edit("translation")} />
              </div>

              <section aria-labelledby="execution-method-heading" className="mb-6 min-w-0 space-y-4 rounded-sm border border-[rgba(198,165,90,0.28)] bg-[#0A0A0A] p-4">
                <h3 id="execution-method-heading" className="font-serif text-lg text-[#E8DCC0]">How will your documents be executed?</h3>
                <p id="execution-method-help" className="text-sm leading-relaxed text-[#9A9488]">Choose your requested method, then save it. Document review will confirm eligibility for your document, signer location and receiving authority before the route and final pricing are approved.</p>
                <label htmlFor="review-execution-method" className={labelCls}>Execution method</label>
                <select id="review-execution-method" aria-describedby="execution-method-help execution-save-status" className={`${inputCls} scroll-mt-28`} value={executionDraft} onChange={(e) => { setExecutionDraft(e.target.value as FormState["executionType"]); setSaveNotice(""); }}>
                  <option value="">Select an execution method</option>
                  <option value="RON">Remote online notarization</option>
                  <option value="InPerson">In-person notarization</option>
                  <option value="None">No notarization required — authentication only</option>
                  <option value="Unsure">Not sure — request document review</option>
                </select>
                <button id="save-execution-method" type="button" onClick={saveExecutionMethod} className={`${secondaryCls} w-full`}>Save execution method</button>
                <p id="execution-save-status" role="status" className="text-sm leading-relaxed text-[#9A9488]">{saveNotice || (executionDraft !== form.executionType ? "Unsaved change. Save your execution method to update this request." : form.executionType ? "Saved preference restored. Document review is still required before an authorized route and quote are issued." : "No method saved yet. Choose a method or request document review.")}</p>
                <p className="text-xs leading-relaxed text-[#9A9488]">{draftStorageAvailable ? "Your draft is saved in this tab for up to 24 hours. Reattach documents after a reload; files and consent are not saved." : "Browser storage is unavailable. Keep this page open until you submit; your selection cannot be restored after reload."}</p>
              </section>

              <details className="mb-6 rounded-sm border border-[rgba(198,165,90,0.14)] bg-[#0A0A0A] p-4" open>
                <summary className="min-h-11 cursor-pointer text-sm text-[#E8DCC0]">Edit Matter details</summary>
                <div className="mt-3 grid min-w-0 gap-4">
                  <div><label htmlFor="review-document-title" className={labelCls}>Exact document title</label><input id="review-document-title" className={inputCls} value={form.documentType || classification.documentType || ""} onChange={(e) => setField("documentType", e.target.value)} /></div>
                  <div><label htmlFor="review-document-count" className={labelCls}>Number of documents</label><input id="review-document-count" type="number" min="1" className={inputCls} value={form.documentCount || classification.documentCount} onChange={(e) => setField("documentCount", Math.max(1, Number(e.target.value)))} /></div>
                  {plan.international && (<div><label htmlFor="review-origin" className={labelCls}>Issuing state / authority</label><input id="review-origin" className={inputCls} value={form.originState} onChange={(e) => setField("originState", e.target.value)} /></div>)}
                  {plan.execution && (<div><label htmlFor="review-signer-location" className={labelCls}>Signer physical location</label><input id="review-signer-location" className={inputCls} value={form.signerLocation} onChange={(e) => setField("signerLocation", e.target.value)} placeholder="City, state and country" /></div>)}
                  {plan.international && (<div><label htmlFor="review-destination" className={labelCls}>Destination country</label><select id="review-destination" className={inputCls} value={form.destinationCountry} onChange={(e) => setField("destinationCountry", e.target.value)}><option value="">Select destination</option>{Array.from(new Set([...COUNTRIES, ...(form.destinationCountry ? [form.destinationCountry] : [])])).map((country) => <option key={country}>{country}</option>)}</select></div>)}
                  {plan.international && (<div><label htmlFor="review-apostille" className={labelCls}>Apostille / authentication request</label><select id="review-apostille" className={inputCls} value={form.apostilleChoice} onChange={(e) => setField("apostilleChoice", e.target.value as FormState["apostilleChoice"])}><option value="">Confirm during review</option><option value="yes">Apostille requested — subject to authority review</option><option value="no">No apostille requested</option><option value="unsure">Not sure — confirm during review</option></select></div>)}
                  {plan.international && (<div><label htmlFor="review-translation" className={labelCls}>Translation request</label><select id="review-translation" className={inputCls} value={form.translationChoice} onChange={(e) => setField("translationChoice", e.target.value as FormState["translationChoice"])}><option value="">Confirm during review</option><option value="yes">Translation requested</option><option value="no">No translation requested</option><option value="unsure">Not sure — confirm during review</option></select></div>)}
                </div>
              </details>

              <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.14)] bg-[#0A0A0A] px-4 py-5">
                <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/60">Execution Path</div>
                <p className="text-[12px] font-light leading-relaxed text-[#9A9488]">Document review → originating-authority verification → apostille / authentication route confirmation → submission → quality review → delivery</p>
              </div>

              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="review-timeline" className={labelCls}>Preferred execution timeline <span className="text-[var(--ms-gold)]">*</span></label>
                  <select id="review-timeline" value={form.timelineChoice} onChange={(e) => setField("timelineChoice", e.target.value as TimelineChoice)} className={inputCls}>
                    <option value="">— Select timeline —</option>
                    <option value="standard">Standard</option>
                    <option value="expedited">Expedited</option>
                    <option value="urgent">Urgent / Same-Day</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="review-delivery" className={labelCls}>Delivery method <span className="text-[var(--ms-gold)]">*</span></label>
                  <select id="review-delivery" value={form.deliveryChoice} onChange={(e) => setField("deliveryChoice", e.target.value as DeliveryChoice)} className={inputCls}>
                    <option value="">— Select delivery —</option>
                    <option value="digital">Digital return</option>
                    <option value="domestic_courier">Domestic courier</option>
                    <option value="international_courier">International courier</option>
                  </select>
                </div>
              </div>

              {outstanding.length > 0 && (
                <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.28)] bg-[rgba(198,165,90,0.04)] px-5 py-5">
                  <div className="mb-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/80">Requirements Still Needed</div>
                  <ul className="space-y-2">
                    {outstanding.map((item) => (
                      <li key={item} className="flex flex-wrap items-center gap-2 text-[13px] font-light text-[#E8DCC0]"><span className="min-w-0 flex-1">{item}</span><button type="button" className={secondaryCls} onClick={() => focusField(requirementField(item))}>Complete detail</button></li>
                    ))}
                  </ul>
                  <p className="mt-4 text-[11px] font-light text-[#9A9488]">Complete these details using the controls above. If you are unsure about execution, select “Not sure — request document review” and save it; our team will confirm the route before payment.</p>
                </div>
              )}

              {quoteReady && clientPricing.mode === "approved_price" && (
                <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.28)] bg-[rgba(198,165,90,0.06)] px-5 py-6">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">Pro Forma Quote</div>
                  <div className="mt-2 font-serif text-lg text-[#E8DCC0]">{clientPricing.summary}</div>
                  <div className="mt-4 border-t border-[rgba(198,165,90,0.14)] pt-4">
                    <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A9488]">Matter Scope</div>
                    <ul className="space-y-1">
                      {scopeBullets.map((bullet) => (
                        <li key={bullet} className="flex items-start gap-2 text-[12px] font-light text-[#E8DCC0]"><span className="mt-0.5 text-[var(--ms-gold)]/70">•</span>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="mt-5 border-t border-[rgba(198,165,90,0.14)] pt-4">
                    <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#9A9488]">Quote Breakdown</div>
                    <div className="space-y-2">{clientPricing.lineItems.map((item) => (
                      <div key={item.key} className="flex items-start justify-between gap-4 text-[12px] font-light text-[#E8DCC0]"><span>{item.label}</span><span className="shrink-0">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(item.amount)}</span></div>
                    ))}</div>
                  </div>
                  {courtesyCode && <div className="mt-4 flex items-start justify-between gap-4 border-t border-[rgba(198,165,90,0.14)] pt-4 text-[12px]"><span className="text-[#D8C08A]">Courtesy code</span><span className="font-semibold text-[var(--ms-gold)]">{courtesyCode} · validated securely at checkout</span></div>}
                  <div className="mt-5 flex items-baseline justify-between border-t border-[rgba(198,165,90,0.14)] pt-4">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9A9488]">Quoted Investment</span>
                    <span className="text-2xl font-semibold text-white">{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(clientPricing.amount ?? 0)}</span>
                  </div>
                  <p className="mt-3 text-[11px] font-light text-[#9A9488]">Wise secure payment · Scheduling available only after verified payment. Final pricing is confirmed after review.</p>
                </div>
              )}

              {!quoteReady && outstanding.length === 0 && (
                <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.28)] bg-[rgba(198,165,90,0.06)] px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">Quote Status</div>
                  <div className="mt-1 text-lg font-semibold text-white">Ready for review</div>
                  <div className="mt-1 text-[12px] font-light text-[#9A9488]">The Milano Seal will confirm your final execution route and quote.</div>
                </div>
              )}

              <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-sm border border-[rgba(198,165,90,0.16)] bg-[#0A0A0A] p-4 text-sm text-[#E8DCC0]"><input id="review-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" /><span>I understand that all matters are reviewed and payment is required before scheduling or execution.</span></label>
              {error && <p role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => setStep(clarifications.questions.length ? 2 : 1)} className={secondaryCls}><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button>
                <button type="button" onClick={submit} disabled={submitting} className={primaryCls}>{submitting ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Submitting…</> : <>{quoteReady ? "Complete My Order" : "Submit for document review"} <ArrowRight className="ml-2 inline h-4 w-4" /></>}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-center gap-2 text-center text-[10px] uppercase tracking-[0.1em] text-[rgba(198,165,90,0.48)]"><Check className="h-3 w-3" />Payment-gated scheduling · Secure Matter intake</div>
    </div>
  );
}
