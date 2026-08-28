"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Circle,
  MessageCircle,
  ShieldCheck,
  X,
} from "lucide-react";
import {
  HAGUE_PROFESSIONAL_DESTINATIONS,
  PROFESSIONAL_DOCUMENT_OPTIONS,
  buildAttorneyJourney,
  getProfessionalDestination,
  getProfessionalDocumentLabel,
  type OriginPosture,
  type ProfessionalDocumentClass,
  type SignerPosture,
} from "@/lib/professional/universal-attorney-journey";
import {
  PROFESSIONAL_SESSION_EVENT,
  readProfessionalSession,
  sanitizeProfessionalSession,
  writeProfessionalSession,
  type ProfessionalSessionState,
} from "@/lib/professional/professional-session";

interface Message {
  role: "user" | "assistant";
  text: string;
}

interface PageContext {
  label: string;
  chips: string[];
  progress: string[];
  activeProgressIndex: number;
}

interface PortalSafeDeal {
  matter_id?: string;
  display_id?: string;
  matter_status?: string;
  client_facing_status?: string;
  destination_country?: string;
  document_type?: string;
  payment_status?: string;
}

type CopilotMode = "chat" | "preflight";

const ORIGINS: Array<{ value: OriginPosture; label: string }> = [
  { value: "florida", label: "Florida" },
  { value: "other_us_state", label: "Another U.S. state / territory" },
  { value: "federal", label: "U.S. federal authority" },
  { value: "unknown", label: "Not sure yet" },
];

const SIGNERS: Array<{ value: SignerPosture; label: string }> = [
  { value: "us", label: "Signer in the United States" },
  { value: "international", label: "Signer outside the United States" },
  { value: "multiple", label: "Multiple signers / locations" },
  { value: "not_applicable", label: "No signer / public record" },
  { value: "unknown", label: "Not sure yet" },
];

const PORTAL_STAGE_INDEX: Record<string, number> = {
  new: 0,
  intake_received: 0,
  under_review: 0,
  compliance_review: 0,
  needs_info: 0,
  quoted: 1,
  awaiting_payment: 1,
  payment_confirmed: 2,
  scheduled: 2,
  in_execution: 2,
  apostille_processing: 3,
  courier_ready: 4,
  shipped: 4,
  delivered: 4,
  completed: 4,
  closed: 4,
};

function slugFromPathname(pathname: string): string | undefined {
  const match = pathname.match(/^\/(?:countries|professional)\/([a-z0-9-]+)(?:\/|$)/i);
  return match?.[1]?.toLowerCase();
}

function destinationFromQuery(value: string | null): string | undefined {
  if (!value) return undefined;
  const normalized = value.trim().toLowerCase();
  const bySlug = getProfessionalDestination(normalized);
  if (bySlug) return bySlug.slug;
  return HAGUE_PROFESSIONAL_DESTINATIONS.find(
    (destination) => destination.name.toLowerCase() === normalized,
  )?.slug;
}

