"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatCurrency,
  stageLabel,
  stageBadgeClasses,
  paymentBadgeClasses,
  timeAgo,
} from "@/lib/format";
import { Search, X } from "lucide-react";

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

interface PipelineResponse {
  stages: { stage: string; count: number }[];
  total_open: number;
}

const FILTER_STAGES = [
  { value: "all", label: "All" },
  { value: "reviewing", label: "In Review" },
  { value: "awaiting_payment", label: "Awaiting Payment" },
  { value: "scheduled", label: "Scheduled" },
  { value: "in_execution", label: "In Execution" },
  { value: "apostille", label: "Apostille" },
  { value: "shipped", label: "Shipped" },
  { value: "completed", label: "Completed" },
];

export default function Deals() {
  const [status, setStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [paid, setPaid] = useState<string>("all");
  const [drawerMatter, setDrawerMatter] = useState<{
    id: string;
    ref?: string;
    client_name?: string;
    email?: string;
    status?: string;
    payment_status?: string;
    service_type?: string;
    destination_country?: string;
    total_price?: number;
  } | null>(null);

  const { data: pipeline } = useApi<PipelineResponse>("/api/admin/pipeline");

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    if (paid !== "all") params.set("payment_status", paid);
    if (search) params.set("search", search);
    const qs = params.toString();
    return qs ? `/api/deals?${qs}` : "/api/deals";
  }, [status, paid, search]);

  const { data, isLoading } = useApi<DealRow[]>(url);

  const stageCount = (stage: string) => {
    if (stage === "all") return pipeline?.total_open ?? null;
    return pipeline?.stages.find((s) => s.stage === stage)?.count ?? null;
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-2">
          Execution Queue
        </p>
        <h1 className="font-serif text-4xl text-foreground">All Matters</h1>
      </div>

      {/* Stage filter pills */}
      <div className="flex flex-wrap gap-2">
        {FILTER_STAGES.map((s) => {
          const active = status === s.value;
          const count = stageCount(s.value);
          return (
            <button
              key={s.value}
              onClick={() => setStatus(s.value)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors border cursor-pointer ${
                active
                  ? "text-[#D4AF37] bg-[#D4AF37]/5 border-[#D4AF37]/30"
                  : "text-muted-foreground bg-transparent border-gray-800 hover:border-gray-700 hover:text-foreground"
              }`}
            >
              {s.label}
              {count !== null && (
                <span
                  className={`text-[9px] font-mono ${active ? "text-[#D4AF37]/70" : "text-gray-600"}`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="bg-[#0c0c12] border border-gray-900 rounded-sm">
        {/* Search + payment filter header */}
        <div className="p-4 border-b border-gray-900 flex flex-col sm:flex-row gap-3 sm:items-center flex-wrap">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by client, email, ref, country..."
              className="pl-9 w-full bg-transparent border-gray-800 focus:border-[#D4AF37]/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              data-testid="input-search"
            />
          </div>
          <div className="flex gap-2 shrink-0">
            {["all", "paid", "unpaid"].map((p) => (
              <button
                key={p}
                onClick={() => setPaid(p)}
                className={`px-3 py-1.5 rounded-sm text-xs border transition-colors cursor-pointer ${
                  paid === p
                    ? "text-[#D4AF37] bg-[#D4AF37]/5 border-[#D4AF37]/30"
                    : "text-muted-foreground border-gray-800 hover:border-gray-700"
                }`}
              >
                {p === "all"
                  ? "Any payment"
                  : p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-900 hover:bg-transparent">
                  {[
                    "Reference",
                    "Client",
                    "Document",
                    "Destination",
                    "Lane",
                    "Total",
                    "Payment",
                    "Stage",
                    "Created",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-[9px] font-mono tracking-widest uppercase text-gray-500 p-3"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={i} className="border-gray-900/50">
                    <TableCell className="p-3">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell className="p-3">
                      <div className="flex flex-col gap-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <Skeleton className="h-5 w-16 rounded-sm" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                    <TableCell className="p-3">
                      <Skeleton className="h-5 w-14 rounded-sm" />
                    </TableCell>
                    <TableCell className="p-3">
                      <Skeleton className="h-5 w-20 rounded-sm" />
                    </TableCell>
                    <TableCell className="p-3 text-right">
                      <Skeleton className="h-4 w-16 ml-auto" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : !data || data.length === 0 ? (
          <div className="text-muted-foreground text-sm py-12 text-center">
            No matters found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-900 hover:bg-transparent">
                  {[
                    "Reference",
                    "Client",
                    "Document",
                    "Destination",
                    "Lane",
                    "Total",
                    "Payment",
                    "Stage",
                    "Created",
                  ].map((h) => (
                    <TableHead
                      key={h}
                      className="text-[9px] font-mono tracking-widest uppercase text-gray-500 p-3"
                    >
                      {h}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <motion.tr
                    key={d.deal_id}
                    className="border-b border-gray-900/50 cursor-pointer"
                    data-testid={`row-${d.deal_id}`}
                    onClick={() =>
                      setDrawerMatter({
                        id: d.deal_id ?? d.id,
                        ref: d.deal_id ?? undefined,
                        client_name: d.client_name ?? undefined,
                        status: d.deal_status,
                        payment_status: d.payment_status,
                        service_type: d.document_type,
                        destination_country: d.destination_country,
                        total_price: d.total_price,
                      })
                    }
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.015)",
                      x: 2,
                      transition: { duration: 0.15, ease: "easeOut" }
                    }}
                  >
                    <TableCell className="p-3">
                      <Link
                        href={`/dashboard/deals/${d.deal_id ?? d.id}`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-mono text-xs text-[#D4AF37] hover:underline">
                          {d.deal_id ?? `${d.id.slice(0, 8)}...`}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="p-3 text-foreground">
                      <div className="flex flex-col">
                        <span className="font-serif text-sm">
                          {d.client_name ?? "--"}
                        </span>
                        {d.company_name && (
                          <span className="text-xs text-muted-foreground">
                            {d.company_name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="p-3 text-sm text-foreground/80">
                      {d.document_type}
                    </TableCell>
                    <TableCell className="p-3 text-sm">
                      {d.destination_country}
                      <div className="text-xs text-muted-foreground">
                        from {d.origin_state}
                      </div>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge
                        variant="outline"
                        className="border-[#D4AF37]/15 text-[#D4AF37] bg-[#D4AF37]/5 rounded-sm text-[10px]"
                      >
                        {d.lane}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-right font-mono text-sm">
                      {formatCurrency(d.total_price)}
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge
                        variant="outline"
                        className={`rounded-sm text-[10px] ${paymentBadgeClasses(d.payment_status)}`}
                      >
                        {d.payment_status}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3">
                      <Badge
                        variant="outline"
                        className={`rounded-sm text-[10px] ${stageBadgeClasses(d.deal_status)}`}
                      >
                        {stageLabel(d.deal_status)}
                      </Badge>
                    </TableCell>
                    <TableCell className="p-3 text-right text-xs text-muted-foreground font-mono">
                      {timeAgo(d.created_at)}
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Slide-over matter drawer */}
      <AnimatePresence>
        {drawerMatter && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerMatter(null)}
              className="fixed inset-0 bg-black z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 180 }}
              className="fixed inset-y-0 right-0 w-96 bg-[#09090d] border-l border-gray-900 z-50 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="p-5 border-b border-gray-900 flex items-start justify-between flex-shrink-0">
                <div>
                  <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">
                    Matter Reference
                  </div>
                  <div className="text-[#D4AF37] font-mono font-bold text-sm mt-0.5">
                    {drawerMatter.ref ??
                      drawerMatter.id.slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => setDrawerMatter(null)}
                  className="p-1 hover:bg-white/5 rounded-sm transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500 hover:text-white" />
                </button>
              </div>

              {/* Body — scrollable */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                {/* Client */}
                <div>
                  <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                    Client Matter
                  </div>
                  <div className="text-white font-serif text-base">
                    {drawerMatter.client_name ?? drawerMatter.email ?? "—"}
                  </div>
                </div>

                {/* Details grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                      Document Type
                    </div>
                    <div className="text-gray-300">
                      {drawerMatter.service_type ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                      Destination
                    </div>
                    <div className="text-gray-300">
                      {drawerMatter.destination_country ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                      Payment Status
                    </div>
                    <div
                      className={
                        drawerMatter.payment_status === "paid"
                          ? "text-emerald-400 font-mono font-bold text-[10px]"
                          : "text-amber-400 font-mono font-bold text-[10px]"
                      }
                    >
                      {(drawerMatter.payment_status ?? "unpaid").toUpperCase()}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-1">
                      Matter Value
                    </div>
                    <div className="text-[#D4AF37] font-mono font-bold">
                      {drawerMatter.total_price
                        ? `$${drawerMatter.total_price.toLocaleString()}`
                        : "—"}
                    </div>
                  </div>
                </div>

                {/* Active Execution Timeline */}
                <div>
                  <div className="text-[9px] text-gray-500 font-mono tracking-widest uppercase mb-3">
                    Active Execution Timeline
                  </div>
                  <ExecutionTimeline
                    currentStatus={drawerMatter.status ?? "new"}
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-900 flex-shrink-0">
                <a
                  href={`/dashboard/deals/${drawerMatter.id}`}
                  className="block w-full bg-gradient-to-b from-[#D4AF37] to-[#B8960A] text-black text-center py-2.5 text-xs font-bold rounded-sm uppercase tracking-wider hover:brightness-110 transition-all"
                >
                  Open Full Matter →
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

const STAGE_SEQUENCE = [
  { key: "new", label: "INTAKE" },
  { key: "reviewing", label: "REVIEW" },
  { key: "quoted", label: "QUOTED" },
  { key: "awaiting_payment", label: "AWAITING PAYMENT" },
  { key: "scheduled", label: "SCHEDULED" },
  { key: "in_execution", label: "EXECUTION" },
  { key: "apostille", label: "APOSTILLE" },
  { key: "shipped", label: "SHIPPED" },
  { key: "completed", label: "COMPLETED" },
];

function ExecutionTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIdx = STAGE_SEQUENCE.findIndex((s) => s.key === currentStatus);
  return (
    <div className="border-l border-gray-800 pl-4 ml-1 space-y-2.5 py-1">
      {STAGE_SEQUENCE.map((stage, idx) => {
        const isPast = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        return (
          <div key={stage.key} className="relative flex items-center gap-2">
            <div
              className={`absolute -left-[21px] w-2.5 h-2.5 rounded-full border border-[#09090d] flex-shrink-0 ${
                isPast
                  ? "bg-emerald-500"
                  : isCurrent
                    ? "bg-[#D4AF37] shadow-[0_0_6px_rgba(212,175,55,0.5)] animate-pulse"
                    : "bg-gray-800"
              }`}
            />
            <span
              className={`font-mono text-[10px] ${
                isCurrent
                  ? "text-[#D4AF37] font-bold"
                  : isPast
                    ? "text-gray-500"
                    : "text-gray-700"
              }`}
            >
              {stage.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
