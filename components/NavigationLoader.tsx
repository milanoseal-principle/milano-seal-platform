"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_INTENT_EVENT = "milano:navigation-intent";
const MINIMUM_VISIBLE_MS = 700;
const SETTLE_FADE_MS = 220;
const SAFETY_RELEASE_MS = 8000;

export function NavigationLoader() {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const startedAt = useRef<number | null>(null);
  const activeRef = useRef(false);
  const releaseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const clearTimers = useCallback(() => {
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    releaseTimer.current = null;
    settleTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const finish = useCallback(() => {
    if (!activeRef.current) return;
    setComplete(true);
    settleTimer.current = setTimeout(() => {
      setLoading(false);
      setComplete(false);
      activeRef.current = false;
      startedAt.current = null;
    }, SETTLE_FADE_MS);
  }, []);

  const releaseWhenReady = useCallback(() => {
    if (!activeRef.current || startedAt.current === null) return;
    if (releaseTimer.current) clearTimeout(releaseTimer.current);
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }

    const elapsed = performance.now() - startedAt.current;
    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);
    releaseTimer.current = setTimeout(finish, remaining);
  }, [finish]);

  const begin = useCallback(() => {
    clearTimers();
    if (!activeRef.current) {
      activeRef.current = true;
      startedAt.current = performance.now();
    }
    setComplete(false);
    setLoading(true);
    safetyTimer.current = setTimeout(finish, SAFETY_RELEASE_MS);
  }, [clearTimers, finish]);

  useEffect(() => {
    window.addEventListener(NAV_INTENT_EVENT, begin);
    return () => {
      window.removeEventListener(NAV_INTENT_EVENT, begin);
      clearTimers();
    };
  }, [begin, clearTimers]);

  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;

    if (!activeRef.current) {
      activeRef.current = true;
      startedAt.current = performance.now();
      setComplete(false);
      setLoading(true);
    }

    releaseWhenReady();
  }, [pathname, releaseWhenReady]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target as Element | null;
      const anchor = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      window.dispatchEvent(new Event(NAV_INTENT_EVENT));
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  if (!loading) return null;

  return (
    <main
      className={`fixed inset-0 z-[9200] min-h-[100dvh] bg-[#060608] px-5 py-12 text-[#F4F1EA] transition-opacity duration-300 sm:px-6 ${
        complete ? "opacity-0" : "opacity-100"
      }`}
      role="status"
      aria-live="polite"
      aria-busy={!complete}
      aria-label="Preparing the next view"
    >
      <div className="mx-auto flex min-h-[70dvh] w-full max-w-3xl flex-col justify-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.24em] text-[#D8C188]/70">
          The Milano Seal™
        </div>
        <h1 className="mt-3 font-serif text-3xl font-normal sm:text-4xl">
          Preparing the next view
        </h1>
        <p className="mt-3 max-w-xl text-[15px] leading-7 text-white/42">
          Preserving your current context while the destination surface is prepared.
        </p>
        <div className="mt-10 flex items-center gap-4" aria-hidden="true">
          <span className="relative flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full rounded-full bg-[#D8C188]/40 motion-safe:animate-ping motion-reduce:animate-none" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-[#D8C188]" />
          </span>
          <div className="relative h-px flex-1 overflow-hidden bg-[#D8C188]/10">
            <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-[#D8C188] to-transparent motion-safe:animate-[pulse_1.1s_ease-in-out_infinite] motion-reduce:animate-none" />
          </div>
        </div>
      </div>
    </main>
  );
}
