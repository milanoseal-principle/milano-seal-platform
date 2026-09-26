import "server-only";
import { createHash } from "node:crypto";
import { createSupabaseServer } from "@/lib/supabaseServer";
import { MILANO_TRANSLATION_GLOSSARY } from "./translationGlossary";
import type { SupportedLocale } from "./config";
export type TranslationMethod = "human" | "ai" | "hybrid";
export type TranslationRisk = "LOW" | "MEDIUM" | "HIGH";
export type TranslationReviewStatus = "AUTO_TRANSLATED" | "REVIEW_REQUIRED" | "APPROVED" | "STALE";
export interface TranslationRequest { contentKey: string; sourceText: string; locale: SupportedLocale; sourceLocale?: SupportedLocale; riskLevel?: TranslationRisk; }
export interface TranslationProvider { translate(input: { sourceText: string; sourceLocale: SupportedLocale; targetLocale: SupportedLocale; glossary: typeof MILANO_TRANSLATION_GLOSSARY }): Promise<string>; }
export interface CachedTranslation { contentKey: string; locale: SupportedLocale; sourceHash: string; sourceText: string; translatedText: string; translationMethod: TranslationMethod; riskLevel: TranslationRisk; reviewStatus: TranslationReviewStatus; }
export function hashSourceText(sourceText: string): string { return createHash("sha256").update(sourceText, "utf8").digest("hex"); }
export function translationReviewStatus(riskLevel: TranslationRisk): TranslationReviewStatus { return riskLevel === "HIGH" ? "REVIEW_REQUIRED" : "AUTO_TRANSLATED"; }
export async function translateContent(request: TranslationRequest, provider: TranslationProvider): Promise<CachedTranslation> {
  const sourceLocale = request.sourceLocale ?? "en"; const riskLevel = request.riskLevel ?? "LOW"; const sourceHash = hashSourceText(request.sourceText); const supabase = createSupabaseServer();
  const { data: cached, error: lookupError } = await supabase.from("translation_entries").select("content_key, locale, source_hash, source_text, translated_text, translation_method, risk_level, review_status").eq("content_key", request.contentKey).eq("locale", request.locale).eq("source_hash", sourceHash).eq("review_status", "APPROVED").maybeSingle();
  if (lookupError) throw lookupError;
  if (cached) {
    return {
      contentKey: cached.content_key,
      locale: cached.locale,
      sourceHash: cached.source_hash,
      sourceText: cached.source_text,
      translatedText: cached.translated_text,
      translationMethod: cached.translation_method,
      riskLevel: cached.risk_level,
      reviewStatus: cached.review_status,
    };
  }
  const translatedText = await provider.translate({ sourceText: request.sourceText, sourceLocale, targetLocale: request.locale, glossary: MILANO_TRANSLATION_GLOSSARY }); const reviewStatus = translationReviewStatus(riskLevel);
  const row = { content_key: request.contentKey, locale: request.locale, source_locale: sourceLocale, source_hash: sourceHash, source_text: request.sourceText, translated_text: translatedText, translation_method: "ai" as const, risk_level: riskLevel, review_status: reviewStatus, model_version: "provider-managed", translated_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error: persistError } = await supabase.from("translation_entries").upsert(row, { onConflict: "content_key,locale,source_hash" }); if (persistError) throw persistError;
  return { contentKey: request.contentKey, locale: request.locale, sourceHash, sourceText: request.sourceText, translatedText, translationMethod: "ai", riskLevel, reviewStatus };
}
