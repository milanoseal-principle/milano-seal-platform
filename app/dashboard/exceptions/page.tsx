import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadExceptionQueue } from "@/lib/dashboard/exceptionQueue";
import { ExceptionGroup } from "@/components/dashboard/ExceptionGroup";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface ExceptionItem {
  id: string;
  display_id?: string;
  matter_id?: string;
  amount_due?: number;
  amount_paid?: number;
  deal_status?: string;
  document_type?: string;
  destination_country?: string;
  failure_type?: string;
  created_at?: string;
  tracking_status?: string;
  task_type?: string;
  due_at?: string;
  title?: string;
  escalation_reason?: string;
  next_action?: string;
  status?: string;
}

interface ExceptionsData {
  exceptions: {
    payment_mismatch: ExceptionItem[];
    partial_payments: ExceptionItem[];
    missing_documents: ExceptionItem[];
    address_review: ExceptionItem[];
    ron_failures: ExceptionItem[];
    courier_exceptions: ExceptionItem[];
    delivered_not_released: ExceptionItem[];
    overdue_tasks: ExceptionItem[];
    escalated_tasks: ExceptionItem[];
    translation_required: ExceptionItem[];
  };
  summary: {
    total: number;
    critical: number;
    review: number;
  };
}

function EmptyState({ label }: { label: string }) {
  return (
    <p className="text-xs text-muted-foreground font-mono py-1">
      No {label} exceptions.
    </p>
  );
}

function ItemRow({
  item,
  description,
  href,
}: {
  item: ExceptionItem;
  description: string;
  href: string;
}) {
  const ref = item.display_id ?? item.matter_id ?? item.id?.slice(0, 8);
  return (
    <div className="flex items-center justify-between gap-3 py-2 border-b border-[rgba(198,165,90,0.06)] last:border-0">
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="font-mono text-[11px] text-[rgba(198,165,90,0.8)]">{ref}</span>
        <span className="text-xs text-muted-foreground">{description}</span>
      </div>
      <Link
        href={href}
        className="text-xs font-mono text-[rgba(198,165,90,0.6)] hover:text-[rgba(198,165,90,1)] whitespace-nowrap"
      >
        View →
      </Link>
    </div>
  );
}

