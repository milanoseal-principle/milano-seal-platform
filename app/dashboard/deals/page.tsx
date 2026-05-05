"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useApi } from "@/hooks/useApi";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, stageLabel, stageTone, timeAgo } from "@/lib/format";
import { Search } from "lucide-react";

interface DealRow {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  company_name: string | null;
  document_type: string;
  destination_country: string;
  origin_state: string;
  lane: string;
  total_price: number;
  payment_status: string;
  deal_status: string;
  created_at: string;
}

const STAGES = [
  "all",
  "new",
  "reviewing",
  "quoted",
  "awaiting_payment",
  "scheduled",
  "in_execution",
  "apostille",
  "shipped",
  "completed",
  "lost",
];

export default function Deals() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [paid, setPaid] = useState<string>("all");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (paid !== "all") params.set("payment_status", paid);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/api/deals?${qs}` : "/api/deals";
  }, [status, paid, search]);

  const { data, isLoading } = useApi<DealRow[]>(url);

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-2">
          Matters
        </p>
        <h1 className="font-serif text-4xl text-foreground">All Matters</h1>
      </div>

      <Card className="bg-card border-gold">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, email, ref, country…"
                className="pl-9 w-full"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                data-testid="input-search"
              />
            </div>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === "all" ? "All stages" : stageLabel(s)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={paid} onValueChange={setPaid}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any payment</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground text-sm py-8 text-center">
              Loading…
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-muted-foreground text-sm py-8 text-center">
              No matters found.
            </div>
          ) : (
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reference</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Document</TableHead>
                  <TableHead>Destination</TableHead>
                  <TableHead>Lane</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right">Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow
                    key={d.deal_id}
                    className="cursor-pointer"
                    data-testid={`row-${d.deal_id}`}
                  >
                    <TableCell>
                      <Link href={`/dashboard/deals/${d.deal_id ?? d.id}`}>
                        <span className="font-mono text-xs text-gold hover:underline">
                          {d.deal_id ?? `${d.id.slice(0, 8)}…`}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-foreground">
                      <div className="flex flex-col">
                        <span>{d.client_name ?? "—"}</span>
                        {d.company_name && (
                          <span className="text-xs text-muted-foreground">
                            {d.company_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground/80">
                      {d.document_type}
                    </TableCell>
                    <TableCell className="text-sm">
                      {d.destination_country}
                      <div className="text-xs text-muted-foreground">
                        from {d.origin_state}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="border-gold text-gold bg-gold-soft"
                      >
                        {d.lane}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {formatCurrency(d.total_price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          d.payment_status === "paid" ? "bg-paid" : "bg-await"
                        }
                      >
                        {d.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          stageTone(d.deal_status) === "paid"
                            ? "bg-paid"
                            : stageTone(d.deal_status) === "critical"
                            ? "bg-critical"
                            : "bg-await"
                        }
                      >
                        {stageLabel(d.deal_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {timeAgo(d.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
