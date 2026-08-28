"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check, Circle, MessageCircle, ShieldCheck, X } from "lucide-react";

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

function contextForLocation(
  pathname: string,
  search: string,
  portalDeal: PortalSafeDeal | null,
): PageContext {
  const params = new URLSearchParams(search);
  const country = params.get("country") || params.get("destination") || "";
  const documentType = params.get("document_type") || params.get("document") || "";

  if (pathname.startsWith("/pricing")) {
    return {
      label: "Execution Quote",
      chips: ["How is my quote built?", "Which execution lane fits?", "Explain the payment gate", "Start a Matter"],
      progress: ["Scope", "Route", "Quote", "Payment", "Execution"],
      activeProgressIndex: 0,
    };
  }

  if (pathname.startsWith("/process")) {
    return {
      label: "Execution Process",
      chips: ["Show my next step", "Explain the payment gate", "What happens at apostille?", "Start a Matter"],
      progress: ["Intake", "Review", "Payment", "Execution", "Release"],
      activeProgressIndex: 0,
    };
  }

  if (pathname.startsWith("/countries") || pathname.startsWith("/map")) {
    return {
      label: country ? `Country Intelligence · ${country}` : "Global Document Intelligence",
      chips: [country ? `Review the ${country} route` : "Check a country", "Pre-flight my Matter", "Common rejection risks", "Start secure intake"],
      progress: ["Destination", "Document", "Origin", "Signer", "Operator review"],
      activeProgressIndex: country ? (documentType ? 1 : 0) : 0,
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

  return {
    label: documentType || country ? [country, documentType].filter(Boolean).join(" · ") : "Global Document Intelligence",
    chips: ["Review my document route", "Check a country", "Pre-flight my Matter", "Start secure intake"],
    progress: ["Destination", "Document", "Origin", "Signer", "Operator review"],
    activeProgressIndex: country ? (documentType ? 1 : 0) : 0,
  };
}

function ProgressStrip({ items, activeIndex }: { items: string[]; activeIndex: number }) {
  return (
    <div className="grid grid-cols-5 gap-1.5">
      {items.map((item, index) => {
        const complete = index < activeIndex;
        const active = index === activeIndex;
        return (
          <div key={item} className="min-w-0">
            <div
              className={`h-1 rounded-full transition-colors ${
                complete
                  ? "bg-emerald-400/70"
                  : active
                    ? "bg-[var(--ms-gold)]"
                    : "bg-white/[0.07]"
              }`}
            />
            <p
              className={`mt-1.5 truncate text-[8px] ${
                complete
                  ? "text-emerald-300/55"
                  : active
                    ? "text-[var(--ms-gold)]/80"
                    : "text-white/25"
              }`}
            >
              {item}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function MilanoExecutionCopilot() {
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [portalDeal, setPortalDeal] = useState<PortalSafeDeal | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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

  const context = useMemo(
    () => contextForLocation(pathname, search, portalDeal),
    [pathname, portalDeal, search],
  );

  const role = pathname.startsWith("/portal") ? "PORTAL" : "PUBLIC";

  const safeAssistantContext = useMemo(() => {
    if (role === "PORTAL") {
      return {
        matter_id: portalDeal?.display_id || portalDeal?.matter_id,
        status: portalDeal?.client_facing_status || portalDeal?.matter_status,
        current_step: portalDeal?.matter_status,
        next_action: undefined,
        estimated_timeline: undefined,
        pathname,
        label: context.label,
      };
    }

    const params = new URLSearchParams(search);
    return {
      pathname,
      search,
      label: context.label,
      country: params.get("country") || undefined,
      destination_country: params.get("destination") || undefined,
      document_type: params.get("document_type") || params.get("document") || undefined,
      origin_state: params.get("origin_state") || undefined,
      signer_location: params.get("signer_location") || undefined,
    };
  }, [context.label, pathname, portalDeal, role, search]);

  const send = useCallback(async (text: string) => {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setMessages((prev) => [...prev, { role: "user", text: prompt }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: prompt, role, context: safeAssistantContext }),
      });
      const data = (await res.json()) as { reply?: string };
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply || "I can help structure the next operational step for this Matter." }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "The execution desk is temporarily unavailable. Please try again or continue to secure intake." }]);
    } finally {
      setLoading(false);
    }
  }, [loading, role, safeAssistantContext]);

  const empty = messages.length === 0;

  return (
    <div className="fixed bottom-[calc(env(safe-area-inset-bottom)+86px)] right-4 z-[80]">
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
            <span className="hidden rounded-full border border-[var(--ms-gold)]/22 bg-[#050507]/88 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/78 opacity-0 backdrop-blur-xl transition-opacity group-hover:opacity-100 md:block">
              Execution Copilot
            </span>
            <span className="relative flex h-[72px] w-[72px] items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/milano-seal-orb-v2.png" alt="" width={72} height={72} className="h-[72px] w-[72px] object-contain drop-shadow-[0_0_12px_rgba(212,175,55,0.35)]" />
              <span className="absolute bottom-1 right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-[#050507]" />
            </span>
          </motion.button>
        ) : (
          <motion.section
            key="copilot-panel"
            initial={{ opacity: 0, y: 18, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="flex max-h-[min(760px,calc(100dvh-7rem))] w-[min(470px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-white/[0.08] bg-[#060608]/94 shadow-[0_32px_90px_rgba(0,0,0,0.72)] backdrop-blur-2xl"
            aria-label="Milano Execution Copilot"
          >
            <header className="border-b border-white/[0.06] p-4 sm:p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/milano-seal-orb-v2.png" alt="" width={36} height={36} className="h-9 w-9 object-contain" />
                  <div>
                    <p className="font-mono text-[10px] font-bold uppercase tracking-[0.16em] text-white">Milano Execution Copilot</p>
                    <p className="mt-1 font-mono text-[8px] uppercase tracking-[0.13em] text-emerald-300/75">● Global Intelligence Connected</p>
                  </div>
                </div>
                <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full text-white/35 transition-colors hover:bg-white/[0.04] hover:text-white/75" aria-label="Close copilot">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 rounded-xl border border-[var(--ms-gold)]/12 bg-[var(--ms-gold)]/[0.025] p-3.5">
                <p className="font-mono text-[8px] uppercase tracking-[0.16em] text-[var(--ms-gold)]/50">Current context</p>
                <p className="mt-1.5 text-sm text-white/72">{context.label}</p>
                <div className="mt-3"><ProgressStrip items={context.progress} activeIndex={context.activeProgressIndex} /></div>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-5">
              {empty && (
                <div>
                  <p className="text-base leading-7 text-white/72">
                    I can help reduce uncertainty before execution by structuring the route, identifying missing inputs, and explaining Milano&apos;s operational process.
                  </p>
                  <p className="mt-2 text-xs leading-5 text-white/34">
                    I do not provide legal advice or guarantee receiving-authority acceptance.
                  </p>

                  <div className="mt-5 grid gap-2 sm:grid-cols-2">
                    {context.chips.map((chip) => (
                      <button key={chip} type="button" onClick={() => void send(chip)} className="min-h-12 rounded-xl border border-white/[0.08] bg-white/[0.018] px-3 py-3 text-left text-sm text-white/62 transition-colors hover:border-[var(--ms-gold)]/25 hover:text-[var(--ms-gold)]">
                        {chip}
                      </button>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border border-white/[0.06] bg-white/[0.012] p-4">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[var(--ms-gold)]/80" />
                      <p className="font-mono text-[8px] uppercase tracking-[0.14em] text-[var(--ms-gold)]/60">Progressive Certainty</p>
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
                    <div className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "border border-[var(--ms-gold)]/18 bg-[var(--ms-gold)]/[0.06] text-white/82" : "border border-white/[0.07] bg-white/[0.02] text-white/68"}`}>
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
            </div>

            <form
              className="border-t border-white/[0.06] p-3.5 sm:p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void send(input);
              }}
            >
              <div className="flex gap-2">
                <input ref={inputRef} value={input} onChange={(event) => setInput(event.target.value)} disabled={loading} placeholder="Ask about this Matter or route…" className="min-h-12 min-w-0 flex-1 rounded-xl border border-white/[0.08] bg-[#0B0B0E] px-4 text-base text-white outline-none placeholder:text-white/24 focus:border-[var(--ms-gold)]/35" />
                <button type="submit" disabled={loading || !input.trim()} className="flex min-h-12 min-w-12 items-center justify-center rounded-xl bg-[var(--ms-gold)] px-4 text-[#050507] disabled:opacity-30" aria-label="Send message">
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={() => void send("Request Milano operator review for this matter context.")} className="mt-3 inline-flex items-center gap-2 text-xs text-white/36 transition-colors hover:text-[var(--ms-gold)]">
                <MessageCircle className="h-3.5 w-3.5" />
                Request Milano review
              </button>
            </form>
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}
