// A Matter's price is issued to the client when the canonical engine (instant pricing) or an
// approved operator quote has produced a real final total and no review is outstanding.
// A missing total is never a complimentary $0.00 quote: it is "Pricing pending review".
export type PriceIssuedRow = {
  final_total?: unknown;
  quote_review_required?: unknown;
};

export function isPriceIssued(row: PriceIssuedRow | null | undefined): boolean {
  if (!row || row.final_total === null || row.final_total === undefined || row.final_total === "") return false;
  if (!Number.isFinite(Number(row.final_total))) return false;
  return row.quote_review_required !== true;
}
