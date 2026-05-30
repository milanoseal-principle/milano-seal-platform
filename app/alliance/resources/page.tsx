import { Download, BookOpen, FileText, Globe, Shield } from "lucide-react";

const RESOURCES = [
  {
    icon: Globe,
    title: "Hague Apostille Country Index",
    desc: "Current list of Hague Convention member countries and apostille requirements.",
    format: "PDF Reference",
    available: true,
  },
  {
    icon: FileText,
    title: "Consular Legalization Blueprint",
    desc: "Step-by-step consular legalization workflow for non-Hague countries.",
    format: "Document Guide",
    available: true,
  },
  {
    icon: Shield,
    title: "RON Execution Protocol",
    desc: "Remote Online Notarization standards, identity verification requirements, and signer procedures.",
    format: "Operational Manual",
    available: true,
  },
  {
    icon: BookOpen,
    title: "Document Translation Standards",
    desc: "Certified translation requirements by destination country for international use.",
    format: "Reference Sheet",
    available: true,
  },
  {
    icon: FileText,
    title: "Alliance Partner SOP Handbook",
    desc: "Standard operating procedures, conduct guidelines, and execution quality standards.",
    format: "PDF Manual",
    available: false,
  },
  {
    icon: Globe,
    title: "Country-Specific Execution Notes",
    desc: "Embassy quirks, processing timelines, and regional acceptance patterns by jurisdiction.",
    format: "Intelligence Brief",
    available: false,
  },
];

export default function AllianceResourcesPage() {
  return (
    <div className="space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Global Document Intelligence</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Resource Vault
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Official Hague Convention references, execution blueprints, and
          regional formatting protocols for alliance partner use.
        </p>
      </div>

      <div className="ap-card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {RESOURCES.map((r) => (
            <div key={r.title} className="ap-resource">
              <div className="flex items-start gap-4">
                <div className="ap-action-icon mt-0.5 shrink-0">
                  <r.icon size={16} color={r.available ? "#d4af37" : "#9ca3af"} />
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">
                    {r.title}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5 leading-relaxed max-w-lg">
                    {r.desc}
                  </div>
                  <div className="text-xs font-mono text-gray-400 mt-1">
                    {r.format}
                  </div>
                </div>
              </div>
              {r.available ? (
                <button className="ap-btn ghost text-xs shrink-0 ml-4">
                  <Download size={12} />
                  Download
                </button>
              ) : (
                <span className="text-xs text-gray-400 shrink-0 ml-4">
                  Available on approval
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
