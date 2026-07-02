import type { ReactNode } from "react";
import { DashboardSkeleton } from "./DashboardSkeleton";
import { DashboardEmptyState } from "./DashboardEmptyState";
import { DashboardErrorState } from "./DashboardErrorState";

// Reusable table shell. Desktop: sticky-header table. Mobile: stacked row cards (no
// horizontal scroll). Built-in loading / empty / error states. Presentational only
// (no client JS) — pass already-fetched, already-scoped rows from a server page.

export interface Column<Row> {
  key: string;
  header: string;
  /** Cell renderer. Keep it to polished labels — never dump raw DB rows. */
  render: (row: Row) => ReactNode;
  /** Hide on mobile stacked cards (e.g. low-priority columns). */
  hideOnMobile?: boolean;
  align?: "left" | "right";
}

export function DataTable<Row extends { id: string | number }>({
  columns,
  rows,
  loading = false,
  error = false,
  emptyTitle,
  emptyDescription,
  rowAction,
  rowHref,
}: {
  columns: Column<Row>[];
  rows: Row[];
  loading?: boolean;
  error?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  rowAction?: (row: Row) => ReactNode;
  rowHref?: (row: Row) => string;
}) {
  if (loading) return <DashboardSkeleton rows={5} />;
  if (error) return <DashboardErrorState />;
  if (!rows.length)
    return <DashboardEmptyState title={emptyTitle} description={emptyDescription} />;

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-xl border border-white/[0.07] md:block">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/[0.07] bg-white/[0.02]">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className={`px-4 py-3 font-mono text-[9px] uppercase tracking-[0.16em] text-muted-foreground ${
                    c.align === "right" ? "text-right" : "text-left"
                  }`}
                >
                  {c.header}
                </th>
              ))}
              {rowAction && <th className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.id}
                className="border-b border-white/[0.04] transition-colors last:border-0 hover:bg-white/[0.025]"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={`px-4 py-3 text-foreground/80 ${c.align === "right" ? "text-right" : "text-left"}`}
                  >
                    {c.render(row)}
                  </td>
                ))}
                {rowAction && <td className="px-4 py-3 text-right">{rowAction(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="space-y-2.5 md:hidden">
        {rows.map((row) => {
          const card = (
            <div
              key={row.id}
              data-critical-card=""
              className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4"
            >
              <div className="space-y-1.5">
                {columns
                  .filter((c) => !c.hideOnMobile)
                  .map((c) => (
                    <div key={c.key} className="flex items-start justify-between gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-muted-foreground">
                        {c.header}
                      </span>
                      <span className="min-w-0 text-right text-[13px] text-foreground/85">
                        {c.render(row)}
                      </span>
                    </div>
                  ))}
              </div>
              {rowAction && <div className="mt-3 flex justify-end">{rowAction(row)}</div>}
            </div>
          );
          return card;
        })}
      </div>
    </>
  );
}
