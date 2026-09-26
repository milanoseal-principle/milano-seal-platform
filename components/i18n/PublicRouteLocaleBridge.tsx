"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { usePublicTranslations } from "@/components/i18n/PublicI18nProvider";
import { PUBLIC_ROUTE_COPY } from "@/lib/i18n/public-route-copy";

const PUBLIC_PREFIXES = [
  "/services",
  "/pricing",
  "/process",
  "/global-document-intelligence",
  "/professional",
  "/secure-portal",
  "/login",
  "/intake",
  "/countries",
  "/map",
  "/founder",
  "/about",
];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"));
}

function preserveWhitespace(source: string, translated: string) {
  const leading = source.match(/^\s*/)?.[0] ?? "";
  const trailing = source.match(/\s*$/)?.[0] ?? "";
  return leading + translated + trailing;
}

export function PublicRouteLocaleBridge() {
  const pathname = usePathname() ?? "/";
  const { locale } = usePublicTranslations();
  const textOriginals = useRef(new WeakMap<Text, string>());
  const attrOriginals = useRef(new WeakMap<Element, Map<string,string>>());

  useEffect(() => {
    if (!isPublicPath(pathname)) return;
    const map = PUBLIC_ROUTE_COPY[locale] ?? {};
    const root = document.querySelector("body");
    if (!root) return;

    const translateText = (node: Text) => {
      if (!textOriginals.current.has(node)) textOriginals.current.set(node, node.nodeValue ?? "");
      const original = textOriginals.current.get(node) ?? "";
      const key = original.trim();
      if (!key) return;
      const translated = locale === "en" ? key : map[key];
      node.nodeValue = preserveWhitespace(original, translated ?? key);
    };

    const translateAttributes = (element: Element) => {
      const attrs = ["placeholder","aria-label","title"] as const;
      let originals = attrOriginals.current.get(element);
      if (!originals) {
        originals = new Map<string,string>();
        attrOriginals.current.set(element, originals);
      }
      for (const attr of attrs) {
        const current = element.getAttribute(attr);
        if (!current) continue;
        if (!originals.has(attr)) originals.set(attr, current);
        const original = originals.get(attr) ?? current;
        element.setAttribute(attr, locale === "en" ? original : (map[original] ?? original));
      }
    };

    const translateTree = (target: Node) => {
      if (target.nodeType === Node.TEXT_NODE) {
        translateText(target as Text);
        return;
      }
      if (!(target instanceof Element)) return;
      if (target.matches("script,style,header,footer,[data-tms-i18n-ignore],[data-tms-i18n-native]")) return;
      translateAttributes(target);
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      let current = walker.nextNode();
      while (current) {
        const parent = current.parentElement;
        if (parent && !parent.closest("script,style,header,footer,[data-tms-i18n-ignore],[data-tms-i18n-native]")) translateText(current as Text);
        current = walker.nextNode();
      }
      target.querySelectorAll("*").forEach((el) => {
        if (!el.closest("header,footer,[data-tms-i18n-ignore],[data-tms-i18n-native]")) translateAttributes(el);
      });
    };

    translateTree(root);

    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(translateTree);
      }
    });
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [locale, pathname]);

  return null;
}
