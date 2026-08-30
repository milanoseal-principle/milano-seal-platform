import { redirect } from "next/navigation";

export const metadata = {
  title: "Shipping Control Room — The Milano Seal™",
  robots: { index: false },
};

/**
 * Compatibility route only.
 * Canonical shipping/courier operator surface lives at /dashboard/courier.
 * Shippo, custody, tracking and release authority remain unchanged.
 */
export default function ShippingCompatibilityPage() {
  redirect("/dashboard/courier");
}