function contextForLocation(
  pathname: string,
  portalDeal: PortalSafeDeal | null,
  session: ProfessionalSessionState,
): PageContext {
  if (pathname.startsWith("/pricing")) {
    return {
      label: "Execution Quote",
      chips: ["How is my quote built?", "Which execution lane fits?", "Start a Matter", "Payment process"],
      progress: ["Scope", "Route", "Quote", "Payment", "Execution"],
      activeProgressIndex: 0,
    };
  }

  if (pathname.startsWith("/process")) {
    return {
      label: "Execution Process",
      chips: ["Show my next step", "Explain the payment gate", "Apostille stage", "Start a Matter"],
      progress: ["Intake", "Review", "Payment", "Execution", "Release"],
      activeProgressIndex: 0,
    };
  }

  if (pathname.startsWith("/portal")) {
    const matterLabel = portalDeal?.display_id || portalDeal?.matter_id;
    const detail = [portalDeal?.destination_country, portalDeal?.document_type].filter(Boolean).join(" · ");
    return {
      label: matterLabel ? `${matterLabel}${detail ? ` · ${detail}` : ""}` : "Secure Matter Portal",
      chips: ["What is my Matter status?", "What happens next?", "Explain my current stage", "Request Milano review"],
      progress: ["Matter", "Payment", "Execution", "Authentication", "Release"],
      activeProgressIndex: Math.max(0, Math.min(4, PORTAL_STAGE_INDEX[portalDeal?.matter_status || ""] ?? 0)),
    };
  }

  const destination = getProfessionalDestination(session.destinationSlug);
  const documentLabel = session.documentClass
    ? getProfessionalDocumentLabel(session.documentClass)
    : undefined;
  const label = [destination?.name, documentLabel].filter(Boolean).join(" · ");
  const completed = [
    session.destinationSlug,
    session.documentClass,
    session.origin && session.origin !== "unknown" ? session.origin : undefined,
    session.signer && session.signer !== "unknown" ? session.signer : undefined,
  ].filter(Boolean).length;

  if (pathname.startsWith("/countries") || pathname.startsWith("/map") || pathname.startsWith("/professional")) {
    return {
      label: label || (pathname.startsWith("/professional") ? "International Professional Execution" : "Global Document Intelligence"),
      chips: [
        destination ? `Review the ${destination.name} route` : "Check a country",
        "Pre-flight my Matter",
        "Common rejection risks",
        "Start secure intake",
      ],
      progress: ["Destination", "Document", "Origin", "Signer", "Operator review"],
      activeProgressIndex: Math.min(4, completed),
    };
  }

  return {
    label: label || "Global Document Intelligence",
    chips: ["Review my document route", "Check a country", "Pre-flight my Matter", "Start secure intake"],
    progress: ["Destination", "Document", "Origin", "Signer", "Operator review"],
    activeProgressIndex: Math.min(4, completed),
  };
}

