import { describe, expect, it } from "vitest";
import { LOCALIZED_SEO_RECORDS } from "@/lib/seo/localization/registry";
import {
  getLocalizedSeoRecord,
  getPublishedLocalizedRecords,
  isLocalizedSeoRecordPublishable,
  localizedPath,
  slugForLocalizedRecord,
} from "@/lib/seo/localization/runtime";
import type { LocalizedSeoRecord } from "@/lib/seo/localization/types";

function reviewedRecord(overrides: Partial<LocalizedSeoRecord> = {}): LocalizedSeoRecord {
  return {
    locale: "it-IT",
    path: "/it/example",
    englishEquivalent: "/professional",
    title: "Titolo",
    description: "Descrizione",
    h1: "Titolo principale",
    bodySections: { overview: "Contenuto revisionato." },
    ctaLabel: "Avvia richiesta",
    englishVersionLabel: "Versione inglese",
    legalBoundary: "I requisiti dell'autorità ricevente restano specifici per la pratica.",
    translationStatus: "HUMAN_REVIEWED",
    reviewedBy: "qualified-reviewer",
    reviewedAt: "2026-08-30",
    indexStatus: "INDEXABLE",
    ...overrides,
  };
}

describe("localized acquisition runtime", () => {
  it("keeps every reserved phase-one localized route fail-closed until human review", () => {
    expect(LOCALIZED_SEO_RECORDS).toHaveLength(8);
    for (const record of LOCALIZED_SEO_RECORDS) {
      expect(record.translationStatus).toBe("HUMAN_REVIEW_REQUIRED");
      expect(record.indexStatus).toBe("NOINDEX");
      expect(isLocalizedSeoRecordPublishable(record)).toBe(false);
    }
    expect(getPublishedLocalizedRecords("it-IT")).toEqual([]);
    expect(getPublishedLocalizedRecords("es-ES")).toEqual([]);
    expect(getPublishedLocalizedRecords("pt-BR")).toEqual([]);
  });

  it("requires complete reviewed copy and reviewer evidence before publication", () => {
    expect(isLocalizedSeoRecordPublishable(reviewedRecord())).toBe(true);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ reviewedBy: "" }))).toBe(false);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ reviewedAt: "" }))).toBe(false);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ ctaLabel: "" }))).toBe(false);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ legalBoundary: "" }))).toBe(false);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ bodySections: {} }))).toBe(false);
    expect(isLocalizedSeoRecordPublishable(reviewedRecord({ indexStatus: "NOINDEX" }))).toBe(false);
  });

  it("resolves only exact governed locale/path pairs", () => {
    const path = localizedPath("it", ["procura-apostille-stati-uniti"]);
    const record = getLocalizedSeoRecord("it-IT", path);
    expect(record?.englishEquivalent).toBe("/documents/power-of-attorney-apostille");
    expect(slugForLocalizedRecord(record!)).toEqual(["procura-apostille-stati-uniti"]);
    expect(getLocalizedSeoRecord("es-ES", path)).toBeUndefined();
  });
});
