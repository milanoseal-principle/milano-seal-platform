"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { SmartMatterIntake } from "@/components/intake/SmartMatterIntake";
import { FileUploadZone } from "@/components/intake/FileUploadZone";
import type { MatterAnalysis } from "@/lib/intake/matterAnalysis";
import { classifyIntake, type AiExtraction } from "@/lib/intake/smartClassification";
import { buildIntakeClarifications } from "@/lib/intake/intakeClarifications";
import Link from "next/link";
import { SERVICE_ENTRIES, normalizeServiceIntent, serviceIntentLabel } from "@/lib/intake/serviceIntent";
import { commercialHref } from "@/lib/conversion/commercialCta";
import { getSmartIntakeQuestionPlan } from "@/lib/intake/questionPlan";
import type { ConciergeServiceIntent } from "@/lib/acquisition/concierge-service-intents";

import { buildIntakeAnalyticsPayload, type IntakeAnalyticsEvent } from "@/lib/intake/intakeAnalytics";
import {
  documentIdentityLabel,
  isQuoteReady,
  outstandingRequirements,
  serviceStateLabel,
  type DeliveryChoice,
  type TimelineChoice,
} from "@/lib/intake/reviewReadiness";

import { INTAKE_DRAFT_KEY, intakeFormSchema, intakeAnalysisSchema, restoreIntakeDraft, type IntakeFormState as FormState } from "@/lib/intake/intakeDraft";

interface IntakePrefill {
  country?: string;
  document?: string;
  useCase?: string;
  matter?: string;
}

