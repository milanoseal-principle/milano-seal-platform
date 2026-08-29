"use client";
import { useEffect } from "react";
import { buildSeoTouch, mergeSeoAttribution, SEO_ATTRIBUTION_STORAGE_KEY, type SeoAttribution } from "@/lib/attribution/seo-attribution";
export function SeoAttributionCapture() { useEffect(() => { try { const stored = sessionStorage.getItem(SEO_ATTRIBUTION_STORAGE_KEY); const existing = stored ? JSON.parse(stored) as SeoAttribution : undefined; sessionStorage.setItem(SEO_ATTRIBUTION_STORAGE_KEY, JSON.stringify(mergeSeoAttribution(existing, buildSeoTouch(new URL(window.location.href), document.referrer)))); } catch { /* Attribution is non-authoritative and must never block the public shell. */ } }, []); return null; }
