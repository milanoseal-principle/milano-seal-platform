import { Upload, FileText, AlertCircle } from "lucide-react";

const CREDENTIAL_TYPES = [
  {
    key: "bar_license",
    label: "Bar License / Legal Practice Certificate",
    required: true,
    status: "pending" as const,
  },
  {
    key: "corporate_reg",
    label: "Corporate Registration / Articles of Incorporation",
    required: true,
    status: "pending" as const,
  },
  {
    key: "operating_permit",
    label: "Regional Operating Permit",
    required: false,
    status: "pending" as const,
  },
  {
    key: "nda",
    label: "Executed Alliance NDA",
    required: true,
    status: "pending" as const,
  },
];

export default function AllianceCredentialsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Identity Verification</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1 mb-2"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Credential Vault
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Verified credentials are required to maintain routing eligibility.
          Documents are reviewed by the Milano Seal compliance team and stored
          securely.
        </p>
      </div>

      {/* Upload zone */}
      <div className="ap-card ap-card-body">
        <div
          className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center"
          style={{ cursor: "not-allowed" }}
        >
          <Upload size={28} className="mx-auto mb-3 text-gray-300" />
          <div className="text-sm font-medium text-gray-600 mb-1">
            Drag credential documents here
          </div>
          <div className="text-xs text-gray-400">
            Accepted formats: PDF, PNG, JPG — Max 25 MB per file
          </div>
          <button
            className="ap-btn ghost mt-4"
            disabled
            style={{ opacity: 0.6, cursor: "not-allowed" }}
          >
            Select Document
          </button>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-amber-600">
            <AlertCircle size={12} />
            Upload wired to Supabase storage — active on account approval
          </div>
        </div>
      </div>

      {/* Required documents list */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Required Documents</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {CREDENTIAL_TYPES.map((c) => (
            <div
              key={c.key}
              className="flex items-center justify-between px-6 py-4"
            >
              <div className="flex items-center gap-3">
                <div className="ap-action-icon">
                  <FileText size={15} color="#9ca3af" />
                </div>
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {c.label}
                  </div>
                  {c.required && (
                    <div className="text-xs text-amber-600 mt-0.5">
                      Required
                    </div>
                  )}
                </div>
              </div>
              <span className="ap-pill gray">Pending</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
