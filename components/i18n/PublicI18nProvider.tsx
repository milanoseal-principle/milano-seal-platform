"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { SupportedLocale } from "@/lib/i18n/config";
import { publicTranslation, type PublicTranslation } from "@/lib/i18n/public-dictionary";

type PublicI18nContextValue = {
  locale: SupportedLocale;
  t: PublicTranslation;
  setLocale: (locale: SupportedLocale) => void;
};

const PublicI18nContext = createContext<PublicI18nContextValue | null>(null);

export function PublicI18nProvider({
  initialLocale,
  children,
}: {
  initialLocale: SupportedLocale;
  children: React.ReactNode;
}) {
  const [locale, setLocale] = useState<SupportedLocale>(initialLocale);
  const value = useMemo(() => ({ locale, t: publicTranslation(locale), setLocale }), [locale]);
  return <PublicI18nContext.Provider value={value}>{children}</PublicI18nContext.Provider>;
}

export function usePublicTranslations() {
  const value = useContext(PublicI18nContext);
  if (!value) throw new Error("usePublicTranslations must be used inside PublicI18nProvider");
  return value;
}
