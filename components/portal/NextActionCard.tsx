"use client";

import { getClientNextAction } from "@/lib/intelligence/client-guidance";
import type { PortalClientMatter } from "@/components/portal/portal-context";

interface NextActionCardProps {
  matter: PortalClientMatter;
}

export function NextActionCard({ matter }: NextActionCardProps) {
  const action = getClientNextAction({
    matter_status: matter.matter_status,
    payment_confirmed: matter.payment_confirmed,
    is_platform_fee_only: matter.is_platform_fee_only,
    courier_tracking_id: matter.courier_tracking_id,
  });

  return (
    <div
      style={{
        background: "rgba(10,10,10,0.7)",
        border: "1px solid rgba(198,165,90,0.28)",
        borderRadius: 8,
        padding: "16px 20px",
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(198,165,90,0.6)",
          marginBottom: 10,
          fontFamily: "Georgia, serif",
        }}
      >
        Required Action
      </div>
      <div
        style={{
          fontSize: 14,
          color: "rgba(255,255,255,0.88)",
          lineHeight: 1.55,
          fontFamily: "Georgia, serif",
        }}
      >
        {action}
      </div>
    </div>
  );
}
