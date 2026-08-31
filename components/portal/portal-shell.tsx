"use client";

import type { ReactNode } from "react";
import { CredentialTicker } from "@/components/landing/credential-ticker";
import { MilanoOSShell, type MilanoOSNavItem } from "@/components/os/MilanoOSShell";
import { WisePaymentRitual } from "@/components/payments/WisePaymentRitual";
import { usePortal } from "./portal-context";

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Confirmed",
  confirmed: "Confirmed",
  pending: "Pending",
  awaiting: "Required",
  unpaid: "Required",
  failed: "Failed",
};

const MATTER_STATUS_LABELS: Record<string, string> = {
  new: "Intake Received",
  intake_received: "Intake Received",
  under_review: "Under Review",
  compliance_review: "Under Review",
  quoted: "Invoice Issued",
  awaiting_payment: "Awaiting Payment",
  payment_confirmed: "Payment Confirmed",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille_processing: "Apostille Processing",
  courier_ready: "Courier Ready",
  shipped: "In Transit",
  in_transit: "In Transit",
  delivered: "Delivered",
  completed: "Matter Closed",
  closed: "Matter Closed",
  needs_info: "Information Needed",
  compliance_blocked: "Under Review",
  dormant: "Paused",
};

const NAV: MilanoOSNavItem[] = [
  { href: "/portal", label: "Matter Control", icon: "clipboard", group: "Matter", hint: "Status and next action" },
  { href: "/portal/invoice", label: "Invoice & Payment", icon: "receipt", group: "Matter", hint: "Verified payment status" },
  { href: "/portal/documents", label: "Controlled Records", icon: "folder", group: "Records", hint: "Secure document vault" },
  { href: "/portal/tracking", label: "Courier Tracking", icon: "truck", group: "Records", hint: "Release and delivery visibility" },
  { href: "/portal/messages", label: "Messages", icon: "message", group: "Support", hint: "Matter communication" },
];

function cleanStatus(value: string | null | undefined) {
  if (!value) return "Pending review";
  return MATTER_STATUS_LABELS[value] ?? value.replaceAll("_", " ");
}

function isSubmittedPayment(deal: ReturnType<typeof usePortal>["deal"]) {
  if (!deal || deal.payment_confirmed || !deal.payment_observed_at) return false;
  return ["observed_pending", "observed_available"].includes(deal.payment_settlement_status ?? "");
}

export function PortalShell({ children }: { children: ReactNode }) {
  const { deals, deal, activeDealId, setActiveDealId } = usePortal();

  const matterRef = deal?.display_id?.slice(0, 12).toUpperCase() ?? deal?.id.slice(0, 8).toUpperCase() ?? "—";
  const matterStatus = deal?.client_facing_status ?? cleanStatus(deal?.matter_status);
  const paymentSubmitted = isSubmittedPayment(deal);
  const paymentStatus = deal?.payment_confirmed
    ? "Confirmed"
    : paymentSubmitted
      ? "Submitted"
      : PAYMENT_LABELS[deal?.payment_status ?? ""] ?? "Pending";

  const sidebarContext = (
    <div className="ms-os-context-card">
      <div className="ms-os-context-label">Active Matter</div>
      <div className="ms-os-context-title">{deal?.document_type ?? "Secure Matter"}</div>
      <div className="ms-os-context-meta">
        {deal?.destination_country ?? "Destination pending"} · {matterRef}
      </div>
      {deals.length > 1 ? (
        <select
          className="ms-os-context-select"
          aria-label="Switch active Matter"
          value={activeDealId ?? deal?.id ?? ""}
          onChange={(event) => setActiveDealId(event.target.value)}
        >
          {deals.map((item) => (
            <option key={item.id} value={item.id}>
              {(item.document_type ?? "Matter")} · {(item.destination_country ?? "Pending")}
            </option>
          ))}
        </select>
      ) : null}
      <div className="mt-3 grid gap-1.5 text-[9px] uppercase tracking-[0.13em] text-white/35">
        <div className="flex items-center justify-between gap-3">
          <span>Status</span>
          <strong className="truncate text-right font-medium text-[#D8C188]/80">{matterStatus}</strong>
        </div>
        <div className="flex items-center justify-between gap-3">
          <span>Payment</span>
          <strong className="truncate text-right font-medium text-white/60">{paymentStatus}</strong>
        </div>
      </div>
    </div>
  );

  return (
    <MilanoOSShell
      mode="client"
      nav={NAV}
      eyebrow="Private Matter Access"
      title="Secure Matter Portal"
      subtitle="One Matter · one verified status · one clear next action"
      brandSubtitle="Secure Matter Portal"
      topStrip={
        <div style={{ paddingTop: "var(--sa-top)", background: "#070707" }}>
          <CredentialTicker />
        </div>
      }
      sidebarContext={sidebarContext}
      identity={{
        name: deal?.client_name ?? "Client",
        meta: matterRef === "—" ? "Secure access" : `Matter ${matterRef}`,
      }}
      statusItems={[
        { label: "Matter", value: matterStatus, tone: "gold" },
        {
          label: "Payment",
          value: paymentStatus,
          tone: deal?.payment_confirmed ? "green" : deal?.payment_status === "failed" ? "red" : paymentSubmitted ? "gold" : "neutral",
        },
      ]}
      footerNote="Client-safe projection · private Matter data only"
      maxWidth={1360}
    >
      <WisePaymentRitual
        matterId={deal?.id}
        matterReference={deal?.display_id ?? deal?.matter_id ?? matterRef}
        amountDue={deal?.amount_due ?? deal?.payment_amount_due ?? null}
        currency={deal?.currency ?? "USD"}
      >
        {children}
      </WisePaymentRitual>
    </MilanoOSShell>
  );
}
