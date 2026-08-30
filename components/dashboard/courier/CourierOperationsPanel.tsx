"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import { useApi } from "@/hooks/useApi";
import { MatterRateOptimizer } from "./MatterRateOptimizer";

interface ActiveShipment {
  id: string;
  deal_id: string | null;
  client_name: string | null;
  destination_country: string | null;
  carrier: string | null;
  tracking_number: string | null;
  delivery_status: string | null;
  delivery_eta: string | null;
  shipped_at: string | null;
  canonical_state: string | null;
  raw_state: string | null;
  alias_applied: boolean;
  due_at: string | null;
}

interface ActiveResponse {
  shipments: ActiveShipment[];
  deliveredLast7Days: number;
  generatedAt: string;
}

const GOLD = "rgba(212,175,55,1)";
const GOLD_DIM = "rgba(212,175,55,0.5)";
const GOLD_SOFT = "rgba(212,175,55,0.08)";
const GOLD_BORDER = "rgba(212,175,55,0.18)";
const BG = "rgba(8,5,1,0.97)";

const CARRIER_COLORS: Record<string, { bg: string; color: string }> = {
  usps: { bg: "rgba(33,100,180,0.12)", color: "#4a90d9" },
  ups: { bg: "rgba(90,60,12,0.18)", color: "#c8973a" },
  fedex: { bg: "rgba(68,0,153,0.12)", color: "#a07de8" },
  dhl: { bg: "rgba(212,175,55,0.12)", color: GOLD },
  dhl_express: { bg: "rgba(212,175,55,0.12)", color: GOLD },
};

const STATUS_STYLES: Record<string, { bg: string; color: string; border: string }> = {
  in_transit: {
    bg: "rgba(100,163,216,0.10)",
    color: "#64a3d8",
    border: "rgba(100,163,216,0.25)",
  },
  out_for_delivery: {
    bg: "rgba(212,175,55,0.10)",
    color: GOLD,
    border: GOLD_BORDER,
  },
  customs_watch: {
    bg: "rgba(245,158,11,0.10)",
    color: "#f59e0b",
    border: "rgba(245,158,11,0.25)",
  },
  delivered: {
    bg: "rgba(74,158,107,0.10)",
    color: "#4a9e6b",
    border: "rgba(74,158,107,0.25)",
  },
  failed: {
    bg: "rgba(192,80,80,0.08)",
    color: "#c05050",
    border: "rgba(192,80,80,0.18)",
  },
  exception: {
    bg: "rgba(192,80,80,0.08)",
    color: "#c05050",
    border: "rgba(192,80,80,0.18)",
  },
  returned: {
    bg: "rgba(192,80,80,0.08)",
    color: "#c05050",
    border: "rgba(192,80,80,0.18)",
  },
  return_to_sender: {
    bg: "rgba(192,80,80,0.08)",
    color: "#c05050",
    border: "rgba(192,80,80,0.18)",
  },
  unknown: {
    bg: "rgba(100,100,100,0.08)",
    color: "#888",
    border: "rgba(100,100,100,0.15)",
  },
};

