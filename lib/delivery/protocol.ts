export const DELIVERY_VERSION_TYPES = [
  "ProForma",
  "FinalInvoice",
  "PaidReleased",
] as const;

export type DeliveryVersionType = (typeof DELIVERY_VERSION_TYPES)[number];

export const DELIVERY_STATUSES = [
  "Draft",
  "Generated",
  "Sent",
  "Confirmed",
  "Closed",
] as const;

export type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

export interface DeliveryFileNameInput {
  invoiceNumber: string;
  documentType: string;
  versionType: DeliveryVersionType;
  clientLabel: string;
  date: Date | string;
}

function safeSegment(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function compactDate(value: Date | string): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new Error("A valid delivery date is required.");
  }
  return date.toISOString().slice(0, 10).replaceAll("-", "");
}

export function buildDeliveryFileName(input: DeliveryFileNameInput): string {
  const invoice = safeSegment(input.invoiceNumber);
  const documentType = safeSegment(input.documentType);
  const clientLabel = safeSegment(input.clientLabel);

  if (!invoice || !documentType || !clientLabel) {
    throw new Error(
      "Invoice number, document type, and client label are required.",
    );
  }

  return `MS-${invoice}_${documentType}_${input.versionType}_${clientLabel}_${compactDate(input.date)}.pdf`;
}

export function isPaidReleasedFileName(fileName: string): boolean {
  return /^MS-[A-Za-z0-9_]+_[A-Za-z0-9_]+_PaidReleased_[A-Za-z0-9_]+_\d{8}\.pdf$/.test(
    fileName,
  );
}

export function canSendFinalDelivery(input: {
  finalApproval: boolean;
  paymentConfirmed: boolean;
  pdfLocked: boolean;
  versionType: DeliveryVersionType;
  fileName: string;
}): { allowed: boolean; blockers: string[] } {
  const blockers: string[] = [];

  if (!input.finalApproval) blockers.push("Final approval is required.");
  if (!input.paymentConfirmed) blockers.push("Payment must be confirmed.");
  if (!input.pdfLocked) blockers.push("The final PDF must be locked.");
  if (input.versionType !== "PaidReleased") {
    blockers.push("Only the PaidReleased version may be sent at completion.");
  }
  if (!isPaidReleasedFileName(input.fileName)) {
    blockers.push("The file name does not match the PaidReleased protocol.");
  }

  return { allowed: blockers.length === 0, blockers };
}
