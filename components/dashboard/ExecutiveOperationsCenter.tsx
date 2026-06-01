"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useApi } from "@/hooks/useApi";
import Link from "next/link";

const GOLD = "#C6A55A";
const RED = "#e05252";
const EMERALD = "#4a9e6b";

interface OpsAlert {
  id: string;
  type: "critical" | "warning" | "info";
  label: string;
  count: number;
  href?: string;
}

// Derive operational alerts from dashboard summary data
function deriveAlerts(data: Record<string, unknown>): OpsAlert[] {
  const alerts: OpsAlert[] = [];

  const awaitingPayment = (data.awaiting_payment as number) ?? 0;
  if (awaitingPayment > 0) {
    alerts.push({
      id: "payment-gates",
      type: "warning",
      label: "Payment Gates Blocked",
      count: awaitingPayment,
      href: "/dashboard/pipeline?status=awaiting_payment",
    });
  }

  const pendingPayments = (data.pending_payments as number) ?? 0;
  if (pendingPayments > 0) {
    alerts.push({
      id: "payment-reconciliation",
      type: "warning",
      label: "Payment Reconciliation Needed",
      count: pendingPayments,
      href: "/dashboard/pipeline?status=quoted",
    });
  }

  const inExecution = (data.in_execution as number) ?? 0;
  if (inExecution > 0) {
    alerts.push({
      id: "in-execution",
      type: "info",
      label: "Matters in Execution",
      count: inExecution,
      href: "/dashboard/pipeline?status=in_execution",
    });
  }

  const apostilleCount = (data.apostille_count as number) ?? 0;
  if (apostilleCount > 0) {
    alerts.push({
      id: "apostille-processing",
      type: "info",
      label: "Apostille Processing",
      count: apostilleCount,
      href: "/dashboard/pipeline?status=apostille_processing",
    });
  }

  const securityEvents = (data.security_events_count as number) ?? 0;
  if (securityEvents > 0) {
    alerts.push({
      id: "security-events",
      type: "critical",
      label: "Security Events Logged",
      count: securityEvents,
      href: "/dashboard/security",
    });
  }

  return alerts;
}

function alertColor(type: OpsAlert["type"]): string {
  if (type === "critical") return RED;
  if (type === "warning") return GOLD;
  return EMERALD;
}

function AlertRow({ alert }: { alert: OpsAlert }) {
  const color = alertColor(alert.type);
  const inner = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        borderRadius: 4,
        background: `${color}08`,
        border: `1px solid ${color}25`,
        cursor: alert.href ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: color, flexShrink: 0 }} />
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.72)" }}>{alert.label}</span>
      </div>
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "monospace",
          color,
        }}
      >
        {alert.count}
      </span>
    </div>
  );

  if (alert.href) {
    return (
      <Link href={alert.href} style={{ textDecoration: "none", display: "block" }}>
        {inner}
      </Link>
    );
  }
  return inner;
}

interface Props {
  summaryData?: Record<string, unknown>;
}

export function ExecutiveOperationsCenter({ summaryData }: Props) {
  const alerts = summaryData ? deriveAlerts(summaryData) : [];
  const criticalCount = alerts.filter((a) => a.type === "critical").length;
  const warningCount = alerts.filter((a) => a.type === "warning").length;

  const headerColor =
    criticalCount > 0 ? RED : warningCount > 0 ? GOLD : EMERALD;

  const statusLabel =
    criticalCount > 0
      ? `${criticalCount} Critical`
      : warningCount > 0
      ? `${warningCount} Action${warningCount > 1 ? "s" : ""} Required`
      : "All Clear";

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: `1px solid ${headerColor}18`,
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.26em",
              textTransform: "uppercase",
              fontFamily: "monospace",
              color: "rgba(198,165,90,0.5)",
              marginBottom: 4,
            }}
          >
            Executive Operations
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
            Operational Priority
          </div>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 12px",
            borderRadius: 99,
            background: `${headerColor}10`,
            border: `1px solid ${headerColor}30`,
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: headerColor }} />
          <span style={{ fontSize: 11, fontFamily: "monospace", color: headerColor, letterSpacing: "0.06em" }}>
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Alerts */}
      {alerts.length === 0 ? (
        <div style={{ padding: "12px 0", fontSize: 13, color: "rgba(255,255,255,0.25)", textAlign: "center" }}>
          No operational alerts at this time.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {/* Critical first */}
          {alerts
            .sort((a, b) => {
              const order = { critical: 0, warning: 1, info: 2 };
              return order[a.type] - order[b.type];
            })
            .map((alert, i) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: i * 0.05, ease: "easeOut" }}
              >
                <AlertRow alert={alert} />
              </motion.div>
            ))}
        </div>
      )}

      {/* Doctrine reminders — dashboard-only, never portal */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 12,
          borderTop: "1px solid rgba(255,255,255,0.04)",
          display: "flex",
          flexWrap: "wrap",
          gap: "4px 16px",
        }}
      >
        {[
          "Wise payment link only",
          "Protected IDs non-generative",
          "Italy QA before apostille",
          "Release QA before ship",
        ].map((rule) => (
          <span
            key={rule}
            style={{
              fontSize: 9,
              fontFamily: "monospace",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.18)",
            }}
          >
            {rule}
          </span>
        ))}
      </div>
    </div>
  );
}
