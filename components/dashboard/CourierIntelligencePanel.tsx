"use client";

import { motion } from "framer-motion";
import { Truck, CheckCircle2, AlertCircle, Clock } from "lucide-react";

export interface CourierReadiness {
  addressVerified?: boolean;
  apostilleComplete?: boolean;
  translationComplete?: boolean;
  embassyDependencyComplete?: boolean;
  custodyConfirmed?: boolean;
  labelGenerated?: boolean;
  trackingNumber?: string | null;
  carrier?: string | null;
  estimatedDelivery?: string | null;
}

const EASE = [0.16, 1, 0.3, 1] as const;
const DURATION = 0.58;

function ReadinessRow({
  label,
  ready,
  delay,
}: {
  label: string;
  ready?: boolean;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ease: EASE, duration: DURATION, delay }}
      className="flex items-center justify-between py-2 border-b"
      style={{ borderColor: "rgba(255,255,255,0.04)" }}
    >
      <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>
        {label}
      </span>
      {ready === undefined ? (
        <Clock className="w-3 h-3" style={{ color: "rgba(255,255,255,0.18)" }} />
      ) : ready ? (
        <CheckCircle2 className="w-3 h-3" style={{ color: "#34d399" }} />
      ) : (
        <AlertCircle className="w-3 h-3" style={{ color: "#f59e0b" }} />
      )}
    </motion.div>
  );
}

export function CourierIntelligencePanel({
  readiness = {},
  activeCount = 0,
}: {
  readiness?: CourierReadiness;
  activeCount?: number;
}) {
  const checklist: { label: string; ready: boolean | undefined }[] = [
    { label: "Destination Address Verified", ready: readiness.addressVerified },
    { label: "Apostille / Authentication Complete", ready: readiness.apostilleComplete },
    { label: "Translation Complete", ready: readiness.translationComplete },
    { label: "Embassy Dependency Clear", ready: readiness.embassyDependencyComplete },
    { label: "Custody Chain Confirmed", ready: readiness.custodyConfirmed },
    { label: "Courier Label Generated", ready: readiness.labelGenerated },
  ];

  return (
    <div
      className="rounded-sm"
      style={{ background: "rgba(8,5,1,0.97)", border: "1px solid rgba(212,175,55,0.08)" }}
    >
      {/* Header */}
      <div
        className="px-5 py-4 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.05)" }}
      >
        <div className="flex items-center gap-2.5">
          <Truck className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "rgba(212,175,55,0.5)" }} />
          <div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.28em]"
              style={{ color: "rgba(212,175,55,0.5)" }}
            >
              Global Courier Release Infrastructure™
            </div>
            <div
              className="text-[8px] uppercase tracking-[0.12em] mt-0.5"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              DHL Express · FedEx International · UPS Worldwide
            </div>
          </div>
        </div>
        {activeCount > 0 && (
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: "#60a5fa" }}
            />
            <span className="text-[9px] font-mono" style={{ color: "rgba(96,165,250,0.7)" }}>
              {activeCount} IN TRANSIT
            </span>
          </div>
        )}
      </div>

      <div className="px-5 py-4">
        {/* Active shipment info */}
        {readiness.trackingNumber ? (
          <div
            className="mb-4 p-3 rounded-sm"
            style={{
              background: "rgba(96,165,250,0.05)",
              border: "1px solid rgba(96,165,250,0.15)",
            }}
          >
            <div
              className="text-[9px] font-mono uppercase tracking-[0.16em] mb-1"
              style={{ color: "rgba(96,165,250,0.6)" }}
            >
              Active Shipment
            </div>
            <div className="font-mono text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
              {readiness.trackingNumber}
            </div>
            {readiness.carrier && (
              <div className="text-[9px] font-mono mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
                {readiness.carrier}
                {readiness.estimatedDelivery && ` · ETA: ${readiness.estimatedDelivery}`}
              </div>
            )}
          </div>
        ) : (
          <div className="mb-3 text-[10px] leading-relaxed" style={{ color: "rgba(255,255,255,0.22)" }}>
            Courier authorization pending. Complete apostille, translation, and custody
            confirmation before initiating release.
          </div>
        )}

        {/* Readiness checklist */}
        <div className="space-y-0">
          {checklist.map((item, idx) => (
            <ReadinessRow
              key={item.label}
              label={item.label}
              ready={item.ready}
              delay={idx * 0.045}
            />
          ))}
        </div>

        {/* Carrier intelligence */}
        <div
          className="mt-3 pt-3 border-t grid grid-cols-2 gap-2"
          style={{ borderColor: "rgba(255,255,255,0.04)" }}
        >
          {[
            { label: "Fastest Lane", value: "DHL Express" },
            { label: "Safest Route", value: "FedEx Intl." },
            { label: "Economy Lane", value: "UPS Worldwide" },
            { label: "Domestic Backup", value: "USPS Priority" },
          ].map((item) => (
            <div
              key={item.label}
              className="px-2.5 py-2 rounded-sm"
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <div
                className="text-[8px] font-mono uppercase tracking-[0.14em]"
                style={{ color: "rgba(255,255,255,0.22)" }}
              >
                {item.label}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: "rgba(212,175,55,0.55)" }}>
                {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
