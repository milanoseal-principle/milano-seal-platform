import { CheckCircle2, AlertCircle, Shield } from "lucide-react";

type ComplianceStatus = "clear" | "pending";

const COMPLIANCE_ITEMS: { title: string; desc: string; status: ComplianceStatus }[] = [
  {
    title: "Alliance Standard Operating Procedures",
    desc: "Acknowledgment of Milano Seal execution SOPs and conduct guidelines.",
    status: "pending",
  },
  {
    title: "Data Handling & Privacy Agreement",
    desc: "GDPR, CCPA, and international data protection compliance confirmation.",
    status: "pending",
  },
  {
    title: "Document Handling Protocol",
    desc: "Secure document transmission, storage, and destruction standards.",
    status: "pending",
  },
  {
    title: "Response SLA Agreement",
    desc: "Commitment to job acceptance and communication response time standards.",
    status: "pending",
  },
  {
    title: "Brand & Representation Guidelines",
    desc: "Approved usage of Milano Seal brand marks, references, and co-branding.",
    status: "pending",
  },
];

export default function AllianceCompliancePage() {
  const allClear = COMPLIANCE_ITEMS.every((c) => c.status === "clear");

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Legal & Operational Standards</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1 mb-2"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Compliance Gate
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          All compliance requirements must be confirmed before routing
          eligibility is granted. Compliance status is re-evaluated periodically
          to maintain network integrity.
        </p>
      </div>

      {/* Overall status */}
      <div
        className={`ap-card ap-card-body flex items-center gap-4 ${allClear ? "border-emerald-200" : ""}`}
        style={allClear ? { borderColor: "rgba(16,185,129,0.25)" } : {}}
      >
        <div
          className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${allClear ? "bg-emerald-50" : "bg-amber-50"}`}
        >
          <Shield
            size={22}
            className={allClear ? "text-emerald-500" : "text-amber-500"}
          />
        </div>
        <div>
          <div className="font-semibold text-gray-900">
            {allClear ? "Compliance Verified" : "Compliance Review Pending"}
          </div>
          <div className="text-sm text-gray-500 mt-0.5">
            {allClear
              ? "All compliance requirements confirmed. Routing eligibility active."
              : "Complete onboarding steps to initiate compliance review."}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="ap-card">
        <div className="ap-card-header">
          <h3 className="ap-card-title">Compliance Checklist</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {COMPLIANCE_ITEMS.map((item) => (
            <div key={item.title} className="flex items-start gap-4 px-6 py-4">
              <div className="mt-0.5">
                {item.status === "clear" ? (
                  <CheckCircle2 size={16} className="text-emerald-500" />
                ) : (
                  <AlertCircle size={16} className="text-gray-300" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold text-gray-900 mb-0.5">
                  {item.title}
                </div>
                <div className="text-xs text-gray-500">{item.desc}</div>
              </div>
              {item.status === "clear" ? (
                <span className="ap-pill green shrink-0">Confirmed</span>
              ) : (
                <span className="ap-pill gray shrink-0">Pending</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
