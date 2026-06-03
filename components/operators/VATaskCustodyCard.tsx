"use client";

import Link from "next/link";

export interface VATaskCustodyCardProps {
  taskType: string;
  matterId?: string;
  country?: string;
  documentType?: string;
  dueDate?: string | null;
  action?: string;
  actionRoute?: string;
  canEscalate?: boolean;
}

const TASK_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  ADDRESS_CORRECTION: { label: "Address Correction", color: "#C99A3D" },
  LABEL_NOT_REGISTERED: { label: "Label Not Registered", color: "#C6A55A" },
  NO_LABEL_AFTER_APOSTILLE: { label: "No Label After Apostille", color: "#C99A3D" },
  COURIER_EXCEPTION: { label: "Courier Exception", color: "#B85C5C" },
  RETURNED_DOCUMENT: { label: "Returned Document", color: "#B85C5C" },
  DELIVERED_NOT_RELEASED: { label: "Delivered Not Released", color: "#C99A3D" },
  TRACKING_STALE: { label: "Tracking Stale", color: "#C6A55A" },
  CERTIFICATE_READY: { label: "Certificate Ready", color: "#3FA47A" },
};

function fmt(d: string) {
  return new Date(d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function VATaskCustodyCard({
  taskType,
  matterId,
  country,
  documentType,
  dueDate,
  action,
  actionRoute,
  canEscalate,
}: VATaskCustodyCardProps) {
  const meta = TASK_TYPE_LABELS[taskType] ?? {
    label: taskType.replace(/_/g, " "),
    color: "#C6A55A",
  };

  const escalateRoute = matterId
    ? `/dashboard/terminal/new?matter_id=${matterId}`
    : `mailto:ops@milanoseal.com?subject=Escalation: ${taskType}${matterId ? ` — ${matterId}` : ""}`;

  return (
    <div
      style={{
        background: "#0c0c0c",
        border: `1px solid ${meta.color}22`,
        borderRadius: 3,
        padding: "14px 16px",
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 600,
          color: meta.color,
          letterSpacing: "0.06em",
        }}
      >
        {meta.label}
      </div>

      {(matterId || country || documentType) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 14px" }}>
          {matterId && (
            <span
              style={{
                fontSize: 10,
                fontFamily: "monospace",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              {matterId.slice(0, 8)}…
            </span>
          )}
          {documentType && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {documentType}
            </span>
          )}
          {country && (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
              {country}
            </span>
          )}
          {dueDate && (
            <span style={{ fontSize: 10, color: "#C99A3D" }}>
              Due {fmt(dueDate)}
            </span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {actionRoute && (
          <Link
            href={actionRoute}
            style={{
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 2,
              background: `${meta.color}12`,
              border: `1px solid ${meta.color}30`,
              color: meta.color,
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}
          >
            {action ?? "Review"}
          </Link>
        )}

        {canEscalate && (
          <Link
            href={escalateRoute}
            style={{
              fontSize: 10,
              padding: "4px 10px",
              borderRadius: 2,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              letterSpacing: "0.06em",
            }}
          >
            Escalate
          </Link>
        )}
      </div>
    </div>
  );
}
