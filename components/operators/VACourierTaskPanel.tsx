"use client";

import { VATaskCustodyCard, VATaskCustodyCardProps } from "./VATaskCustodyCard";

// Default task queue — real data binding available post-migration 015
const DEFAULT_TASKS: VATaskCustodyCardProps[] = [
  {
    taskType: "ADDRESS_CORRECTION",
    action: "Review Address",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "LABEL_NOT_REGISTERED",
    action: "Check Pickup",
    actionRoute: "/dashboard/shipping",
    canEscalate: false,
  },
  {
    taskType: "NO_LABEL_AFTER_APOSTILLE",
    action: "Create Label",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "COURIER_EXCEPTION",
    action: "Assess Exception",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "RETURNED_DOCUMENT",
    action: "Arrange Re-shipment",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "DELIVERED_NOT_RELEASED",
    action: "Release Review",
    actionRoute: "/dashboard/releases",
    canEscalate: false,
  },
  {
    taskType: "TRACKING_STALE",
    action: "Follow Up",
    actionRoute: "/dashboard/shipping",
    canEscalate: false,
  },
  {
    taskType: "CERTIFICATE_READY",
    action: "Review Certificate",
    actionRoute: "/dashboard/releases",
    canEscalate: false,
  },
  // Packaging QA tasks
  {
    taskType: "PACKAGE_QA",
    action: "Review Packaging",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "FOLDER_PACKET_READY",
    action: "Confirm Folder",
    actionRoute: "/dashboard/shipping",
    canEscalate: false,
  },
  {
    taskType: "EXECUTIVE_PACKET_REVIEW",
    action: "Review Executive Packet",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "CUSTOMS_TAX_ID_REVIEW",
    action: "Customs Review",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
  {
    taskType: "CARRIER_POLICY_REVIEW",
    action: "Carrier Override Review",
    actionRoute: "/dashboard/shipping",
    canEscalate: true,
  },
];

interface VACourierTaskPanelProps {
  tasks?: VATaskCustodyCardProps[];
}

export function VACourierTaskPanel({ tasks = DEFAULT_TASKS }: VACourierTaskPanelProps) {
  return (
    <div
      style={{
        background: "#0a0a0a",
        border: "1px solid rgba(198,165,90,0.12)",
        borderRadius: 4,
        padding: "20px 24px",
        marginBottom: 24,
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Courier Task Queue
      </div>

      {tasks.length === 0 ? (
        <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
          No courier tasks pending.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 10,
          }}
        >
          {tasks.map((task, i) => (
            <VATaskCustodyCard key={`${task.taskType}-${i}`} {...task} />
          ))}
        </div>
      )}
    </div>
  );
}
