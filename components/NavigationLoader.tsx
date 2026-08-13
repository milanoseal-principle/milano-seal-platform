"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { MilanoPageLoader } from "@/components/animations/MilanoPageLoader";

const NAV_INTENT_EVENT = "milano:navigation-intent";

export function NavigationLoader() {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const safetyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [loading, setLoading] = useState(false);
  const [complete, setComplete] = useState(false);

  const clearTimers = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (safetyTimer.current) clearTimeout(safetyTimer.current);
    settleTimer.current = null;
    safetyTimer.current = null;
  }, []);

  useEffect(() => {
    const onIntent = () => {
      clearTimers();
      setComplete(false);
      setLoading(true);
      safetyTimer.current = setTimeout(() => {
        setComplete(true);
        settleTimer.current = setTimeout(() => setLoading(false), 240);
      }, 8000);
    };

    window.addEventListener(NAV_INTENT_EVENT, onIntent);
    return () => {
      window.removeEventListener(NAV_INTENT_EVENT, onIntent);
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    clearTimers();
    setComplete(true);
    setLoading(true);
    settleTimer.current = setTimeout(() => setLoading(false), 240);
    return clearTimers;
  }, [pathname, clearTimers]);

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
