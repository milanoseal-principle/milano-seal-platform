import { SecureDocumentVault } from "@/components/alliance/SecureDocumentVault";

export default function AllianceVaultPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium mb-1">
          Alliance Intelligence
        </p>
        <h1 className="font-serif text-3xl text-foreground">
          Secure Document Exchange
        </h1>
        <p className="text-muted-foreground mt-1 max-w-xl text-sm">
          Zero-knowledge custody channel for multi-jurisdictional legal materials.
          Distributed strictly to assigned operators with active clearance.
        </p>
      </div>

      {/* Protocol specs */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Custody Protocol", value: "Zero-Knowledge" },
          { label: "Access Model", value: "Operator-Scoped" },
          { label: "Vault Status", value: "Pending Activation" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-sm px-4 py-3"
            style={{
              background: "rgba(8,5,1,0.96)",
              border: "1px solid rgba(212,175,55,0.1)",
            }}
          >
            <div
              className="text-sm font-light"
              style={{
                fontFamily: "var(--font-playfair),Georgia,serif",
                color: "rgba(212,175,55,0.8)",
              }}
            >
              {m.value}
            </div>
            <div
              className="text-[9px] font-mono uppercase tracking-[0.18em] mt-1"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              {m.label}
            </div>
          </div>
        ))}
      </div>

      {/* Vault — empty until custody channels provisioned */}
      <SecureDocumentVault documents={[]} />
    </div>
  );
}
