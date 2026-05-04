import type { Metadata } from "next";
import { MilanoShell } from "@/components/dashboard/milano-shell";
import { Toaster } from "@/components/ui/sonner";

export const metadata: Metadata = {
  title: "Admin — The Milano Seal™",
  robots: { index: false, follow: false },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <MilanoShell>{children}</MilanoShell>
      <Toaster
        theme="dark"
        position="top-right"
        toastOptions={{
          classNames: {
            toast:
              "bg-card text-card-foreground border border-border rounded-lg shadow-lg",
            description: "text-muted-foreground",
            actionButton: "bg-primary text-primary-foreground",
            cancelButton: "bg-muted text-muted-foreground",
          },
        }}
      />
    </>
  );
}
