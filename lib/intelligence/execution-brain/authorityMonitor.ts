// Authority monitor: low-risk fetch + diff of OFFICIAL government sources only
// (no headless browser). A detected change never rewrites canonical
// authority records, assets, fees or processing observations — it creates an
// authority_review_required row for an operator to decide.

import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { isOfficialGovernmentSource } from "./stateAuthorityProvenance";

export const AUTHORITY_CHANGE_KINDS = [
  "form_version_change",
  "fee_change",
  "submission_address_change",
  "processing_date_change",
  "submission_method_change",
  "authority_notice_change",
] as const;
export type AuthorityChangeKind = (typeof AUTHORITY_CHANGE_KINDS)[number];

export interface SourceFacts {
  kind: "html" | "binary";
  contentHash: string;
  fees: string[];
  addresses: string[];
  processingDates: string[];
  submissionMethods: string[];
  formVersions: string[];
}

const MAX_BYTES = 5 * 1024 * 1024;
const MONTH = "(?:January|February|March|April|May|June|July|August|September|October|November|December)";
const sha256 = (value: string | Uint8Array) => createHash("sha256").update(value).digest("hex");
const uniqueSorted = (values: Iterable<string>) => [...new Set([...values].map((v) => v.replace(/\s+/g, " ").trim()).filter(Boolean))].sort();

/** Visible text only: scripts, styles and markup removed; whitespace collapsed. */
export function normalizeSourceText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/\s+/g, " ")
    .trim();
}

