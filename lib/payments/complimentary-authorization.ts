import { randomUUID } from "crypto";
import type { ComplimentaryReasonCode } from "./complimentary-policy";
import { COMPLIMENTARY_CONFIRMATION, isValidReasonDetail } from "./complimentary-policy";

export interface ComplimentaryQuoteSnapshot {
  quoteId: string | null;
  matterId: string;
  subtotal: number;
  addOns: number;
  total: number;
  currency: string;
  quoteVersion: string;
}

export interface ComplimentaryAuthorization {
  id: string;
  matterId: string;
  quoteId: string | null;
  quoteVersion: string;
  originalSubtotal: number;
  originalAddOns: number;
  originalTotal: number;
  discountAmount: number;
  finalAmountDue: 0;
  currency: string;
  reasonCode: ComplimentaryReasonCode;
  reasonDetail: string;
  authorizedByUserId: string;
  authorizedByRole: string;
  authorizationScope: "single_matter";
  status: "active" | "revoked" | "consumed" | "superseded";
  authorizedAt: string;
  revokedAt: string | null;
  revokedByUserId: string | null;
  revocationReason: string | null;
  consumedAt: string | null;
  auditEventId: string;
}

export interface ComplimentaryAccountingSnapshot {
  paymentDisposition: "complimentary";
  amountBeforeAdjustment: number;
  discountAmount: number;
  amountDue: 0;
  amountPaid: 0;
  verifiedRevenue: 0;
  wisePaymentId: null;
  wiseTransferId: null;
  paymentConfirmedAt: null;
  compAuthorized: true;
  compAuthorizedBy: string;
  compAuthorizedAt: string;
  compReasonCode: ComplimentaryReasonCode;
  compReasonDetail: string;
  compAuthorizationId: string;
}

function money(value: number): number {
  return Math.max(0, Math.round((Number(value) || 0) * 100) / 100);
}

export function validateComplimentaryAuthorizationInput(params: {
  quote: ComplimentaryQuoteSnapshot;
  reasonDetail: string;
  confirmation: string;
}): void {
  if (params.confirmation !== COMPLIMENTARY_CONFIRMATION) {
    throw new Error("Typed confirmation must match AUTHORIZE COMPLIMENTARY MATTER.");
  }
  if (!isValidReasonDetail(params.reasonDetail)) {
    throw new Error("A written complimentary authorization reason is required.");
  }
  if (money(params.quote.total) < 0) {
    throw new Error("Canonical quote total cannot be negative.");
  }
}

export function createComplimentaryAuthorization(params: {
  quote: ComplimentaryQuoteSnapshot;
  reasonCode: ComplimentaryReasonCode;
  reasonDetail: string;
  authorizedByUserId: string;
  authorizedByRole: string;
  auditEventId?: string;
  now?: string;
}): ComplimentaryAuthorization {
  const now = params.now ?? new Date().toISOString();
  const originalSubtotal = money(params.quote.subtotal);
  const originalAddOns = money(params.quote.addOns);
  const originalTotal = money(params.quote.total);

  return {
    id: randomUUID(),
    matterId: params.quote.matterId,
    quoteId: params.quote.quoteId,
    quoteVersion: params.quote.quoteVersion,
    originalSubtotal,
    originalAddOns,
    originalTotal,
    discountAmount: originalTotal,
    finalAmountDue: 0,
    currency: params.quote.currency,
    reasonCode: params.reasonCode,
    reasonDetail: params.reasonDetail.trim(),
    authorizedByUserId: params.authorizedByUserId,
    authorizedByRole: params.authorizedByRole,
    authorizationScope: "single_matter",
    status: "active",
    authorizedAt: now,
    revokedAt: null,
    revokedByUserId: null,
    revocationReason: null,
    consumedAt: null,
    auditEventId: params.auditEventId ?? randomUUID(),
  };
}

export function buildComplimentaryAccountingSnapshot(auth: ComplimentaryAuthorization): ComplimentaryAccountingSnapshot {
  if (auth.status !== "active") throw new Error("Only an active complimentary authorization can satisfy payment disposition.");
  if (auth.discountAmount !== auth.originalTotal || auth.finalAmountDue !== 0) {
    throw new Error("Complimentary authorization must discount the full canonical quote to zero.");
  }
  return {
    paymentDisposition: "complimentary",
    amountBeforeAdjustment: auth.originalTotal,
    discountAmount: auth.discountAmount,
    amountDue: 0,
    amountPaid: 0,
    verifiedRevenue: 0,
    wisePaymentId: null,
    wiseTransferId: null,
    paymentConfirmedAt: null,
    compAuthorized: true,
    compAuthorizedBy: auth.authorizedByUserId,
    compAuthorizedAt: auth.authorizedAt,
    compReasonCode: auth.reasonCode,
    compReasonDetail: auth.reasonDetail,
    compAuthorizationId: auth.id,
  };
}

export function isAuthorizationValidForQuote(auth: ComplimentaryAuthorization, quote: ComplimentaryQuoteSnapshot): boolean {
  return auth.status === "active" &&
    auth.matterId === quote.matterId &&
    auth.quoteId === quote.quoteId &&
    auth.quoteVersion === quote.quoteVersion &&
    auth.originalTotal === money(quote.total) &&
    auth.discountAmount === auth.originalTotal &&
    auth.finalAmountDue === 0;
}

export function revokeComplimentaryAuthorization(params: {
  authorization: ComplimentaryAuthorization;
  revokedByUserId: string;
  reason: string;
  now?: string;
}): ComplimentaryAuthorization {
  return {
    ...params.authorization,
    status: "revoked",
    revokedAt: params.now ?? new Date().toISOString(),
    revokedByUserId: params.revokedByUserId,
    revocationReason: params.reason.trim(),
  };
}