export default async function ExceptionsPage() {
  await requireDashboardAccess();
  // Read directly with the verified operator context; an HTTP self-fetch carried no session.
  let data: (ExceptionsData & { unavailable?: string[] }) | null = null;
  try {
    data = (await loadExceptionQueue(createAdminClient())) as unknown as ExceptionsData & { unavailable?: string[] };
  } catch {
    data = null;
  }
  const unavailable = data ? (data.unavailable ?? []) : ["all panels"];

  const ex = data?.exceptions ?? {
    payment_mismatch: [],
    partial_payments: [],
    missing_documents: [],
    address_review: [],
    ron_failures: [],
    courier_exceptions: [],
    delivered_not_released: [],
    overdue_tasks: [],
    escalated_tasks: [],
    translation_required: [],
  };
  const summary = data?.summary ?? { total: 0, critical: 0, review: 0 };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[rgba(198,165,90,0.7)] font-medium mb-2">
          Operator Exception Center
        </p>
        <h1 className="font-serif text-4xl text-foreground">Exception Queue</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          All blocked, stuck, and review-required items across active matters.
        </p>
        {unavailable.length > 0 && (
          <p role="status" className="mt-4 max-w-xl rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-200">
            Some sources could not be read, so their counts are incomplete: {unavailable.join(", ").replaceAll("_", " ")}.
          </p>
        )}
      </div>

      {/* Summary strip */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-[rgba(198,165,90,0.2)] bg-[rgba(198,165,90,0.06)]">
          <span className="text-[11px] uppercase tracking-widest text-muted-foreground font-mono">
            Total Exceptions
          </span>
          <span className="font-serif text-2xl text-[rgba(198,165,90,0.9)]">
            {summary.total}
          </span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-red-600/30 bg-red-950/20">
          <span className="text-[11px] uppercase tracking-widest text-red-400/70 font-mono">
            Critical
          </span>
          <span className="font-serif text-2xl text-red-400">{summary.critical}</span>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 rounded-md border border-amber-600/30 bg-amber-950/20">
          <span className="text-[11px] uppercase tracking-widest text-amber-400/70 font-mono">
            Review Required
          </span>
          <span className="font-serif text-2xl text-amber-400">{summary.review}</span>
        </div>
      </div>

      {/* Exception groups — critical first */}
      <div className="space-y-2">
        {/* RON Failures */}
        <ExceptionGroup
          title="RON Failures"
          count={ex.ron_failures.length}
          severity="critical"
        >
          {ex.ron_failures.length === 0 ? (
            <EmptyState label="RON failure" />
          ) : (
            ex.ron_failures.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Failure: ${item.failure_type ?? "unknown"}`}
                href={`/dashboard/deals/${item.matter_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Delivered Not Released */}
        <ExceptionGroup
          title="Delivered — Not Released"
          count={ex.delivered_not_released.length}
          severity="critical"
        >
          {ex.delivered_not_released.length === 0 ? (
            <EmptyState label="delivered-not-released" />
          ) : (
            ex.delivered_not_released.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Status: ${item.deal_status}`}
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Payment Mismatch */}
        <ExceptionGroup
          title="Payment Mismatch"
          count={ex.payment_mismatch.length}
          severity="critical"
        >
          {ex.payment_mismatch.length === 0 ? (
            <EmptyState label="payment mismatch" />
          ) : (
            ex.payment_mismatch.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Due: $${item.amount_due ?? 0} · Paid: $${item.amount_paid ?? 0}`}
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Address Review */}
        <ExceptionGroup
          title="Address Review (Blocked)"
          count={ex.address_review.length}
          severity="review"
        >
          {ex.address_review.length === 0 ? (
            <EmptyState label="address review" />
          ) : (
            ex.address_review.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description="Courier review task blocked"
                href={`/dashboard/deals/${item.matter_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Overdue Tasks */}
        <ExceptionGroup
          title="Overdue Tasks"
          count={ex.overdue_tasks.length}
          severity="review"
        >
          {ex.overdue_tasks.length === 0 ? (
            <EmptyState label="overdue task" />
          ) : (
            ex.overdue_tasks.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Task: ${item.task_type ?? "unknown"} · Due: ${item.due_at ? new Date(item.due_at).toLocaleDateString() : "—"}`}
                href={`/dashboard/deals/${item.matter_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Escalated Tasks */}
        <ExceptionGroup
          title="Escalated Tasks"
          count={ex.escalated_tasks.length}
          severity="review"
        >
          {ex.escalated_tasks.length === 0 ? (
            <EmptyState label="escalated task" />
          ) : (
            ex.escalated_tasks.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={item.next_action ?? item.task_type ?? "Escalated"}
                href={`/dashboard/deals/${item.matter_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Partial Payments */}
        <ExceptionGroup
          title="Partial Payments"
          count={ex.partial_payments.length}
          severity="info"
        >
          {ex.partial_payments.length === 0 ? (
            <EmptyState label="partial payment" />
          ) : (
            ex.partial_payments.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Paid $${item.amount_paid ?? 0} of $${item.amount_due ?? 0}`}
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Missing Documents */}
        <ExceptionGroup
          title="Missing Documents"
          count={ex.missing_documents.length}
          severity="info"
        >
          {ex.missing_documents.length === 0 ? (
            <EmptyState label="missing document" />
          ) : (
            ex.missing_documents.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`${item.document_type ?? "document"} → ${item.destination_country ?? "—"}`}
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Courier Exceptions */}
        <ExceptionGroup
          title="Courier Exceptions"
          count={ex.courier_exceptions.length}
          severity="info"
        >
          {ex.courier_exceptions.length === 0 ? (
            <EmptyState label="courier exception" />
          ) : (
            ex.courier_exceptions.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Tracking status: ${(item.status ?? item.tracking_status) ?? "exception"}`}
                href={`/dashboard/deals/${item.matter_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>

        {/* Translation Required */}
        <ExceptionGroup
          title="Translation Required"
          count={ex.translation_required.length}
          severity="info"
        >
          {ex.translation_required.length === 0 ? (
            <EmptyState label="translation" />
          ) : (
            ex.translation_required.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                description={`Destination: ${item.destination_country ?? "—"}`}
                href={`/dashboard/deals/${item.display_id ?? item.id}`}
              />
            ))
          )}
        </ExceptionGroup>
      </div>
    </div>
  );
}
