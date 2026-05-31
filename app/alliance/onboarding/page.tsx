import { CheckCircle2, Clock, Circle } from "lucide-react";

const STEPS = [
  {
    num: "01",
    title: "Alliance Agreement",
    desc: "Sign the referral agreement, commission structure, data handling terms, and brand usage guidelines.",
    status: "done" as const,
  },
  {
    num: "02",
    title: "Corporate Profile Setup",
    desc: "Provide firm name, operating jurisdiction, payout banking details, and primary contact information.",
    status: "active" as const,
  },
  {
    num: "03",
    title: "Credential Submission",
    desc: "Upload operating permits, bar license, or corporate registration documents for verification review.",
    status: "pending" as const,
  },
  {
    num: "04",
    title: "Compliance Review",
    desc: "Milano Seal compliance team reviews your submission and confirms routing eligibility.",
    status: "pending" as const,
  },
  {
    num: "05",
    title: "Tool Belt Configuration",
    desc: "Configure required execution tools, infrastructure connections, and internal system access.",
    status: "pending" as const,
  },
  {
    num: "06",
    title: "Routing Activation",
    desc: "Account cleared for live job routing, white-label intake links, and commission tracking.",
    status: "pending" as const,
  },
];

const STATUS_ICON = {
  done: <CheckCircle2 size={14} className="text-emerald-600" />,
  active: <Clock size={14} className="text-amber-500" />,
  pending: <Circle size={14} className="text-gray-300" />,
};

const STATUS_LABEL = {
  done: <span className="ap-pill green">Completed</span>,
  active: <span className="ap-pill amber">In Progress</span>,
  pending: <span className="ap-pill gray">Pending</span>,
};

export default function AllianceOnboardingPage() {
  const completedCount = STEPS.filter((s) => s.status === "done").length;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="ap-card ap-card-body">
        <div className="ap-eyebrow">Partner Onboarding</div>
        <h1
          className="text-2xl font-semibold text-gray-900 mt-1 mb-2"
          style={{ fontFamily: "var(--font-playfair), Georgia, serif" }}
        >
          Onboarding Progress
        </h1>
        <p className="text-sm text-gray-500">
          Complete all steps to activate routing eligibility and begin accepting
          cross-border execution jobs.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 ap-tool-bar">
            <div
              className="ap-tool-fill"
              style={{ width: `${(completedCount / STEPS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs font-mono text-gray-500">
            {completedCount} / {STEPS.length}
          </span>
        </div>
      </div>

      <div className="ap-card overflow-hidden">
        <div className="divide-y divide-gray-100">
          {STEPS.map((step) => (
            <div key={step.num} className={`ap-step ${step.status} m-0 rounded-none border-0 border-b last:border-b-0`}
              style={{ borderRadius: 0, border: "none", borderBottom: "1px solid #f3f4f6" }}>
              <div
                className={`ap-step-num ${step.status === "done" ? "done" : step.status === "active" ? "active" : ""}`}
              >
                {STATUS_ICON[step.status]}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
                  <span className="text-sm font-semibold text-gray-900">
                    {step.title}
                  </span>
                  {STATUS_LABEL[step.status]}
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
