// AUTO-GENERATED FROM Milano Seal Legal Compliance Engine (3).xlsx
// Exact values + formulas preserved. Do not hand-edit workbook source data.
// The payload is gzip-compressed JSON split into deterministic shards for repository transport.
// Runtime decoding is server-only; workbook evidence remains immutable and runtime behavior is layered separately.

import "server-only";
import { gunzipSync } from "node:zlib";

import chunk0 from "./payload/chunk0";
import chunk1 from "./payload/chunk1";
import chunk2a from "./payload/chunk2a";
import chunk2b from "./payload/chunk2b";
import chunk2 from "./payload/chunk2";
import chunk3 from "./payload/chunk3";
import chunk4 from "./payload/chunk4";
import chunk5 from "./payload/chunk5";
import chunk6 from "./payload/chunk6";
import chunk7 from "./payload/chunk7";
import chunk8 from "./payload/chunk8";
import chunk9 from "./payload/chunk9";

export type WorkbookSheetSource = {
  range: string;
  rows: unknown[][];
  formulas?: string[][];
};

const WORKBOOK_SOURCE_GZIP_BASE64 = [
  chunk0,
  chunk1,
  chunk2a,
  chunk2b,
  chunk2,
  chunk3,
  chunk4,
  chunk5,
  chunk6,
  chunk7,
  chunk8,
  chunk9,
].join("");

const decodedWorkbookSource = gunzipSync(
  Buffer.from(WORKBOOK_SOURCE_GZIP_BASE64, "base64"),
).toString("utf8");

export const WORKBOOK_SOURCE = JSON.parse(
  decodedWorkbookSource,
) as Record<string, WorkbookSheetSource>;

export function hasWorkbookSource(sheet: string) {
  return Boolean(WORKBOOK_SOURCE[sheet]);
}