/** Deterministic fact extraction for change classification (evidence only, never law). */
export function extractSourceFacts(content: string | Uint8Array, contentType: string | null): SourceFacts {
  if (typeof content !== "string" || /pdf|octet-stream/i.test(contentType ?? "")) {
    return { kind: "binary", contentHash: sha256(content), fees: [], addresses: [], processingDates: [], submissionMethods: [], formVersions: [] };
  }
  const links = [...content.matchAll(/href\s*=\s*["']([^"']+\.pdf)["']/gi)].map((match) => match[1].split("/").pop() ?? match[1]);
  const text = normalizeSourceText(content);
  const lower = text.toLowerCase();
  const processingDates = [...text.matchAll(/processing[^.]{0,120}/gi)]
    .map((match) => match[0])
    .flatMap((segment) => [...segment.matchAll(new RegExp(`${MONTH}\\s+\\d{1,2},?\\s+\\d{4}|\\d{1,2}/\\d{1,2}/\\d{2,4}`, "g"))].map((m) => m[0]));
  const methods = [
    ["mail", /\bby mail\b|\bmail(?:ed)? to\b|\bmailing address\b/],
    ["in_person", /\bin[- ]person\b|\bwalk[- ]in\b|\bcounter\b/],
    ["online", /\bonline\b|\belectronic(?:ally)? submi/],
    ["drop_off", /\bdrop[- ]off\b|\bdrop box\b/],
    ["courier", /\bcourier\b|\bovernight\b/],
  ] as const;
  const formVersions = uniqueSorted([...links, ...[...text.matchAll(/\b(?:rev(?:ised)?\.?|form version)\s*[:#]?\s*[\w/.-]{3,20}/gi)].map((m) => m[0])]);
  return {
    kind: "html",
    // Visible text plus linked official documents: a form swapped behind an
    // unchanged link label is still a change.
    contentHash: sha256(`${text}\n${formVersions.join("|")}`),
    fees: uniqueSorted([...text.matchAll(/\$\s?\d{1,4}(?:[.,]\d{2})?/g)].map((m) => m[0].replace(/\s/g, ""))),
    addresses: uniqueSorted([
      ...[...text.matchAll(/P\.?\s?O\.?\s?Box\s+\d+/gi)].map((m) => m[0].toUpperCase().replace(/\./g, "")),
      ...[...text.matchAll(/[A-Z][a-zA-Z]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?/g)].map((m) => m[0]),
    ]),
    processingDates: uniqueSorted(processingDates),
    submissionMethods: uniqueSorted(methods.filter(([, pattern]) => pattern.test(lower)).map(([name]) => name)),
    formVersions,
  };
}

const same = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((value, index) => value === b[index]);

/** Classifies what changed between two snapshots of the same official source. */
export function diffSourceFacts(previous: SourceFacts, next: SourceFacts): AuthorityChangeKind[] {
  if (previous.contentHash === next.contentHash) return [];
  if (previous.kind === "binary" || next.kind === "binary") return ["form_version_change"];
  const changes: AuthorityChangeKind[] = [];
  if (!same(previous.formVersions, next.formVersions)) changes.push("form_version_change");
  if (!same(previous.fees, next.fees)) changes.push("fee_change");
  if (!same(previous.addresses, next.addresses)) changes.push("submission_address_change");
  if (!same(previous.processingDates, next.processingDates)) changes.push("processing_date_change");
  if (!same(previous.submissionMethods, next.submissionMethods)) changes.push("submission_method_change");
  return changes.length ? changes : ["authority_notice_change"];
}

export type SourceFetcher = (url: string) => Promise<{ status: number; contentType: string | null; body: string | Uint8Array }>;

/** Default fetcher: official government hosts only, bounded time and size. */
export const fetchOfficialSource: SourceFetcher = async (url) => {
  if (!isOfficialGovernmentSource(url)) throw new Error("NON_OFFICIAL_SOURCE");
  const response = await fetch(url, { signal: AbortSignal.timeout(15_000), redirect: "follow", headers: { "User-Agent": "MilanoSealAuthorityMonitor/1.0" } });
  if (!isOfficialGovernmentSource(response.url || url)) throw new Error("NON_OFFICIAL_REDIRECT");
  const contentType = response.headers.get("content-type");
  const buffer = new Uint8Array(await response.arrayBuffer());
  if (buffer.byteLength > MAX_BYTES) throw new Error("SOURCE_TOO_LARGE");
  const body = /text|html|json|xml/i.test(contentType ?? "") ? new TextDecoder().decode(buffer) : buffer;
  return { status: response.status, contentType, body };
};

export interface MonitorTarget {
  authorityId: string;
  sourceUrl: string;
}

export interface MonitorResult {
  checked: number;
  baselined: number;
  unchanged: number;
  reviewsCreated: number;
  skipped: Array<{ sourceUrl: string; reason: string }>;
}

/**
 * Runs the monitor over official sources. Writes only snapshots and review
 * rows; never touches state_authorities, authority_source_assets or
 * authority_processing_observations.
 */
export async function runAuthorityMonitor(
  db: SupabaseClient,
  targets: readonly MonitorTarget[],
  fetcher: SourceFetcher = fetchOfficialSource,
): Promise<MonitorResult> {
  const result: MonitorResult = { checked: 0, baselined: 0, unchanged: 0, reviewsCreated: 0, skipped: [] };
  const seen = new Set<string>();
  for (const target of targets) {
    const key = `${target.authorityId}|${target.sourceUrl}`;
    if (seen.has(key)) continue;
    seen.add(key);
    if (!isOfficialGovernmentSource(target.sourceUrl)) {
      result.skipped.push({ sourceUrl: target.sourceUrl, reason: "NON_OFFICIAL_SOURCE" });
      continue;
    }
    let fetched;
    try {
      fetched = await fetcher(target.sourceUrl);
    } catch (error) {
      result.skipped.push({ sourceUrl: target.sourceUrl, reason: error instanceof Error ? error.message.slice(0, 80) : "FETCH_FAILED" });
      continue;
    }
    if (fetched.status < 200 || fetched.status >= 300) {
      result.skipped.push({ sourceUrl: target.sourceUrl, reason: `HTTP_${fetched.status}` });
      continue;
    }
    result.checked += 1;
    const facts = extractSourceFacts(fetched.body, fetched.contentType);

    const { data: previous } = await db
      .from("authority_source_snapshots")
      .select("snapshot_hash, facts")
      .eq("authority_id", target.authorityId)
      .eq("source_url", target.sourceUrl)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (previous?.snapshot_hash === facts.contentHash) {
      result.unchanged += 1;
      continue;
    }
    const { error: snapshotError } = await db.from("authority_source_snapshots").insert({
      authority_id: target.authorityId,
      source_url: target.sourceUrl,
      snapshot_hash: facts.contentHash,
      facts,
      http_status: fetched.status,
    });
    if (snapshotError) {
      result.skipped.push({ sourceUrl: target.sourceUrl, reason: "SNAPSHOT_PERSIST_FAILED" });
      continue;
    }
    if (!previous) {
      result.baselined += 1;
      continue;
    }
    const changes = diffSourceFacts(previous.facts as SourceFacts, facts);
    const { error: reviewError } = await db.from("authority_review_required").upsert(
      {
        authority_id: target.authorityId,
        source_url: target.sourceUrl,
        previous_snapshot_hash: previous.snapshot_hash,
        new_snapshot_hash: facts.contentHash,
        change_detected: changes,
        review_status: "PENDING",
      },
      { onConflict: "authority_id,source_url,new_snapshot_hash", ignoreDuplicates: true },
    );
    if (reviewError) result.skipped.push({ sourceUrl: target.sourceUrl, reason: "REVIEW_PERSIST_FAILED" });
    else result.reviewsCreated += 1;
  }
  return result;
}

/** Monitor targets: authority official sources + active official asset sources. */
export async function loadMonitorTargets(db: SupabaseClient): Promise<MonitorTarget[]> {
  const [{ data: authorities }, { data: assets }] = await Promise.all([
    db.from("state_authorities").select("id, official_source_url"),
    db.from("authority_source_assets").select("authority_id, official_source_url").eq("status", "ACTIVE"),
  ]);
  const targets: MonitorTarget[] = [];
  for (const row of authorities ?? []) {
    if (row.official_source_url) targets.push({ authorityId: row.id, sourceUrl: row.official_source_url });
  }
  for (const row of assets ?? []) {
    if (row.official_source_url) targets.push({ authorityId: row.authority_id, sourceUrl: row.official_source_url });
  }
  return targets.filter((target) => isOfficialGovernmentSource(target.sourceUrl));
}