interface Props {
  initialServiceIntent?: ConciergeServiceIntent;
  initialServiceIntentSource?: "link" | "default";
  initialTier?: "signature" | "priority" | "executive";
  prefill?: IntakePrefill;
  courtesyCode?: string;
  /** Governed professional handoff (verified server-side, never trusted here). */
  professionalReferral?: { profileId: string; reference: string };
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

export function SmartIntakeSOPWizard({ initialServiceIntent = "unsure", initialServiceIntentSource = "default", initialTier = "priority", prefill, courtesyCode, professionalReferral }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<FormState>({
    ...INITIAL,
    serviceIntent: initialServiceIntent, serviceIntentSource: initialServiceIntentSource, detailStep: 0,
    destinationCountry: prefill?.country || "",
    documentType: prefill?.document?.replace(/-/g, " ") || "",
    description: prefill?.matter ? prefill.matter.replace(/_/g, " ") : "",
  });
  const [analysis, setAnalysis] = useState<AiExtraction | null>(null);
  const [files, setFiles] = useState<File[]>([]);
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
  const submissionLock = useRef(false);
  const reviewViewedRef = useRef(false);
  const intentTrackedRef = useRef(false);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  useEffect(() => {
    try {
      const draft = restoreIntakeDraft(sessionStorage.getItem(INTAKE_DRAFT_KEY), draftContext);
      if (draft) { setForm({ ...draft.form, serviceIntent: draft.form.serviceIntent ?? initialServiceIntent }); setAnalysis(draft.analysis ?? null); setExecutionDraft(draft.form.executionType); setStep(draft.step); }
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

  const classification = useMemo(() => classifyIntake({
    text: form.description,
    structured: {
      documentType: form.documentType || undefined,
      documentCount: form.documentCount > 0 ? form.documentCount : undefined,
      signerCount: form.signerCount > 0 ? form.signerCount : undefined,
      originState: form.originState || undefined,
      signerLocation: form.signerLocation || undefined,
      destinationCountry: form.destinationCountry || undefined,
      notarization: form.notarizationChoice === "already" ? "already_completed" : form.notarizationChoice === "yes" ? true : form.notarizationChoice === "no" ? false : undefined,
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

  const rawClarifications = useMemo(() => buildIntakeClarifications(classification), [classification]);
  const questionPlan = getSmartIntakeQuestionPlan({ intent: form.serviceIntent, description: form.description, internationalUse: form.internationalUse, classification, questions: rawClarifications.questions });
  const clarifications = { ...rawClarifications, questions: questionPlan.questions };
  // Public intake never imports private pricing rules. The canonical server
  // reviews the Matter and issues its private quote through the existing flow.
  const clientPricing = { mode: "quote_after_review", amount: undefined as number | undefined };
  const detailIndex = Math.min(form.detailStep ?? 0, questionPlan.detailSteps.length - 1);
  const detail = questionPlan.detailSteps[detailIndex];
  useEffect(() => { if (step === 2) document.getElementById("intake-detail-heading")?.focus({preventScroll:true}); }, [step, detailIndex]);
  const selectService = (value: string) => {
    const intent = normalizeServiceIntent(value);
    setForm(prev => ({ ...prev, serviceIntent: intent, serviceIntentSource: "intake", serviceIntentSelectedAt: new Date().toISOString(), detailStep: 0 }));
    track("service_intent_selected", { serviceIntent: intent });
  };

  const outstanding = useMemo(
    () =>
      outstandingRequirements({
        classification,
        timeline: form.timelineChoice,
        delivery: form.deliveryChoice,
        pricingApproved: clientPricing.mode === "approved_price" && !form.executionType,
        executionReviewRequested: Boolean(form.executionType),
      }).filter(item => item === "Preferred execution timeline" || (questionPlan.showDelivery && item === "Delivery method")),
    [classification, form.timelineChoice, form.deliveryChoice, clientPricing.mode, form.executionType, questionPlan.showDelivery],
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

  const track = (event: IntakeAnalyticsEvent, metadata: Record<string, unknown> = {}, id?: string) => {
    try {
      const payload = buildIntakeAnalyticsPayload(event, { serviceIntent: form.serviceIntent ?? initialServiceIntent, ...metadata }, id || matterId || undefined);
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

  useEffect(() => {
    if (!draftReady || intentTrackedRef.current) return;
    intentTrackedRef.current = true;
    if (form.serviceIntentSource === "link") track("service_intent_selected", {serviceIntent: form.serviceIntent ?? initialServiceIntent});
  }, [draftReady]);

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

  const continueFromStep1 = () => {
    markStarted();
    if (!form.description.trim()) return setError("Tell us what you need before continuing.");

    track("description_completed", { documentFamily: classification.documentFamily, destinationCountry: classification.destinationCountry });
    track("step_1_completed", { questionCount: clarifications.questions.length });
    setStep(2);
    setField("detailStep", 0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
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
    if (submissionLock.current || submittedRef.current || form.submissionOutcome === "unknown") return;
    submissionLock.current = true;
    setSubmitting(true);
    setError(null);
    markStarted();

    const payload = {
      source_channel: "Website Form",
      service_intent: form.serviceIntent ?? initialServiceIntent,
      service_intent_source: form.serviceIntentSource ?? initialServiceIntentSource,
      service_intent_selected_at: form.serviceIntentSelectedAt,
      witness_context: form.witnessContext,
      requested_service_location: form.mobileAddress,
      receiving_authority: form.receivingAuthority,
      company_name: form.firm,
      professional_country: form.professionalCountry,
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
      country: classification.destinationCountry || "Not yet confirmed",
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
      notes: form.executionType === "InPerson" && form.mobileAddress ? `Requested in-person location: ${form.mobileAddress}` : "",
      courier_required: form.courierRequired ? "yes" : undefined,
      name_match: true,
      files_uploaded: files.length > 0,
      courtesy_code: courtesyCode || undefined,
      professional_profile_id: professionalReferral?.profileId,
      referral_reference: professionalReferral?.reference,
    };

    let safeToRetry = false;
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await response.json();
      if (!response.ok) { safeToRetry = response.status === 400 && json.code === "VALIDATION_FAILED"; throw new Error(json.error || "Failed to submit"); }
      const id = json.deal?.id || json.deal_id;
      if (!id) throw new Error("Matter was created without an identifier");
      setMatterId(id);
      submittedRef.current = true;
      try { sessionStorage.removeItem(INTAKE_DRAFT_KEY); } catch {}
      track("intake_submitted", { uploadCount: files.length, pricingState: clientPricing.mode }, id);

      try {
        if (json.payment_link) sessionStorage.setItem("ms_payment_link", json.payment_link);
        if (json.wise_invoice) sessionStorage.setItem("ms_wise_invoice", JSON.stringify(json.wise_invoice));
        sessionStorage.setItem("ms_intake_response", JSON.stringify(json));
      } catch { /* A saved Matter must not become a failed intake because browser storage is unavailable. */ }

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
      setError(safeToRetry ? (cause instanceof Error ? cause.message : "Please check your details.") : "We couldn’t confirm whether your request was saved. Please speak with Nicholas before submitting again so we can check for an existing request.");
      if (!safeToRetry) setForm(previous => ({...previous,submissionOutcome:"unknown"}));
      setSubmitting(false);
      submissionLock.current = !safeToRetry;
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

  const progressCurrent = step === 1 ? 1 : step === 2 ? detailIndex + 2 : questionPlan.detailSteps.length + 2;
  const progressTotal = questionPlan.detailSteps.length + 2;
  const progress = progressCurrent / progressTotal * 100;
  const nextDetail = () => {
    setError(null);
    if (detail === "contact") {
      if (!form.name.trim()) { setError("Your name is required."); focusField("intake-name"); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Enter a valid email address."); focusField("intake-email"); return; }
      if (!form.timelineChoice) { setError("Choose your preferred timing."); focusField("intake-timeline"); return; }
    }
    if (detailIndex + 1 === questionPlan.detailSteps.length) { track("step_2_completed"); setStep(3); }
    else setField("detailStep", detailIndex + 1);
  };

  return (
    <div className="mx-auto min-w-0 w-full max-w-2xl pb-[calc(2rem+env(safe-area-inset-bottom))]">
      <div className="mb-8" aria-label="Intake progress">
        <p role="status" aria-live="polite" className="mb-3 text-sm text-[#9A9488]">Step {progressCurrent} of {progressTotal}: {step === 1 ? "Your document" : step === 3 ? "Review" : detail === "signers" ? "Signer details" : detail === "use" ? "Document use" : "Timing & contact"}</p>
        <div role="progressbar" aria-label="Intake completion" aria-valuemin={1} aria-valuemax={progressTotal} aria-valuenow={progressCurrent} className="h-1 bg-[rgba(198,165,90,0.14)]"><div className="h-1 bg-[var(--ms-gold)] motion-safe:transition-all" style={{ width: `${progress}%` }} /></div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-[rgba(198,165,90,0.28)] bg-[linear-gradient(180deg,rgba(13,13,15,.97),rgba(7,7,8,.99))] shadow-[0_30px_80px_rgba(0,0,0,.55)]">
        <div className="px-5 py-7 sm:px-10 sm:py-10">
          {step === 1 && (
            <>
              <h2 className="mb-1 font-serif text-2xl text-[#E8DCC0]">Tell Us What You Need</h2>
              <p className="mb-7 text-[12px] font-light tracking-[0.04em] text-[#9A9488]">Start with your document. You can change your request without losing the details you have entered.</p>

              <div className="mb-6"><label htmlFor="service-intent" className={labelCls}>What do you need help with?</label><select id="service-intent" className={inputCls} value={form.serviceIntent ?? initialServiceIntent} onChange={event => selectService(event.target.value)}>{SERVICE_ENTRIES.map(entry => <option key={entry.intent} value={entry.intent}>{entry.label}</option>)}<option value="authentication">Authentication / legalization review</option></select><p className="mt-2 text-sm text-[#9A9488]">Your request guides the questions. We’ll review the document before confirming requirements and pricing.</p></div>
              <SmartMatterIntake onAnalysisReady={handleAnalysisReady} onFilesPicked={(picked) => { markStarted(); setFiles((prev) => [...prev, ...picked.filter((file) => !prev.some((existing) => fileKey(existing) === fileKey(file)))].slice(0, 10)); }} initialMessage={form.description} />

              <div className="mt-6">
                <label htmlFor="intake-description" className={labelCls}>Describe your matter <span className="text-[var(--ms-gold)]">*</span></label>
                <textarea id="intake-description" value={form.description} onFocus={markStarted} onChange={(e) => setField("description", e.target.value)} rows={4} placeholder={questionPlan.domestic ? "Tell us about the document and what you need done." : "What do you need done with the document, and where will it be used?"} className={`${inputCls} min-h-28 resize-none`} />
              </div>

              <div className="mt-5"><label htmlFor="intake-document-type" className={labelCls}>Document title or type (if known)</label><input id="intake-document-type" className={inputCls} value={form.documentType} onChange={event => setField("documentType", event.target.value)} placeholder="For example, affidavit or power of attorney" /></div>
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
                  {questionPlan.showDestination && <ReviewRow label="Destination" value={classification.destinationCountry || "Not yet confirmed"} />}
                  <ReviewRow label="Requested service" value={form.executionType === "RON" ? "Remote Online Notarization" : form.executionType === "InPerson" ? "In-person Notarization" : classification.notarization === "required" ? "Notarization" : "To be confirmed"} />
                  <ReviewRow label="Already completed" value={classification.notarization === "already_completed" ? "Notarization" : classification.apostille === "already_completed" ? "Apostille" : "None confirmed"} />
                  <ReviewRow label="Potential requirements" value={classification.manualReviewReasons.length ? "Additional route review may be required" : "No additional requirements confirmed yet"} />
                </div>
              )}


              {error && <p id="intake-step-error" role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
              <button type="button" onClick={continueFromStep1} className={`${primaryCls} mt-7`}>Continue <ArrowRight className="ml-2 inline h-4 w-4" /></button>
            </>
          )}

          {step === 2 && (
            <section aria-labelledby="intake-detail-heading">
              <h2 tabIndex={-1} id="intake-detail-heading" className="mb-5 font-serif text-2xl text-[#E8DCC0]">{detail === "signers" ? "Who is signing?" : detail === "use" ? "Where will your document be used?" : "Timing & contact"}</h2>
              {detail === "signers" && <div className="space-y-5">
                <div><label htmlFor="intake-signers" className={labelCls}>How many people will sign?</label><input id="intake-signers" type="number" min="1" max="10000" className={inputCls} value={form.signerCount || ""} onChange={event => setField("signerCount", Math.max(0, Number(event.target.value)))} /></div>
                <div><label htmlFor="intake-signer-location" className={labelCls}>Where will the signer or signers be physically located?</label><input id="intake-signer-location" className={inputCls} value={form.signerLocation} onChange={event => setField("signerLocation", event.target.value)} placeholder="City, state and country, or not yet known" /></div>
                {questionPlan.showServiceLocation && <div><label htmlFor="intake-service-location" className={labelCls}>Where would you like the notary to meet you?</label><input id="intake-service-location" className={inputCls} value={form.mobileAddress} onChange={event => setField("mobileAddress", event.target.value)} placeholder="Requested location — availability subject to review" /></div>}
                <div><label htmlFor="intake-witness-context" className={labelCls}>What does your document say about witnesses?</label><textarea id="intake-witness-context" className={inputCls} value={form.witnessContext ?? ""} onChange={event => setField("witnessContext", event.target.value)} placeholder="Copy the wording, or tell us you’re not sure. We’ll review the requirement." /></div>
                <div><label htmlFor="intake-international-use" className={labelCls}>Will the document be used outside the United States?</label><select id="intake-international-use" className={inputCls} value={form.internationalUse === undefined ? "" : String(form.internationalUse)} onChange={event => setField("internationalUse", event.target.value === "true")}><option value="">Not yet known</option><option value="false">No</option><option value="true">Yes — add document-use details</option></select></div>
              </div>}
              {detail === "use" && <div className="space-y-5">
                <div><label htmlFor="intake-destination" className={labelCls}>Where will the document be used? (if known)</label><select id="intake-destination" className={inputCls} value={form.destinationCountry} onChange={event => setField("destinationCountry", event.target.value)}><option value="">Not sure — review with Milano</option>{COUNTRIES.map(country => <option key={country}>{country}</option>)}</select></div>
                {questionPlan.showOrigin && <div><label htmlFor="intake-origin" className={labelCls}>Where was the document issued?</label><input id="intake-origin" className={inputCls} value={form.originState} onChange={event => setField("originState", event.target.value)} placeholder="Issuing state, country or authority, if known" /></div>}
                {questionPlan.showAuthority && <div><label htmlFor="intake-receiving-authority" className={labelCls}>Who will receive it? (if known)</label><input id="intake-receiving-authority" className={inputCls} value={form.receivingAuthority ?? ""} onChange={event => setField("receivingAuthority", event.target.value)} /></div>}
                <div><label htmlFor="intake-signed" className={labelCls}>Has the document already been signed or notarized?</label><select id="intake-signed" className={inputCls} value={form.notarizationChoice} onChange={event => setField("notarizationChoice", event.target.value as FormState["notarizationChoice"])}><option value="">Not sure — please review</option><option value="already">Already notarized</option><option value="yes">I am requesting a new notarization</option><option value="unsure">Signed, but notarization status is unclear</option></select></div>
                <p className="text-sm text-[#9A9488]">Unknown requirements stay with our document review team. Your answers do not establish eligibility or legal requirements.</p>
              </div>}
              {detail === "contact" && <>
                <div><label htmlFor="intake-timeline" className={labelCls}>When do you need it?</label><select id="intake-timeline" className={inputCls} value={form.timelineChoice} onChange={event => setField("timelineChoice", event.target.value as TimelineChoice)}><option value="">Select preferred timing</option><option value="standard">Standard</option><option value="expedited">Expedited</option><option value="urgent">Urgent / same-day review</option></select></div>
                <div className="mt-4"><label htmlFor="intake-deadline" className={labelCls}>Desired date / time or deadline (if known)</label><input id="intake-deadline" className={inputCls} value={form.deadline} onChange={event => setField("deadline", event.target.value)} placeholder="Date, time and time zone" /></div>
                {questionPlan.professional && <div className="mt-4 grid gap-4"><p className="text-sm text-[#9A9488]">You remain counsel. Milano handles the U.S. execution workflow.</p><div><label htmlFor="intake-firm" className={labelCls}>Firm / professional organization</label><input id="intake-firm" className={inputCls} value={form.firm ?? ""} onChange={event => setField("firm", event.target.value)} /></div><div><label htmlFor="intake-professional-country" className={labelCls}>Your country</label><input id="intake-professional-country" className={inputCls} value={form.professionalCountry ?? ""} onChange={event => setField("professionalCountry", event.target.value)} /></div></div>}
              <div className="mt-7 border-t border-[rgba(198,165,90,0.1)] pt-6">
                <div className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--ms-gold)]/70">Your contact</div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label htmlFor="intake-name" className={labelCls}>Name *</label><input id="intake-name" aria-describedby={error ? "intake-step-error" : undefined} aria-invalid={Boolean(error && !form.name.trim())} value={form.name} onFocus={markStarted} onChange={(e) => setField("name", e.target.value)} className={inputCls} autoComplete="name" /></div>
                  <div><label htmlFor="intake-email" className={labelCls}>Email *</label><input id="intake-email" aria-describedby={error ? "intake-step-error" : undefined} aria-invalid={Boolean(error && !form.email.includes("@"))} type="email" value={form.email} onFocus={markStarted} onChange={(e) => setField("email", e.target.value)} className={inputCls} autoComplete="email" /></div>
                </div>
                <div className="mt-4"><label htmlFor="intake-phone" className={labelCls}>Phone <span className="normal-case tracking-normal text-[#9A9488]">(optional)</span></label><input id="intake-phone" type="tel" value={form.phone} onChange={(e) => setField("phone", e.target.value)} className={inputCls} autoComplete="tel" /></div>
              </div>

              </>}
              {error && <p id="intake-step-error" role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-between"><button type="button" className={secondaryCls} onClick={() => { setError(null); if (detailIndex === 0) setStep(1); else setField("detailStep", detailIndex - 1); }}>Back</button><button type="button" className={primaryCls} onClick={nextDetail}>{detailIndex + 1 === questionPlan.detailSteps.length ? "Review request" : "Continue"}</button></div>
            </section>
          )}

          {step === 3 && (
            <>
              <h2 className="mb-1 font-serif text-2xl text-[#E8DCC0]">{questionPlan.domestic ? "Your request" : "Your Matter"}</h2>
              <p className="mb-7 text-[12px] font-light tracking-[0.04em] text-[#9A9488]">Review exactly what we understood before completing your order.</p>

              <div className="mb-6 overflow-hidden rounded-sm border border-[rgba(198,165,90,0.14)] bg-[#0A0A0A]">
                <div className="border-b border-[rgba(198,165,90,0.1)] px-4 py-2 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/60">Your Matter</div>
                <ReviewRow label="Client request" value={serviceIntentLabel(form.serviceIntent)} />
                <ReviewRow label="Matter Type" value={matterTypeLabel} onEdit={() => edit(classification.apostille === "required" || classification.authentication === "required" ? "apostille" : "notarization")} />
                <ReviewRow label="Documents" value={`${classification.documentCount || files.length || 1} document${(classification.documentCount || files.length || 1) === 1 ? "" : "s"}`} onEdit={() => edit("documents")} />
                <ReviewRow label="Document Titles" value={documentIdentityLabel(classification.documentType)} onEdit={() => edit("matter")} />
                {questionPlan.showDestination && <ReviewRow label="Destination" value={classification.destinationCountry || "Destination confirmation required"} onEdit={() => edit("destination")} />}
                <ReviewRow label="Requested Service" value={classification.apostille === "required" ? "Apostille Coordination" : classification.authentication === "required" ? "Authentication Coordination" : matterTypeLabel} onEdit={() => edit(classification.apostille === "required" || classification.authentication === "required" ? "apostille" : "notarization")} />
                <ReviewRow label="Notarization" value={serviceStateLabel(classification.notarization, "Notarization requested — subject to review")} onEdit={() => edit("notarization")} />
                <ReviewRow label="Remote Online Notarization" value={serviceStateLabel(classification.ron, "Online notarization requested — subject to review")} onEdit={() => edit("notarization")} />
                {questionPlan.international && <ReviewRow label="Apostille / Authentication" value={classification.apostille === "required" ? "Apostille Coordination" : classification.authentication === "required" ? "Authentication Coordination" : serviceStateLabel(classification.apostille, "Apostille Coordination")} onEdit={() => edit("apostille")} />}
                {questionPlan.international && <ReviewRow label="Translation" value={serviceStateLabel(classification.translation, "Translation required")} onEdit={() => edit("translation")} />}
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
                  {questionPlan.international && <div><label htmlFor="review-origin" className={labelCls}>Issuing state / authority</label><input id="review-origin" className={inputCls} value={form.originState} onChange={(e) => setField("originState", e.target.value)} /></div>}
                  <div><label htmlFor="review-signer-location" className={labelCls}>Signer physical location</label><input id="review-signer-location" className={inputCls} value={form.signerLocation} onChange={(e) => setField("signerLocation", e.target.value)} placeholder="City, state and country" /></div>
                  {questionPlan.international && <div><label htmlFor="review-destination" className={labelCls}>Destination country</label><select id="review-destination" className={inputCls} value={form.destinationCountry} onChange={(e) => setField("destinationCountry", e.target.value)}><option value="">Select destination</option>{Array.from(new Set([...COUNTRIES, ...(form.destinationCountry ? [form.destinationCountry] : [])])).map((country) => <option key={country}>{country}</option>)}</select></div>}
                  {questionPlan.international && <div><label htmlFor="review-apostille" className={labelCls}>Apostille / authentication request</label><select id="review-apostille" className={inputCls} value={form.apostilleChoice} onChange={(e) => setField("apostilleChoice", e.target.value as FormState["apostilleChoice"])}><option value="">Confirm during review</option><option value="yes">Apostille requested — subject to authority review</option><option value="no">No apostille requested</option><option value="unsure">Not sure — confirm during review</option></select></div>}
                  {questionPlan.international && <div><label htmlFor="review-translation" className={labelCls}>Translation request</label><select id="review-translation" className={inputCls} value={form.translationChoice} onChange={(e) => setField("translationChoice", e.target.value as FormState["translationChoice"])}><option value="">Confirm during review</option><option value="yes">Translation requested</option><option value="no">No translation requested</option><option value="unsure">Not sure — confirm during review</option></select></div>}
                </div>
              </details>

              <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.14)] bg-[#0A0A0A] px-4 py-5">
                <div className="mb-3 text-[9px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/60">Execution Path</div>
                <p className="text-[12px] font-light leading-relaxed text-[#9A9488]">{questionPlan.international ? "Document review → authority and route confirmation → private quote → execution → quality review → delivery" : "Document review → confirmed service and private quote → execution coordination → secure document return"}</p>
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
                {questionPlan.showDelivery && <div>
                  <label htmlFor="review-delivery" className={labelCls}>Delivery method <span className="text-[var(--ms-gold)]">*</span></label>
                  <select id="review-delivery" value={form.deliveryChoice} onChange={(e) => setField("deliveryChoice", e.target.value as DeliveryChoice)} className={inputCls}>
                    <option value="">— Select delivery —</option>
                    <option value="digital">Digital return</option>
                    <option value="domestic_courier">Domestic courier</option>
                    <option value="international_courier">International courier</option>
                  </select>
                </div>}
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

              {!quoteReady && outstanding.length === 0 && (
                <div className="mb-6 rounded-sm border border-[rgba(198,165,90,0.28)] bg-[rgba(198,165,90,0.06)] px-5 py-5">
                  <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--ms-gold)]/70">Quote Status</div>
                  <div className="mt-1 text-lg font-semibold text-white">Ready for review</div>
                  <div className="mt-1 text-[12px] font-light text-[#9A9488]">The Milano Seal will confirm your final execution route and quote.</div>
                </div>
              )}

              {form.submissionOutcome === "unknown" && <p role="status" className="mb-4 text-sm text-amber-200">Your previous submission needs confirmation. Speak with Nicholas below before submitting again.</p>}
              <label className="flex min-h-14 cursor-pointer items-start gap-3 rounded-sm border border-[rgba(198,165,90,0.16)] bg-[#0A0A0A] p-4 text-sm text-[#E8DCC0]"><input id="review-consent" type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-1 h-4 w-4" /><span>I understand that all matters are reviewed and payment is required before scheduling or execution.</span></label>
              {error && <p id="intake-step-error" role="alert" className="mt-4 text-sm text-red-300">{error}</p>}
              <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <button type="button" onClick={() => { setField("detailStep", questionPlan.detailSteps.length - 1); setStep(2); }} className={secondaryCls}><ArrowLeft className="mr-2 inline h-4 w-4" />Back</button>
                <button type="button" onClick={submit} disabled={submitting || form.submissionOutcome === "unknown"} className={primaryCls}>{submitting ? <><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Submitting…</> : <>{quoteReady ? "Complete My Order" : "Submit for document review"} <ArrowRight className="ml-2 inline h-4 w-4" /></>}</button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-[var(--ms-gold)]"><Link href={commercialHref("get_pricing", {serviceIntent:form.serviceIntent,source:"intake-fallback"})}>Not ready? Get pricing</Link><Link href={commercialHref("speak", {serviceIntent:form.serviceIntent,source:"intake-fallback"})}>Speak with Nicholas</Link></div>
      <div className="mt-6 flex items-center justify-center gap-2 text-center text-[10px] uppercase tracking-[0.1em] text-[rgba(198,165,90,0.48)]"><Check className="h-3 w-3" />Payment-gated scheduling · Secure Matter intake</div>
    </div>
  );
}
