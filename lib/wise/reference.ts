export type PaymentType =
  | "retainer"
  | "final_balance"
  | "rush_upgrade"
  | "translation_addon"
  | "additional_apostille"
  | "supplemental"
  | "refund";

const TYPE_SUFFIX: Record<PaymentType, string> = {
  retainer: "R",
  final_balance: "F",
  rush_upgrade: "U",
  translation_addon: "T",
  additional_apostille: "A",
  supplemental: "S",
  refund: "X",
};

const TYPE_LABEL: Record<PaymentType, string> = {
  retainer: "Retainer (50%)",
  final_balance: "Final Balance",
  rush_upgrade: "Rush Upgrade",
  translation_addon: "Translation",
  additional_apostille: "Additional Apostille",
  supplemental: "Supplemental",
  refund: "Refund",
};

export function generatePaymentReference(
  matterReference: string,
  paymentType: PaymentType,
): string {
  const suffix = TYPE_SUFFIX[paymentType];
  return `${matterReference}-${suffix}`;
}

export function generatePaymentDescription(
  paymentType: PaymentType,
  founderName: string = "Nicholas Milano",
): string {
  return `The Milano Seal™ — ${TYPE_LABEL[paymentType]} — ${founderName}`;
}

export function getPaymentTypeLabel(paymentType: PaymentType): string {
  return TYPE_LABEL[paymentType];
}
