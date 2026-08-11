"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useApi } from "@/hooks/useApi";
import { formatCurrencyDetailed } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface ProFormaMatter {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  document_type: string | null;
  destination_country: string | null;
  lane: string;
  base_price: number;
  witness_total: number;
  total_price: number;
  invoice_retainer: number | null;
  invoice_balance: number | null;
  payment_status: string;
}

export default function MatterProFormaPage() {
  const { id } = useParams<{ id: string }>();
  const { data: matter, error, isLoading } = useApi<ProFormaMatter>(
    `/api/deals/${encodeURIComponent(id)}`,
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 p-6 md:p-10">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (error || !matter) {
    return (
      <div className="mx-auto max-w-4xl p-6 md:p-10">
        <Card className="border-gold bg-card">
          <CardContent className="p-8">
            <h1 className="font-serif text-2xl">Pro Forma unavailable</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The Matter quote could not be loaded. No payment amount has been changed.
            </p>
            <Link className="mt-6 inline-block text-sm text-gold hover:underline" href={`/dashboard/deals/${id}`}>
              Return to Matter
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const retainer = Number(matter.invoice_retainer ?? 0);
  const balance = Number(matter.invoice_balance ?? matter.total_price - retainer);
  const reference = matter.deal_id ?? matter.id;

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] md:p-10">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-gold">Invoice &amp; Payment Authorization</p>
        <h1 className="mt-2 font-serif text-3xl">Pro Forma</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Server-approved pricing for Matter {reference}.
        </p>
      </div>

      <Card className="border-gold bg-card">
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.22em] text-gold">The Milano Seal</p>
              <CardTitle className="mt-2 font-serif text-2xl">{matter.client_name ?? "Matter Client"}</CardTitle>
            </div>
            <div className="text-left text-xs text-muted-foreground sm:text-right">
              <div>{reference}</div>
              <div className="mt-1 uppercase tracking-widest">{matter.payment_status}</div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5 p-6 md:p-8">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Execution lane</p>
              <p className="mt-1 font-medium">{matter.lane}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Matter pathway</p>
              <p className="mt-1 font-medium">
                {matter.document_type ?? "Document execution"}
                {matter.destination_country ? ` - ${matter.destination_country}` : ""}
              </p>
            </div>
          </div>

          <div className="space-y-3 border-y border-border py-5 text-sm">
            <div className="flex justify-between gap-4"><span>Lane base</span><span>{formatCurrencyDetailed(matter.base_price)}</span></div>
            {matter.witness_total > 0 && (
              <div className="flex justify-between gap-4"><span>Witness coordination</span><span>{formatCurrencyDetailed(matter.witness_total)}</span></div>
            )}
            <div className="flex justify-between gap-4 text-base font-semibold"><span>Approved total</span><span className="text-gold">{formatCurrencyDetailed(matter.total_price)}</span></div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-md border border-gold/30 bg-gold/5 p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Retainer due</p>
              <p className="mt-2 font-serif text-2xl text-gold">{formatCurrencyDetailed(retainer)}</p>
            </div>
            <div className="rounded-md border border-border p-4">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Balance before release</p>
              <p className="mt-2 font-serif text-2xl">{formatCurrencyDetailed(balance)}</p>
            </div>
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            Pricing is read from the saved Matter quote. Payment-Gated Execution remains locked until Wise payment confirmation or an audited complimentary authorization.
          </p>
        </CardContent>
      </Card>

      <Link className="inline-flex min-h-11 items-center rounded-md border border-gold/40 px-4 text-sm text-gold hover:bg-gold/5" href={`/dashboard/deals/${reference}`}>
        Return to Matter cockpit
      </Link>
    </div>
  );
}
