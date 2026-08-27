import { createAdminClient } from "@/lib/supabase/admin";

export const MATTER_PROJECTION_PAGE_SIZE = 500;

export type ProjectionPageReader<T> = (offset: number, limit: number) => Promise<readonly T[]>;

export async function collectAllProjectionRows<T>(
  readPage: ProjectionPageReader<T>,
  pageSize = MATTER_PROJECTION_PAGE_SIZE,
): Promise<T[]> {
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > 1000) {
    throw new Error("Projection page size must be an integer between 1 and 1000.");
  }

  const rows: T[] = [];
  let offset = 0;

  for (;;) {
    const page = await readPage(offset, pageSize);
    if (page.length > pageSize) {
      throw new Error("Projection page reader returned more rows than requested.");
    }

    rows.push(...page);

    if (page.length < pageSize) break;
    offset += pageSize;
  }

  return rows;
}

/**
 * Read-only canonical Matter scan for server-side intelligence projections.
 *
 * This does not mutate Matter state and never moves raw Matter hydration into
 * the browser. Stable created_at + id ordering and bounded PostgREST pages
 * ensure Matters beyond row 500 are included without silent truncation.
 */
export async function readAllDealsForProjection<T extends Record<string, unknown> = Record<string, unknown>>(): Promise<T[]> {
  const supabase = createAdminClient();

  return collectAllProjectionRows<T>(async (offset, limit) => {
    const { data, error } = await supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[readAllDealsForProjection]", { code: error.code, message: error.message, offset, limit });
      throw new Error("Failed to read canonical Matter projection rows.");
    }

    return (data ?? []) as T[];
  });
}