function ProgressStrip({ items, activeIndex }: { items: string[]; activeIndex: number }) {
  return (
    <div className="grid grid-cols-5 gap-1.5" aria-label="Current execution progress">
      {items.map((item, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={item} className="min-w-0">
            <div
              className={`h-1 rounded-full transition-colors ${
                complete ? "bg-emerald-400/70" : active ? "bg-[var(--ms-gold)]" : "bg-white/[0.07]"
              }`}
            />
            <p className={`mt-1.5 truncate text-[10px] ${complete ? "text-emerald-300/55" : active ? "text-[var(--ms-gold)]/80" : "text-white/25"}`}>
              {item}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function PreflightSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">{label}</span>
      <span className="relative block">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="min-h-12 w-full appearance-none rounded-xl border border-white/[0.08] bg-[#0B0B0E] px-3 pr-9 text-[15px] text-white/74 outline-none focus:border-[var(--ms-gold)]/35"
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/25" />
      </span>
    </label>
  );
}

export function MilanoExecutionCopilot() {
  const pathname = usePathname() || "/";
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<CopilotMode>("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalDeal, setPortalDeal] = useState<PortalSafeDeal | null>(null);
  const [professionalSession, setProfessionalSession] = useState<ProfessionalSessionState>({ version: 1 });
  const [receivingAuthority, setReceivingAuthority] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const stored = readProfessionalSession();
    const pathnameSlug = slugFromPathname(pathname);
    const querySlug =
      destinationFromQuery(searchParams.get("destination")) ||
      destinationFromQuery(searchParams.get("country"));
    const destinationSlug = pathnameSlug || querySlug || stored.destinationSlug;
    const documentCandidate = searchParams.get("document_type") || searchParams.get("document");
    const validDocument = PROFESSIONAL_DOCUMENT_OPTIONS.some((option) => option.value === documentCandidate)
      ? (documentCandidate as ProfessionalDocumentClass)
      : stored.documentClass;
    const next = sanitizeProfessionalSession({
      ...stored,
      destinationSlug,
      documentClass: validDocument,
      version: 1,
    });
    setProfessionalSession(next);
    if (pathnameSlug || querySlug || validDocument !== stored.documentClass) {
      writeProfessionalSession({
        destinationSlug: next.destinationSlug,
        documentClass: next.documentClass,
      });
    }
  }, [pathname, searchParams]);

  useEffect(() => {
    const onSession = (event: Event) => {
      setProfessionalSession(sanitizeProfessionalSession((event as CustomEvent<unknown>).detail));
    };
    window.addEventListener(PROFESSIONAL_SESSION_EVENT, onSession);
    return () => window.removeEventListener(PROFESSIONAL_SESSION_EVENT, onSession);
  }, []);

  useEffect(() => {
    if (!pathname.startsWith("/portal")) {
      setPortalDeal(null);
      return;
    }
    let cancelled = false;
    void fetch("/api/portal/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = (await response.json()) as { deal?: PortalSafeDeal | null };
        return body.deal ?? null;
      })
      .then((deal) => {
        if (!cancelled) setPortalDeal(deal);
      })
      .catch(() => {
        if (!cancelled) setPortalDeal(null);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const journey = useMemo(
    () =>
      buildAttorneyJourney({
        destinationSlug: professionalSession.destinationSlug,
        documentClass: professionalSession.documentClass,
        origin: professionalSession.origin,
        signer: professionalSession.signer,
        receivingAuthority,
      }),
    [professionalSession, receivingAuthority],
  );

  const context = useMemo(
    () => contextForLocation(pathname, portalDeal, professionalSession),
    [pathname, portalDeal, professionalSession],
  );

  const role = pathname.startsWith("/portal") ? "PORTAL" : "PUBLIC";

  const safeAssistantContext = useMemo(() => {
    if (role === "PORTAL") {
      return {
        matter_id: portalDeal?.display_id || portalDeal?.matter_id,
        status: portalDeal?.client_facing_status || portalDeal?.matter_status,
        current_step: portalDeal?.matter_status,
        pathname,
        label: context.label,
      };
    }
    return {
      pathname,
      label: context.label,
      destination_country: journey.destination?.name,
      destination_slug: journey.destination?.slug,
      document_type: professionalSession.documentClass,
      origin: professionalSession.origin,
      signer_posture: professionalSession.signer,
      route_status: journey.status,
    };
  }, [context.label, journey, pathname, portalDeal, professionalSession, role]);

  const updateSession = useCallback(
    (patch: Partial<Omit<ProfessionalSessionState, "version">>) => {
      const next = writeProfessionalSession(patch);
      setProfessionalSession(next);
    },
    [],
  );

  const send = useCallback(
    async (text: string) => {
      const prompt = text.trim();
      if (!prompt || loading) return;
      setMessages((previous) => [...previous, { role: "user", text: prompt }]);
      setInput("");
      setLoading(true);
      try {
        const response = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: prompt, role, context: safeAssistantContext }),
        });
        const data = (await response.json()) as { reply?: string };
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: data.reply || "I can help structure the next operational step for this Matter.",
          },
        ]);
      } catch {
        setMessages((previous) => [
          ...previous,
          {
            role: "assistant",
            text: "The Copilot response service is temporarily unavailable. Your route selections remain in this session and you can continue to secure intake.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, role, safeAssistantContext],
  );

  const startMatter = useCallback(() => {
    router.push(journey.intakeHref);
  }, [journey.intakeHref, router]);

  const requestReview = useCallback(() => {
    if (role === "PORTAL") {
      setMessages((previous) => [
        ...previous,
        {
          role: "assistant",
          text: "Milano operator review can be requested for an active Matter, but this Copilot will not silently modify or submit your Matter. I can help you organize the issue for the execution desk using the authorized Matter context shown here.",
        },
      ]);
      setInput("Please organize the issue I should send to the Milano Execution Desk for human review.");
      setMode("chat");
      return;
    }
    const url = new URL(journey.intakeHref, window.location.origin);
    url.searchParams.set("review_request", "1");
    url.searchParams.set("source", "execution-copilot-review");
    router.push(`${url.pathname}${url.search}`);
  }, [journey.intakeHref, role, router]);

  const handleAction = (chip: string) => {
    const normalized = chip.toLowerCase();
    if (normalized.includes("pre-flight") || normalized.includes("preflight") || normalized.includes("document route")) {
      setMode("preflight");
      return;
    }
    if (normalized.includes("start") && normalized.includes("matter")) {
      startMatter();
      return;
    }
    if (normalized.includes("secure intake")) {
      startMatter();
      return;
    }
    if (normalized.includes("request milano review")) {
      requestReview();
      return;
    }
    void send(chip);
  };

  const empty = messages.length === 0;
  const reviewStatus = journey.status.replaceAll("_", " ");

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+86px)] right-4 z-[80] max-sm:bottom-[calc(env(safe-area-inset-bottom)+76px)] max-sm:right-2">
      <AnimatePresence mode="wait">
        {!open ? (
          <motion.button
            key="copilot-orb"
            type="button"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.04 }}
            onClick={() => {
              setOpen(true);
              window.setTimeout(() => inputRef.current?.focus(), 250);
            }}
            className="group flex items-center gap-2.5 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/60"
            aria-label="Open Milano Execution Copilot"
          >
            <span className="hidden rounded-full border border-[var(--ms-gold)]/22 bg-[#050507]/88 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/78 opacity-0 backdrop-blur-xl transition-opacity group-hover:opacity-100 md:block">
              Execution Copilot
            </span>
            <span className="relative flex h-[72px] w-[72px] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/milano-seal-orb-v2.png"
                alt=""
                width={72}
                height={72}
                className="h-[72px] w-[72px] object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.35)]"
              />
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-[var(--ms-gold)] ring-2 ring-[#050507]" />
            </span>
          </motion.button>
        ) : (
          <motion.section
            key="copilot-panel"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[min(760px,calc(100dvh-7rem))] w-[min(470px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060608]/96 shadow-[0_32px_90px_rgba(0,0,0,0.72)] backdrop-blur-2xl max-sm:fixed max-sm:bottom-[max(env(safe-area-inset-bottom),8px)] max-sm:left-2 max-sm:right-2 max-sm:max-h-none max-sm:h-[88dvh] max-sm:w-auto"
            aria-label="Milano Execution Copilot"
          >
            <header className="border-b border-white/[0.06] p-4 sm:p-5">
              <div className="mx-auto mb-3 hidden h-1 w-12 rounded-full bg-white/10 max-sm:block" aria-hidden="true" />
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/milano-seal-orb-v2.png" alt="" width={38} height={38} className="h-[38px] w-[38px] object-contain" />
                  <div>
                    <p className="text-sm font-semibold tracking-[0.04em] text-white">Milano Execution Copilot</p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/70">● READY · Global Document Intelligence</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex h-11 w-11 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/75 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/50"
                  aria-label="Close copilot"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--ms-gold)]/12 bg-[var(--ms-gold)]/[0.025] p-3.5">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/50">Current context</p>
                <p className="mt-1.5 text-[15px] text-white/72">{context.label}</p>
                <div className="mt-3"><ProgressStrip items={context.progress} activeIndex={context.activeProgressIndex} /></div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {mode === "preflight" ? (
                <div>
                  <button
                    type="button"
                    onClick={() => setMode("chat")}
                    className="mb-5 inline-flex min-h-10 items-center gap-2 text-xs text-white/38 transition-colors hover:text-[var(--ms-gold)]"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" /> Back to conversation
                  </button>

                  <p className="font-mono text-[10px] uppercase tracking-[0.17em] text-[var(--ms-gold)]/58">Pre-flight a Matter</p>
                  <h2 className="mt-2 font-serif text-2xl text-white">Structure the route before execution.</h2>
                  <p className="mt-2 text-sm leading-6 text-white/40">
                    These selections organize the operational pathway. They do not approve, pay, schedule, create, or modify a Matter.
                  </p>

                  <div className="mt-5 space-y-4">
                    <PreflightSelect
                      label="Where will the document be used?"
                      value={professionalSession.destinationSlug || ""}
                      onChange={(value) => updateSession({ destinationSlug: value || undefined })}
                    >
                      <option value="">Select destination</option>
                      {HAGUE_PROFESSIONAL_DESTINATIONS.map((destination) => (
                        <option key={destination.slug} value={destination.slug}>{destination.name}</option>
                      ))}
                    </PreflightSelect>

                    <PreflightSelect
                      label="What type of document?"
                      value={professionalSession.documentClass || ""}
                      onChange={(value) => updateSession({ documentClass: (value || undefined) as ProfessionalDocumentClass | undefined })}
                    >
                      <option value="">Select document class</option>
                      {PROFESSIONAL_DOCUMENT_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </PreflightSelect>

                    <PreflightSelect
                      label="Where was it issued / executed?"
                      value={professionalSession.origin || ""}
                      onChange={(value) => updateSession({ origin: (value || undefined) as OriginPosture | undefined })}
                    >
                      <option value="">Select U.S. origin</option>
                      {ORIGINS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </PreflightSelect>

                    <PreflightSelect
                      label="Signer posture"
                      value={professionalSession.signer || ""}
                      onChange={(value) => updateSession({ signer: (value || undefined) as SignerPosture | undefined })}
                    >
                      <option value="">Select signer posture</option>
                      {SIGNERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                    </PreflightSelect>

                    <label className="block">
                      <span className="mb-2 block font-mono text-[10px] uppercase tracking-[0.14em] text-white/38">Receiving authority — if known</span>
                      <input
                        value={receivingAuthority}
                        onChange={(event) => setReceivingAuthority(event.target.value)}
                        placeholder="Court, registry, notary, municipality, bank…"
                        className="min-h-12 w-full rounded-xl border border-white/[0.08] bg-[#0B0B0E] px-3 text-[15px] text-white/74 outline-none placeholder:text-white/22 focus:border-[var(--ms-gold)]/35"
                      />
                    </label>
                  </div>

                  <div className="mt-6 rounded-2xl border border-[var(--ms-gold)]/14 bg-[var(--ms-gold)]/[0.025] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ms-gold)]/58">Matter pre-flight</p>
                        <p className="mt-1 font-serif text-xl text-white">{journey.routeLabel}</p>
                      </div>
                      <span className="rounded-full border border-white/[0.08] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.1em] text-white/48">{reviewStatus}</span>
                    </div>

                    {journey.routeSteps.length > 0 && (
                      <div className="mt-4 space-y-0">
                        {journey.routeSteps.map((step, index) => (
                          <div key={`${step}-${index}`} className="relative flex gap-3 pb-4 last:pb-0">
                            {index < journey.routeSteps.length - 1 && <span className="absolute left-[6px] top-4 h-[calc(100%-4px)] w-px bg-[var(--ms-gold)]/18" />}
                            <span className="relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full border border-[var(--ms-gold)]/35 bg-[#060608]" />
                            <p className="text-sm leading-5 text-white/62">{step}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="mt-5 grid gap-2 sm:grid-cols-2">
                      <div className="rounded-xl border border-white/[0.06] bg-black/20 p-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-emerald-300/55">Confirmed</p>
                        <div className="mt-2 space-y-1.5">
                          {journey.confirmed.length ? journey.confirmed.map((item) => (
                            <p key={item} className="flex gap-2 text-xs leading-5 text-white/44"><Check className="mt-1 h-3 w-3 shrink-0 text-emerald-300/60" />{item}</p>
                          )) : <p className="text-xs text-white/28">Add routing facts to begin.</p>}
                        </div>
                      </div>
                      <div className="rounded-xl border border-amber-300/10 bg-amber-300/[0.02] p-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.13em] text-amber-200/55">Still to confirm</p>
                        <div className="mt-2 space-y-1.5">
                          {journey.reviewRequired.map((item) => (
                            <p key={item} className="flex gap-2 text-xs leading-5 text-white/42"><Circle className="mt-1 h-3 w-3 shrink-0 text-amber-200/45" />{item}</p>
                          ))}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={startMatter}
                      className="mt-5 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--ms-gold)] px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-[#050507]"
                    >
                      Structure This Matter <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="mt-4 text-xs leading-5 text-white/28">
                    The Milano Seal coordinates document execution and authentication logistics. Legal advice and receiving-authority legal judgment remain with counsel or the appropriate professional advisor.
                  </p>
                </div>
              ) : (
                <>
                  {empty && (
                    <div>
                      <p className="text-base leading-7 text-white/72">
                        I can structure a document route, identify missing operational inputs, explain the Milano process, and hand your selections into secure intake.
                      </p>
                      <p className="mt-2 text-xs leading-5 text-white/34">
                        I do not provide legal advice or guarantee apostille issuance or receiving-authority acceptance.
                      </p>

                      <div className="mt-5 grid gap-2 sm:grid-cols-2">
                        {context.chips.map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => handleAction(chip)}
                            className="min-h-12 rounded-xl border border-white/[0.08] bg-white/[0.018] px-3 py-3 text-left text-sm text-white/62 transition-colors hover:border-[var(--ms-gold)]/25 hover:text-[var(--ms-gold)]"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>

                      <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.012] p-4">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-[var(--ms-gold)]/80" />
                          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/60">Progressive Certainty</p>
                        </div>
                        <div className="mt-3 space-y-2.5">
                          {["Destination", "Document", "Origin", "Signer posture", "Operator review"].map((item, index) => (
                            <div key={item} className="flex items-center gap-2.5">
                              {index < context.activeProgressIndex ? <Check className="h-3.5 w-3.5 text-emerald-300/70" /> : index === context.activeProgressIndex ? <Check className="h-3.5 w-3.5 text-[var(--ms-gold)]" /> : <Circle className="h-3.5 w-3.5 text-white/18" />}
                              <span className={index <= context.activeProgressIndex ? "text-xs text-white/62" : "text-xs text-white/30"}>{item}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-[15px] leading-6 ${message.role === "user" ? "border border-[var(--ms-gold)]/18 bg-[var(--ms-gold)]/[0.06] text-white/82" : "border border-white/[0.07] bg-white/[0.02] text-white/68"}`}>
                          {message.text}
                        </div>
                      </div>
                    ))}
                    {loading && (
                      <div className="flex justify-start">
                        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.02] px-4 py-3 text-sm text-white/38">Structuring response…</div>
                      </div>
                    )}
                    <div ref={endRef} />
                  </div>
                </>
              )}
            </div>

            {mode === "chat" && (
              <form
                className="border-t border-white/[0.06] p-3.5 sm:p-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void send(input);
                }}
              >
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    disabled={loading}
                    placeholder="Ask about this Matter or route…"
                    className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#0B0B0E] px-4 text-base text-white outline-none placeholder:text-white/24 focus:border-[var(--ms-gold)]/35"
                  />
                  <button
                    type="submit"
                    disabled={loading || !input.trim()}
                    className="flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-[var(--ms-gold)] px-4 text-[#050507] disabled:opacity-30"
                    aria-label="Send message"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("preflight")}
                    className="inline-flex min-h-10 items-center gap-2 text-xs text-white/36 transition-colors hover:text-[var(--ms-gold)]"
                  >
                    <ShieldCheck className="h-3.5 w-3.5" /> Pre-flight Matter
                  </button>
                  <button
                    type="button"
                    onClick={requestReview}
                    className="inline-flex min-h-10 items-center gap-2 text-xs text-white/36 transition-colors hover:text-[var(--ms-gold)]"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> Request Milano review
                  </button>
                </div>
              </form>
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
