export interface BookingIntakeStage {
  id: string;
  label: string;
  description: string;
  paymentGated: boolean;
  requiresOperatorReview: boolean;
}

export const bookingIntakeRegistry: BookingIntakeStage[] = [
  {
    id: "request-intake",
    label: "Request / Secure Intake",
    description: "Client submits a secure intake request before any scheduling.",
    paymentGated: false,
    requiresOperatorReview: true,
  },
  {
    id: "operator-review",
    label: "Operator Review",
    description: "Operator reviews intake, ORI/agency instructions, and routing.",
    paymentGated: false,
    requiresOperatorReview: true,
  },
  {
    id: "payment-confirmation",
    label: "Payment Confirmation",
    description:
      "Scheduling unlock requires payment confirmation. No confirmed appointment before payment.",
    paymentGated: true,
    requiresOperatorReview: false,
  },
  {
    id: "scheduling",
    label: "Scheduling",
    description: "Appointment scheduling unlocked only after payment confirmation.",
    paymentGated: true,
    requiresOperatorReview: false,
  },
];

export function getBookingStage(id: string): BookingIntakeStage | undefined {
  return bookingIntakeRegistry.find((stage) => stage.id === id);
}
