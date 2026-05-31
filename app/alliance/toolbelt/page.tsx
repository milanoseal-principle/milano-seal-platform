import { CheckCircle2, AlertCircle, Circle } from "lucide-react";

interface Tool {
  name: string;
  required: boolean;
  status: "verified" | "pending" | "not_configured";
  pct: number;
  compliance_gate: boolean;
}

const TOOL_CATEGORIES: { category: string; tools: Tool[] }[] = [
  {
    category: "Core Execution Tools",
    tools: [
      {
        name: "Remote Online Notarization (RON) Platform",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
      {
        name: "Digital Signature Platform",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
      {
        name: "Identity Verification (KBA/ID Check)",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
    ],
  },
  {
    category: "Core Infrastructure Tools",
    tools: [
      {
        name: "Secure Document Storage & Delivery",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
      {
        name: "Payment Processing Integration",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
      {
        name: "International Courier API",
        required: false,
        status: "not_configured",
        pct: 0,
        compliance_gate: false,
      },
    ],
  },
  {
    category: "Growth / Ops Tools",
    tools: [
      {
        name: "White-Label Client Intake Widget",
        required: false,
        status: "not_configured",
        pct: 0,
        compliance_gate: false,
      },
      {
        name: "CRM / Client Management Integration",
        required: false,
        status: "not_configured",
        pct: 0,
        compliance_gate: false,
      },
    ],
  },
  {
    category: "Milano Internal Systems",
    tools: [
      {
        name: "Alliance Portal Access",
        required: true,
        status: "verified",
        pct: 100,
        compliance_gate: true,
      },
      {
        name: "Secure Messaging with Milano Seal",
        required: true,
        status: "not_configured",
        pct: 0,
        compliance_gate: true,
      },
    ],
  },
];

const ALL_TOOLS = TOOL_CATEGORIES.flatMap((c) => c.tools);
const VERIFIED = ALL_TOOLS.filter((t) => t.status === "verified").length;
const TOTAL = ALL_TOOLS.length;
const OVERALL_PCT = Math.round((VERIFIED / TOTAL) * 100);

const STATUS_ICON = {
  verified: <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />,
  pending: <AlertCircle size={14} className="text-amber-500 shrink-0" />,
  not_configured: <Circle size={14} className="text-gray-300 shrink-0" />,
};

const STATUS_PILL = {
  verified: <span className="ap-pill green">Verified</span>,
  pending: <span className="ap-pill amber">Pending</span>,
  not_configured: <span className="ap-pill gray">Not Configured</span>,
};

export default function AllianceToolbeltPage() {
  const meetsThreshold = OVERALL_PCT >= 80;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ap-card ap-card-body flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="ap-eyebrow">Execution Infrastructure</div>
          <h1
            className="text-2xl font-semibold text-gray-900 mt-1"
            style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
          >
            Tool Belt
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            80% completion required for routing eligibility.
          </p>
        </div>
        <div className="text-right">
          <div
            className={`text-3xl font-bold font-mono ${meetsThreshold ? "text-emerald-600" : "text-gray-900"}`}
          >
            {OVERALL_PCT}%
          </div>
          <div className="text-xs text-gray-400 mt-1">
            {VERIFIED} / {TOTAL} tools configured
          </div>
          <div className="ap-tool-bar mt-2 w-32 ml-auto">
            <div className="ap-tool-fill" style={{ width: `${OVERALL_PCT}%` }} />
          </div>
        </div>
      </div>

      {/* Categories */}
      {TOOL_CATEGORIES.map((cat) => (
        <div key={cat.category} className="ap-card overflow-hidden">
          <div className="ap-card-header">
            <h3 className="ap-card-title">{cat.category}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="ap-table">
              <thead>
                <tr>
                  <th>Tool</th>
                  <th>Required</th>
                  <th>Status</th>
                  <th>Completion</th>
                  <th>Compliance Gate</th>
                </tr>
              </thead>
              <tbody>
                {cat.tools.map((tool) => (
                  <tr key={tool.name}>
                    <td>
                      <div className="flex items-center gap-2">
                        {STATUS_ICON[tool.status]}
                        <span className="text-gray-900 font-medium text-sm">
                          {tool.name}
                        </span>
                      </div>
                    </td>
                    <td>
                      {tool.required ? (
                        <span className="ap-pill gold">Required</span>
                      ) : (
                        <span className="text-xs text-gray-400">Optional</span>
                      )}
                    </td>
                    <td>{STATUS_PILL[tool.status]}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div
                          className="ap-tool-bar"
                          style={{ width: "80px" }}
                        >
                          <div
                            className="ap-tool-fill"
                            style={{ width: `${tool.pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-gray-500">
                          {tool.pct}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {tool.compliance_gate ? (
                        <span className="text-xs text-emerald-600 font-medium">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
