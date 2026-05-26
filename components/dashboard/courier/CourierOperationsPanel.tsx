"use client";

import { useApi } from "@/hooks/useApi";
import Link from "next/link";

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
  deal_status: string | null;
}

interface ActiveResponse {
  shipments: ActiveShipment[];
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
  unknown: {
    bg: "rgba(100,100,100,0.08)",
    color: "#888",
    border: "rgba(100,100,100,0.15)",
  },
};

function statusLabel(s: string | null): string {
  if (!s) return "Unknown";
  return s
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatEta(eta: string | null): string {
  if (!eta) return "—";
  try {
    return new Date(eta).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "—";
  }
}

function SkeletonRow() {
  return (
    <div
      className="flex items-center gap-4 px-4 py-3 rounded-sm animate-pulse"
      style={{ background: GOLD_SOFT }}
    >
      <div className="w-20 h-3 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="w-32 h-3 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="w-16 h-3 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="flex-1 h-3 rounded-sm" style={{ background: GOLD_BORDER }} />
      <div className="w-20 h-3 rounded-sm" style={{ background: GOLD_BORDER }} />
    </div>
  );
}

function CarrierBadge({ carrier }: { carrier: string | null }) {
  const c = (carrier || "").toLowerCase();
  const style = CARRIER_COLORS[c] || { bg: GOLD_SOFT, color: GOLD_DIM };
  return (
    <span
      className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest"
      style={{ background: style.bg, color: style.color }}
    >
      {carrier?.toUpperCase() || "—"}
    </span>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  const s = STATUS_STYLES[status ?? "unknown"] || STATUS_STYLES.unknown;
  return (
    <span
      className="px-2 py-0.5 rounded-sm text-[10px] font-mono uppercase tracking-widest"
      style={{ background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      {statusLabel(status)}
    </span>
  );
}

export function CourierOperationsPanel() {
  const { data, isLoading } = useApi<ActiveResponse>("/api/courier/active");
  const shipments = data?.shipments ?? [];

  // Stats
  const inTransit = shipments.filter(
    (s) => s.delivery_status === "in_transit" || s.delivery_status === "out_for_delivery",
  ).length;

  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const deliveredThisWeek = 0; // active endpoint excludes delivered; shown as 0

  const failed = shipments.filter((s) => s.delivery_status === "failed").length;

  return (
    <div className="space-y-8">
      {/* Section 1: Active Shipments */}
      <section>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: GOLD_DIM }}
        >
          Live Courier View
        </div>
        <h2 className="font-serif text-lg mb-4" style={{ color: GOLD }}>
          Active Shipments
        </h2>

        {isLoading ? (
          <div className="space-y-2">
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </div>
        ) : shipments.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 rounded-sm border"
            style={{
              background: BG,
              borderColor: GOLD_BORDER,
            }}
          >
            <div
              className="text-[10px] font-mono uppercase tracking-widest mb-2"
              style={{ color: GOLD_DIM }}
            >
              No Active Shipments
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
              All matters are either delivered or not yet shipped.
            </p>
          </div>
        ) : (
          <div
            className="rounded-sm border overflow-hidden"
            style={{ background: BG, borderColor: GOLD_BORDER }}
          >
            {/* Table header */}
            <div
              className="grid gap-4 px-4 py-2 border-b text-[9px] font-mono uppercase tracking-widest"
              style={{
                gridTemplateColumns: "120px 1fr 80px 110px 120px 100px",
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

            {shipments.map((s) => (
              <Link
                key={s.id}
                href={`/dashboard/deals/${s.id}`}
                className="block border-b last:border-0 transition-colors"
                style={{ borderColor: GOLD_BORDER }}
              >
                <div
                  className="grid gap-4 px-4 py-3 items-center hover:opacity-80 transition-opacity"
                  style={{
                    gridTemplateColumns: "120px 1fr 80px 110px 120px 100px",
                  }}
                >
                  <span
                    className="text-xs font-mono truncate"
                    style={{ color: GOLD }}
                  >
                    {s.deal_id || s.id.slice(0, 8)}
                  </span>
                  <span
                    className="text-xs truncate"
                    style={{ color: "rgba(255,255,255,0.75)" }}
                  >
                    {s.client_name
                      ? s.client_name.length > 22
                        ? s.client_name.slice(0, 22) + "…"
                        : s.client_name
                      : "—"}
                  </span>
                  <CarrierBadge carrier={s.carrier} />
                  <StatusBadge status={s.delivery_status} />
                  <span
                    className="text-xs truncate"
                    style={{ color: "rgba(255,255,255,0.5)" }}
                  >
                    {s.destination_country || "—"}
                  </span>
                  <span
                    className="text-xs font-mono"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    {formatEta(s.delivery_eta)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Courier Readiness */}
      <section>
        <div
          className="text-[9px] font-mono uppercase tracking-[0.28em] mb-1"
          style={{ color: GOLD_DIM }}
        >
          Operational Summary
        </div>
        <h2 className="font-serif text-lg mb-4" style={{ color: GOLD }}>
          Courier Readiness
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* In Transit */}
          <div
            className="rounded-sm border p-5"
            style={{ background: BG, borderColor: GOLD_BORDER }}
          >
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-2"
              style={{ color: GOLD_DIM }}
            >
              In Transit
            </div>
            <div
              className="font-serif text-3xl font-light"
              style={{ color: GOLD }}
            >
              {isLoading ? "—" : inTransit}
            </div>
            <div
              className="text-[10px] mt-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Active shipments en route
            </div>
          </div>

          {/* Delivered This Week */}
          <div
            className="rounded-sm border p-5"
            style={{ background: BG, borderColor: GOLD_BORDER }}
          >
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-2"
              style={{ color: GOLD_DIM }}
            >
              Delivered (7d)
            </div>
            <div
              className="font-serif text-3xl font-light"
              style={{ color: "#4a9e6b" }}
            >
              {isLoading ? "—" : deliveredThisWeek}
            </div>
            <div
              className="text-[10px] mt-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Completed deliveries this week
            </div>
          </div>

          {/* Failed / Stuck */}
          <div
            className="rounded-sm border p-5"
            style={{ background: BG, borderColor: GOLD_BORDER }}
          >
            <div
              className="text-[9px] font-mono uppercase tracking-widest mb-2"
              style={{ color: GOLD_DIM }}
            >
              Failed / Stuck
            </div>
            <div
              className="font-serif text-3xl font-light"
              style={{ color: failed > 0 ? "#c05050" : "rgba(255,255,255,0.4)" }}
            >
              {isLoading ? "—" : failed}
            </div>
            <div
              className="text-[10px] mt-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {failed > 0
                ? "Requires intervention"
                : "No issues detected"}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
