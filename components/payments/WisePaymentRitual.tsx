"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { ArrowUpRight, ShieldCheck, X } from "lucide-react";

function isWisePaymentUrl(href: string) {
  try {
    const url = new URL(href, typeof window !== "undefined" ? window.location.href : "https://themilanoseal.com");
    const host = url.hostname.toLowerCase();
    return host === "wise.com" || host.endsWith(".wise.com") || host === "transferwise.com" || host.endsWith(".transferwise.com");
  } catch {
    return false;
  }
}

function money(value: number | null | undefined, currency = "USD") {
  if (value == null || !Number.isFinite(Number(value))) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
}

export function WisePaymentRitual({
  children,
  matterReference,
  amountDue,
  currency = "USD",
}: {
  children: ReactNode;
  matterReference?: string | null;
  amountDue?: number | null;
  currency?: string | null;
}) {
  const [href, setHref] = useState<string | null>(null);
  const continueRef = useRef<HTMLAnchorElement | null>(null);
  const formattedAmount = money(amountDue, currency || "USD");

  useEffect(() => {
    if (!href) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => continueRef.current?.focus(), 40);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setHref(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [href]);

  function captureWiseLaunch(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const target = event.target;
    if (!(target instanceof Element)) return;
    if (target.closest('[data-wise-ritual-bypass="true"]')) return;
    const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
    if (!anchor || !isWisePaymentUrl(anchor.href)) return;
    event.preventDefault();
    event.stopPropagation();
    setHref(anchor.href);
  }

  return (
    <div onClickCapture={captureWiseLaunch}>
      {children}
      {href && typeof document !== "undefined"
        ? createPortal(
            <div
              className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#050505]/96 px-4 py-8 backdrop-blur-md"
              role="dialog"
              aria-modal="true"
              aria-labelledby="wise-payment-ritual-title"
              aria-describedby="wise-payment-ritual-description"
            >
              <div className="relative w-full max-w-lg overflow-hidden rounded-[28px] border border-[#C6A65B]/28 bg-[radial-gradient(circle_at_50%_-10%,rgba(198,166,91,0.16),transparent_38%),linear-gradient(180deg,#11100d_0%,#080808_74%)] p-6 shadow-[0_42px_140px_rgba(0,0,0,.72)] sm:p-8">
                <button
                  type="button"
                  onClick={() => setHref(null)}
                  aria-label="Stay on The Milano Seal"
                  className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.08] bg-black/25 text-white/45 transition hover:border-[#C6A65B]/30 hover:text-[#E8CF8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/60"
                >
                  <X className="h-4 w-4" />
                </button>

                <div className="flex flex-col items-center text-center">
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-[#C6A65B]/24 bg-black/35 shadow-[0_0_60px_rgba(198,166,91,.11)]">
                    <Image
                      src="/brand/milano-seal-orb-v2.png"
                      alt="The Milano Seal"
                      width={78}
                      height={78}
                      priority
                      className="h-[78px] w-[78px] object-contain"
                    />
                  </div>

                  <div className="mt-6 font-mono text-[9px] uppercase tracking-[0.3em] text-[#C6A65B]/68">
                    Secure Payment Transition
                  </div>
                  <h2 id="wise-payment-ritual-title" className="mt-3 font-serif text-3xl leading-tight text-[#F6F1E6] sm:text-4xl">
                    Continuing to Wise Business
                  </h2>
                  <p id="wise-payment-ritual-description" className="mt-4 max-w-md text-sm leading-6 text-white/48">
                    You&apos;re leaving The Milano Seal™ briefly to complete this Matter&apos;s payment through Wise Business, the authorized payment rail for this Matter.
                  </p>

                  <div className="mt-6 w-full rounded-2xl border border-[#C6A65B]/16 bg-black/24 p-4 text-left">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">Matter Reference</div>
                        <div className="mt-1 font-mono text-sm text-[#E8CF8B]">{matterReference || "Your active Matter"}</div>
                      </div>
                      <div className="sm:text-right">
                        <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-white/28">Payment</div>
                        <div className="mt-1 text-sm text-white/76">{formattedAmount || "Matter-specific amount"}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex w-full gap-3 rounded-2xl border border-emerald-400/13 bg-emerald-400/[0.035] p-4 text-left">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300/80" />
                    <p className="text-xs leading-5 text-white/46">
                      The Milano Seal™ remains the system of record. Your Matter stays open here, and payment status is reconciled against Wise after submission.
                    </p>
                  </div>

                  <a
                    ref={continueRef}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-wise-ritual-bypass="true"
                    onClick={() => setHref(null)}
                    className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#C6A65B] px-5 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#090806] transition hover:-translate-y-px hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E8CF8B]/70"
                  >
                    Continue securely to Wise
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => setHref(null)}
                    className="mt-3 min-h-11 w-full rounded-xl border border-white/[0.08] px-4 text-xs text-white/48 transition hover:border-[#C6A65B]/25 hover:text-[#E8CF8B] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C6A65B]/50"
                  >
                    Stay on The Milano Seal
                  </button>
                  <p className="mt-4 font-mono text-[8px] uppercase tracking-[0.16em] text-white/22">
                    Wise opens in a new tab · Matter context remains preserved
                  </p>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
