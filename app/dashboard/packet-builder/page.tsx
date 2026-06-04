import { requireDashboardAccess } from "@/lib/dashboardAuth";
import { DocumentPacketBuilder } from "@/components/dashboard/DocumentPacketBuilder";

export const dynamic = "force-dynamic";

export default async function PacketBuilderPage() {
  await requireDashboardAccess();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-[rgba(198,165,90,0.7)] font-medium mb-2">
          Execution Intelligence
        </p>
        <h1 className="font-serif text-4xl text-foreground">Document Packet Builder</h1>
        <p className="text-muted-foreground mt-2 max-w-xl">
          Standard preparation checklists for each packet type — documents, signers, certificates, apostille path, and release requirements.
        </p>
      </div>

      <DocumentPacketBuilder />
    </div>
  );
}
