// AUTO-GENERATED SOURCE CONTRACT
// Complete workbook payload is ingested from the locked Legal Compliance Engine artifact during build/deployment packaging.
// Runtime routes must fail closed when a sheet payload is unavailable rather than inventing data.

export type WorkbookSheetSource = {
  range: string;
  rows: unknown[][];
  formulas?: string[][];
};

export const WORKBOOK_SOURCE: Record<string, WorkbookSheetSource> = {};

export function hasWorkbookSource(sheet: string) {
  return Boolean(WORKBOOK_SOURCE[sheet]);
}
