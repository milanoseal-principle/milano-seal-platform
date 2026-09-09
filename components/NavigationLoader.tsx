"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MilanoPageLoader } from "@/components/animations/MilanoPageLoader";

const NAV_INTENT_EVENT = "milano:navigation-intent";

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

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
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
  return <MilanoPageLoader complete={complete} />;
}
