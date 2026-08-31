import test from "node:test";
import assert from "node:assert/strict";
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

test("localized routes stay fail-closed until complete human review", () => {
  assert.equal(LOCALIZED_SEO_RECORDS.length, 8);
  for (const record of LOCALIZED_SEO_RECORDS) {
    assert.equal(record.translationStatus, "HUMAN_REVIEW_REQUIRED");
    assert.equal(record.indexStatus, "NOINDEX");
    assert.equal(isLocalizedSeoRecordPublishable(record), false);
  }
  assert.deepEqual(getPublishedLocalizedRecords("it-IT"), []);
  assert.deepEqual(getPublishedLocalizedRecords("es-ES"), []);
  assert.deepEqual(getPublishedLocalizedRecords("pt-BR"), []);
});

test("localized publication requires reviewed copy and reviewer evidence", () => {
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord()), true);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ reviewedBy: "" })), false);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ reviewedAt: "" })), false);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ ctaLabel: "" })), false);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ legalBoundary: "" })), false);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ bodySections: {} })), false);
  assert.equal(isLocalizedSeoRecordPublishable(reviewedRecord({ indexStatus: "NOINDEX" })), false);
});

test("localized runtime resolves exact governed locale/path pairs only", () => {
  const path = localizedPath("it", ["procura-apostille-stati-uniti"]);
  const record = getLocalizedSeoRecord("it-IT", path);
  assert.equal(record?.englishEquivalent, "/documents/power-of-attorney-apostille");
  assert.deepEqual(slugForLocalizedRecord(record!), ["procura-apostille-stati-uniti"]);
  assert.equal(getLocalizedSeoRecord("es-ES", path), undefined);
});
