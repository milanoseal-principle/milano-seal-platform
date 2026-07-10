"use client";

// Client Portal 2.0 — preview page.
// Access/auth is enforced by app/portal/layout.tsx (Supabase getUser + role
// guard) and the PortalFrame provider, exactly like the existing portal. This
// page reads the same portal context and projects a CLIENT-SAFE view model.

import { usePortal } from "@/components/portal/portal-context";
import type { PortalClientMatter } from "@/components/portal/portal-context";
import { ClientPortalShell } from "@/components/portal2/ClientPortalShell";
import type { MatterStatus, PortalMatter } from "@/lib/portal2/types";
import { buildSampleMatter } from "@/lib/portal2/sampleMatter";

// Map the existing portal's raw internal status onto the canonical vocabulary.
function toCanonicalStatus(raw: string | null): MatterStatus {
  switch (raw) {
    case "new":
    case "intake_received":
      return "intake_received";
    case "under_review":
    case "compliance_review":
    case "needs_info":
    case "compliance_blocked":
      return "under_review";
    case "quoted":
      return "quoted";
    case "awaiting_payment":
      return "awaiting_payment";
    case "payment_confirmed":
    case "scheduled":
      return "scheduled";
    case "in_execution":
      return "in_execution";
    case "apostille_processing":
    case "courier_ready":
      return "apostille_processing";
    case "shipped":
    case "in_transit":
      return "in_transit";
    case "delivered":
      return "delivered";
    case "completed":
    case "closed":
      return "completed";
    default:
      return "intake_received";
  }
}

// Project the raw portal matter onto the client-safe PortalMatter view model.
// Only whitelisted, client-visible fields are carried across.
function projectRealMatter(deal: PortalClientMatter): PortalMatter {
  return {
    matterId: deal.id,
    displayId: (deal.display_id ?? deal.id).slice(0, 8).toUpperCase(),
    clientName: deal.client_name,
    documentType: deal.document_type,
    destinationCountry: deal.destination_country,
    status: toCanonicalStatus(deal.matter_status),
    paymentConfirmed:
      deal.payment_confirmed === true ||
      deal.payment_status === "paid" ||
      deal.payment_status === "confirmed",
    createdAt: deal.created_at,
    updatedAt: deal.updated_at,
    // Rich sub-collections are not yet wired to real data — honest empty states.
    timeline: [],
    vault: [],
    invoice:
      deal.amount_due != null
        ? {
            invoiceNumber: deal.display_id ?? null,
            currency: deal.currency ?? "USD",
            amountDue: deal.amount_due,
            amountPaid: deal.payment_confirmed ? deal.amount_due : 0,
            balance: deal.payment_confirmed ? 0 : deal.amount_due,
            status: deal.payment_confirmed ? "paid" : "issued",
            issuedAt: deal.created_at,
            paidAt: deal.paid_at,
          }
        : null,
    executionChecklist: [],
    courierMilestones: [],
    apostilleMilestones: [],
    ronMilestones: [],
    countryReadiness: null,
    finalRelease: [],
    completionCertificate: null,
  };
}

export default function ClientPortalV2Page() {
  const { deal, isLoading } = usePortal();

  if (isLoading) {
    return (
      <div style={{ padding: "40px 0", textAlign: "center", fontFamily: "monospace", fontSize: 12, color: "rgba(198,165,90,0.5)" }}>
        Verifying matter state…
      </div>
    );
  }

  // Real matter if linked; otherwise a clearly-labeled sample preview.
  if (deal) {
    return <ClientPortalShell matter={projectRealMatter(deal)} />;
  }

  return <ClientPortalShell matter={buildSampleMatter()} isSample />;
}
