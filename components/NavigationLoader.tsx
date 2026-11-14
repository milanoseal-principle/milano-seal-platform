"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { usePublicTranslations } from "@/components/i18n/PublicI18nProvider";

const NAV_INTENT_EVENT = "milano:navigation-intent";

export function NavigationLoader() {
  const { t } = usePublicTranslations();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const finishRef = useRef<() => void>(() => undefined);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let revealTimer: ReturnType<typeof setTimeout> | undefined;
    let safetyTimer: ReturnType<typeof setTimeout> | undefined;
    const finish = () => {
      clearTimeout(revealTimer);
      clearTimeout(safetyTimer);
      setLoading(false);
    };
    finishRef.current = finish;
    const begin = () => {
      clearTimeout(revealTimer);
      clearTimeout(safetyTimer);
      revealTimer = setTimeout(() => setLoading(true), 150);
      safetyTimer = setTimeout(finish, 8000);
    };
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target instanceof Element ? event.target : null;
      const anchor = target?.closest<HTMLAnchorElement>("a[href]");
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      if (url.pathname === window.location.pathname && url.search === window.location.search) return;
      begin();
    };
    window.addEventListener(NAV_INTENT_EVENT, begin);
    document.addEventListener("click", onClick);
    window.addEventListener("popstate", finish);
    return () => {
      clearTimeout(revealTimer);
      clearTimeout(safetyTimer);
      window.removeEventListener(NAV_INTENT_EVENT, begin);
      document.removeEventListener("click", onClick);
      window.removeEventListener("popstate", finish);
    };
  }, []);

  useEffect(() => { finishRef.current(); }, [routeKey]);

  if (!loading) return null;
  return (
    <div role="status" aria-live="polite" aria-label={t.loading.aria}
      className="pointer-events-none fixed inset-x-0 top-0 z-[9200] h-1 bg-black/20">
      <span className="sr-only">{t.loading.aria}</span>
      <div aria-hidden="true" className="h-full w-1/2 bg-[var(--ms-gold)] motion-safe:animate-pulse" />
    </div>
  );
}
