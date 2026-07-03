import type { Metadata } from "next";
import { ServicePageLayout } from "@/components/module2/ServicePageLayout";

export const metadata: Metadata = {
  title: "Request an Appointment | The Milano Seal™",
  description:
    "Begin with a secure intake request. Appointments are confirmed only after payment confirmation, and mobile or group requests require operator review.",
  alternates: {
    canonical: "https://www.themilanoseal.com/book",
  },
};

export default function BookPage() {
  return (
    <ServicePageLayout
      h1="Request an Appointment"
      intro="Booking with The Milano Seal begins with a request, not a confirmed slot. We review each intake first so the right route and instructions are in place before anything is scheduled."
      sections={[
        {
          title: "How booking works",
          items: [
            "Submit a secure intake request first",
            "An operator reviews your matter, instructions, and routing",
            "Scheduling is unlocked only after payment confirmation",
            "No confirmed appointment is created before payment",
          ],
        },
        {
          title: "Review requirements",
          items: [
            "Mobile and group requests require operator review",
            "Employment and licensing submissions require agency instructions and ORI",
            "No submission proceeds when a required ORI is missing",
          ],
        },
      ]}
      disclaimers={[
        "Payment confirmation is required before scheduling. Submitting a request does not create a confirmed appointment.",
      ]}
    />
  );
}
