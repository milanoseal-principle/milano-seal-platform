"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

const NAV_INTENT_EVENT = "milano:navigation-intent";
const MINIMUM_VISIBLE_MS = 2200;
const SETTLE_FADE_MS = 300;
const SAFETY_RELEASE_MS = 8000;

// Minimum time the transition screen stays visible so "Preparing the next view"
// and its supporting sentence are readable, even when the destination resolves
// instantly. Release happens only once BOTH are true: the route is ready AND the
// minimum has elapsed. A soft fade then hands off to the destination.
const MIN_VISIBLE_MS = 2200;
const FADE_MS = 300;
// Fallback cap if a route never resolves (kept from prior behavior).
const SAFETY_MS = 8000;

export function NavigationLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const shownAt = useRef(0);
  const activeRef = useRef(false);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAt = useRef<number | null>(null);
  const completeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const clearTimers = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    holdTimer.current = settleTimer.current = safetyTimer.current = null;
  }, []);

  // Release the transition once the route is ready, but never before the
  // minimum readable duration has elapsed. If the route is still loading past
  // the minimum, we do NOT release early — we wait for readiness.
  const releaseWhenReady = useCallback(() => {
    if (holdTimer.current) clearTimeout(holdTimer.current);
    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }
    const elapsed = Date.now() - shownAt.current;
    const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);
    holdTimer.current = setTimeout(() => {
      setComplete(true); // begin soft fade-out
      settleTimer.current = setTimeout(() => {
        setLoading(false);
        activeRef.current = false;
      }, FADE_MS);
    }, remaining);
  }, []);
    if (completeTimer.current) clearTimeout(completeTimer.current);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    completeTimer.current = null;
    settleTimer.current = null;
    safetyTimer.current = null;
  }, []);

  const release = useCallback(() => {
    setComplete(true);
    settleTimer.current = setTimeout(() => {
      setLoading(false);
      startedAt.current = null;
    }, SETTLE_FADE_MS);
  }, []);

  useEffect(() => {
    const onIntent = () => {
      clearTimers();
      startedAt.current = performance.now();
      setComplete(false);
      setLoading(true);
      safetyTimer.current = setTimeout(release, SAFETY_RELEASE_MS);
    };

  const begin = useCallback(() => {
    clearTimers();
    setComplete(false);
    if (!activeRef.current) {
      activeRef.current = true;
      shownAt.current = Date.now();
    }
    setLoading(true);
    // If the destination never resolves, still release after the safety cap
    // (which is already past the minimum).
    safetyTimer.current = setTimeout(releaseWhenReady, SAFETY_MS);
  }, [clearTimers, releaseWhenReady]);

  useEffect(() => {
    window.addEventListener(NAV_INTENT_EVENT, begin);
    return () => {
      window.removeEventListener(NAV_INTENT_EVENT, begin);
      clearTimers();
    };
  }, [begin, clearTimers]);
  }, [clearTimers, release]);

  // Route resolved: the destination segment is ready.
  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    if (!activeRef.current) {
      // Navigation without a captured intent — show the screen, then hold the
      // same readable minimum before releasing.
      activeRef.current = true;
      shownAt.current = Date.now();
      setComplete(false);
      setLoading(true);
    }
    releaseWhenReady();
  }, [pathname, releaseWhenReady]);

    if (!loading || startedAt.current === null) {
      clearTimers();
      setComplete(true);
      setLoading(true);
      settleTimer.current = setTimeout(() => setLoading(false), SETTLE_FADE_MS);
      return clearTimers;
    }

    if (safetyTimer.current) {
      clearTimeout(safetyTimer.current);
      safetyTimer.current = null;
    }

    const elapsed = performance.now() - startedAt.current;
    const remaining = Math.max(0, MINIMUM_VISIBLE_MS - elapsed);
    completeTimer.current = setTimeout(release, remaining);
    return clearTimers;
  }, [pathname, clearTimers, loading, release]);

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
      if (url.pathname === window.location.pathname && url.search === window.location.search && url.hash) return;

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

        <div className="mt-8 h-px w-full overflow-hidden bg-[#D8C188]/10" aria-hidden="true">
          <div className="h-full w-2/3 origin-left bg-gradient-to-r from-transparent via-[#D8C188]/80 to-transparent motion-safe:animate-pulse" />
        </div>

        <div className="mt-6 grid gap-3" aria-hidden="true">
          <div className="h-16 rounded-xl border border-[#D8C188]/10 bg-white/[0.02] motion-safe:animate-pulse" />
          <div className="h-28 rounded-xl border border-[#D8C188]/10 bg-white/[0.02] motion-safe:animate-pulse" />
        </div>
      </div>
    </main>
  );
}