function statusLabel(status: string | null): string {
  if (!status) return "Unknown";
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

function formatEta(eta: string | null): string {
  if (!eta) return "—";
  const date = new Date(eta);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CarrierBadge({ carrier }: { carrier: string | null }) {
  const key = (carrier || "").toLowerCase().replace(/\s+/g, "_");
  const style = CARRIER_COLORS[key] || { bg: GOLD_SOFT, color: GOLD_DIM };
  return (
    <span
      className="rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
      style={{ background: style.bg, color: style.color }}
    >
      {carrier?.toUpperCase() || "—"}
    </span>
  );
}

function StatusBadge({ shipment }: { shipment: ActiveShipment }) {
  const status = shipment.delivery_status ?? shipment.canonical_state ?? "unknown";
  const style = STATUS_STYLES[status] || STATUS_STYLES.unknown;
  return (
    <span
      className="rounded-sm px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.border}` }}
    >
      {statusLabel(status)}
    </span>
  );
}

function SkeletonRow() {
  return (
    <div className="flex animate-pulse items-center gap-4 rounded-sm px-4 py-3 motion-reduce:animate-none" style={{ background: GOLD_SOFT }}>
      <div className="h-3 w-20 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="h-3 w-32 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="h-3 w-16 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="h-3 flex-1 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="h-3 w-20 rounded-sm" style={{ background: GOLD_BORDER }} />
    </div>
  );
}

export function CourierOperationsPanel() {
  const { data, isLoading } = useApi<ActiveResponse>("/api/courier/active");
  const searchParams = useSearchParams();
  const focusMatter = searchParams.get("matter") ?? searchParams.get("deal");
  const shipments = data?.shipments ?? [];

  const inTransit = shipments.filter((shipment) =>
    ["in_transit", "out_for_delivery"].includes(
      shipment.delivery_status ?? shipment.canonical_state ?? "",
    ),
  ).length;

  const failed = shipments.filter((shipment) =>
    ["failed", "exception", "returned", "return_to_sender", "customs_watch"].includes(
      shipment.delivery_status ?? shipment.canonical_state ?? "",
    ),
  ).length;

  return (
    <div className="space-y-8">
      {focusMatter ? (
        <>
          <div className="flex items-center justify-between gap-3 rounded-sm border px-4 py-3" style={{ background: GOLD_SOFT, borderColor: GOLD_BORDER }}>
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.16em]" style={{ color: GOLD_DIM }}>
                Focused Matter
              </p>
              <p className="mt-1 break-all font-mono text-[10px] text-white/50">{focusMatter}</p>
            </div>
            <Link href="/dashboard/courier" className="inline-flex min-h-11 items-center font-mono text-[9px] uppercase tracking-widest" style={{ color: GOLD }}>
              Clear
            </Link>
          </div>
          <MatterRateOptimizer matterReference={focusMatter} />
        </>
      ) : null}

      <section>
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: GOLD_DIM }}>
          Live Courier View
        </div>
        <h2 className="mb-4 font-serif text-lg" style={{ color: GOLD }}>
          Active Shipments
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : shipments.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-sm border py-12" style={{ background: BG, borderColor: GOLD_BORDER }}>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-widest" style={{ color: GOLD_DIM }}>
              No Active Shipments
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              No canonical transit, customs, delivery or carrier-exception state is active.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-sm border" style={{ background: BG, borderColor: GOLD_BORDER }}>
            <div className="min-w-[820px]">
              <div
                className="grid gap-4 border-b px-4 py-2 font-mono text-[9px] uppercase tracking-widest"
                style={{
                  gridTemplateColumns: "120px 1fr 80px 130px 120px 100px",
                  borderColor: GOLD_BORDER,
                  color: GOLD_DIM,
                }}
              >
                <span>Matter ID</span>
                <span>Client</span>
                <span>Carrier</span>
                <span>Status</span>
                <span>Destination</span>
                <span>ETA</span>
              </div>

              {shipments.map((shipment) => {
                const focused = focusMatter === shipment.id || focusMatter === shipment.deal_id;
                return (
                  <Link
                    key={shipment.id}
                    href={`/dashboard/deals/${encodeURIComponent(shipment.deal_id || shipment.id)}`}
                    className="block border-b last:border-0"
                    style={{
                      borderColor: GOLD_BORDER,
                      background: focused ? "rgba(212,175,55,0.06)" : undefined,
                    }}
                  >
                    <div
                      className="grid items-center gap-4 px-4 py-3 transition-opacity hover:opacity-80 motion-reduce:transition-none"
                      style={{ gridTemplateColumns: "120px 1fr 80px 130px 120px 100px" }}
                    >
                      <span className="truncate font-mono text-xs" style={{ color: GOLD }}>
                        {shipment.deal_id || shipment.id.slice(0, 8)}
                      </span>
                      <span className="truncate text-xs" style={{ color: "rgba(255,255,255,0.75)" }}>
                        {shipment.client_name || "—"}
                      </span>
                      <CarrierBadge carrier={shipment.carrier} />
                      <StatusBadge shipment={shipment} />
                      <span className="truncate text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {shipment.destination_country || "—"}
                      </span>
                      <span className="font-mono text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
                        {formatEta(shipment.delivery_eta)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section>
        <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.28em]" style={{ color: GOLD_DIM }}>
          Operational Summary
        </div>
        <h2 className="mb-4 font-serif text-lg" style={{ color: GOLD }}>
          Courier Readiness
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              label: "In Transit",
              value: inTransit,
              color: GOLD,
              note: "Active shipments en route",
            },
            {
              label: "Delivered (7d)",
              value: data?.deliveredLast7Days ?? 0,
              color: "#4a9e6b",
              note: "Completed deliveries this week",
            },
            {
              label: "Failed / Stuck",
              value: failed,
              color: failed > 0 ? "#c05050" : "rgba(255,255,255,0.4)",
              note: failed > 0 ? "Requires intervention" : "No issues detected",
            },
          ].map((stat) => (
            <div key={stat.label} className="rounded-sm border p-5" style={{ background: BG, borderColor: GOLD_BORDER }}>
              <div className="mb-2 font-mono text-[9px] uppercase tracking-widest" style={{ color: GOLD_DIM }}>
                {stat.label}
              </div>
              <div className="font-serif text-3xl font-light" style={{ color: stat.color }}>
                {isLoading ? "—" : stat.value}
              </div>
              <div className="mt-1 text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                {stat.note}
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
