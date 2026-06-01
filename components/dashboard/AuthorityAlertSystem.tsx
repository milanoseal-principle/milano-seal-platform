"use client";

/**
 * Authority Alert System — Dashboard Only
 *
 * Surfaces authority-level operational flags from real registry data.
 * Empty when no authority records exist.
 * Populates automatically as authority records are added and verified.
 */

import { useMemo } from "react";
import {
  getAuthoritiesNeedingReview,
  getHighFrictionAuthorities,
  RECEIVING_AUTHORITIES,
} from "@/data/authorities";

const GOLD = "#C6A55A";
const RED = "#e05252";
const AMBER = "#d97706";

type AlertType =
  | "AUTHORITY_RULE_CHANGED"
  | "AUTHORITY_REVIEW_DUE"
  | "HIGH_FRICTION_AUTHORITY"
  | "AUTHORITY_VERIFICATION_REQUIRED"
  | "KNOWN_REJECTION_PATTERN"
  | "AUTHORITY_EXCEPTION_OBSERVED"
  | "AUTHORITY_CONFIDENCE_DROP";

interface AuthorityAlert {
  type: AlertType;
  authority_name: string;
  authority_id: string;
  message: string;
  severity: "critical" | "warning" | "info";
}

function useAuthorityAlerts(): AuthorityAlert[] {
  return useMemo(() => {
    const alerts: AuthorityAlert[] = [];

    // Review due
    const reviewDue = getAuthoritiesNeedingReview();
    for (const a of reviewDue) {
      alerts.push({
        type: "AUTHORITY_REVIEW_DUE",
        authority_id: a.id,
        authority_name: a.authority_name,
        message: `Review due ${a.next_review_due}. Last verified: ${a.verified_at ?? "never"}.`,
        severity: "warning",
      });
    }

    // High friction needing escalation
    const highFriction = getHighFrictionAuthorities(9);
    for (const a of highFriction) {
      if (a.escalation_required) {
        alerts.push({
          type: "HIGH_FRICTION_AUTHORITY",
          authority_id: a.id,
          authority_name: a.authority_name,
          message: `Friction score ${a.friction_score}/10. Executive attention required for matters destined to this authority.`,
          severity: "critical",
        });
      }
    }

    // Unverified authorities in registry (without source)
    const unverified = RECEIVING_AUTHORITIES.filter(
      (a) =>
        (a.authority_confidence === "UNVERIFIED" ||
          a.authority_confidence === "VERIFICATION_REQUIRED") &&
        a.valid_to === null,
    );
    for (const a of unverified) {
      alerts.push({
        type: "AUTHORITY_VERIFICATION_REQUIRED",
        authority_id: a.id,
        authority_name: a.authority_name,
        message: `Confidence: ${a.authority_confidence}. Cannot auto-drive readiness until verified.`,
        severity: "warning",
      });
    }

    return alerts;
  }, []);
}

function alertColor(severity: AuthorityAlert["severity"]): string {
  if (severity === "critical") return RED;
  if (severity === "warning") return GOLD;
  return AMBER;
}

function typeLabel(type: AlertType): string {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function AuthorityAlertSystem() {
  const alerts = useAuthorityAlerts();

  if (alerts.length === 0) {
    return (
      <div
        style={{
          background: "rgba(8,5,1,0.97)",
          border: "1px solid rgba(212,175,55,0.08)",
          borderRadius: 2,
          padding: "20px 24px",
        }}
      >
        <div
          style={{
            fontSize: 9,
            letterSpacing: "0.26em",
            textTransform: "uppercase",
            fontFamily: "monospace",
            color: "rgba(198,165,90,0.5)",
            marginBottom: 12,
          }}
        >
          Authority Alerts
        </div>
        <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)" }}>
          No authority records in registry. Alerts populate as verified authority records are added.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "rgba(8,5,1,0.97)",
        border: "1px solid rgba(212,175,55,0.08)",
        borderRadius: 2,
        padding: "20px 24px",
      }}
    >
      <div
        style={{
          fontSize: 9,
          letterSpacing: "0.26em",
          textTransform: "uppercase",
          fontFamily: "monospace",
          color: "rgba(198,165,90,0.5)",
          marginBottom: 16,
        }}
      >
        Authority Alerts — {alerts.length}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {alerts.map((alert, i) => {
          const color = alertColor(alert.severity);
          return (
            <div
              key={`${alert.authority_id}-${i}`}
              style={{
                padding: "10px 12px",
                borderRadius: 4,
                background: `${color}08`,
                border: `1px solid ${color}22`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: color, flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontFamily: "monospace", letterSpacing: "0.12em", textTransform: "uppercase", color, opacity: 0.8 }}>
                  {typeLabel(alert.type)}
                </span>
              </div>
              <div style={{ fontSize: 12, fontWeight: 500, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>
                {alert.authority_name}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 1.4 }}>
                {alert.message}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
