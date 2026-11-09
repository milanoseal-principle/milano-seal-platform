"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";

type ResolvedNotarialAct =
  | "acknowledgment"
  | "jurat"
  | "oath_affirmation"
  | "signature_witnessing"
  | "other";

const OPTIONS: Array<{
  value: ResolvedNotarialAct;
  label: string;
  description: string;
}> = [
  {
    value: "acknowledgment",
    label: "Acknowledgment",
    description: "Signer acknowledges executing the document voluntarily.",
  },
  {
    value: "jurat",
    label: "Jurat",
    description: "Signer swears or affirms the truth of the document before signing.",
  },
  {
    value: "oath_affirmation",
    label: "Oath / Affirmation",
    description: "A standalone oath or affirmation is the required notarial act.",
  },
  {
    value: "signature_witnessing",
    label: "Signature Witnessing",
    description: "The notary witnesses the signature rather than taking an acknowledgment or jurat.",
  },
  {
    value: "other",
    label: "Other Confirmed Act",
    description: "Use only when the required act has been independently confirmed and does not fit the standard options.",
  },
];

function authorityMessage(method: string | null | undefined) {
  if (method === "wise_submission_observed") {
    return "A Wise submission is recorded. Scheduling remains locked until settlement is verified.";
  }
  if (method === "verified_payment") {
    return "Wise payment is verified and the payment portion of scheduling is satisfied.";
  }
  if (method === "complimentary_authorization") {
    return "Complimentary authorization is not verified Wise settlement and cannot unlock scheduling.";
  }
  return "Verified Wise settlement must satisfy the canonical scheduling gate before execution can proceed.";
}

export function NotarialActResolution({
  matterId,
  schedulingAuthorized,
  paymentRequirementMethod,
}: {
  matterId: string;
  schedulingAuthorized: boolean;
  paymentRequirementMethod?: string | null;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState<ResolvedNotarialAct | null>(null);

  async function confirmAct(value: ResolvedNotarialAct) {
    if (saving) return;
    setSaving(value);
    try {
      const response = await fetch(
        `/api/dashboard/matters/${encodeURIComponent(matterId)}/execution-truth`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notarial_act: value }),
        },
      );
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message || body.error || "Notarial act could not be saved.");
      }

      toast.success("Notarial act confirmed. RON readiness has been recalculated.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Notarial act could not be saved.",
      );
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--ms-gold)]/25 bg-[radial-gradient(circle_at_0%_0%,rgba(198,165,90,.11),transparent_34%),rgba(8,8,10,.94)]">
      <div className="border-b border-[var(--ms-gold)]/12 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-[var(--ms-gold)]/75">
              Next Required Operator Decision
            </p>
            <h4 className="mt-1 font-serif text-xl text-white">
              Confirm the notarial act
            </h4>
            <p className="mt-2 max-w-2xl text-xs leading-5 text-white/50">
              Intake did not contain a resolved notarial act. Confirm the actual certificate/requested act from the document package or authoritative instructions. The system never chooses acknowledgment versus jurat from the document title alone.
            </p>
          </div>
          <div
            className={`w-fit rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-[0.13em] ${
              schedulingAuthorized
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-300"
                : "border-[#E0876E]/30 bg-[#C0563E]/[0.08] text-[#E0876E]"
            }`}
          >
            {schedulingAuthorized
              ? "Scheduling authority satisfied"
              : "Scheduling gate still blocked"}
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {schedulingAuthorized && (
          <div className="mb-4 flex gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3.5">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <div>
              <p className="text-sm font-medium text-emerald-200">
                Payment is not the blocker.
              </p>
              <p className="mt-1 text-xs leading-5 text-white/48">
                {authorityMessage(paymentRequirementMethod)} Confirming the remaining execution fact will immediately recalculate BlueNotary readiness.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-2.5 sm:grid-cols-2">
          {OPTIONS.map((option) => {
            const pending = saving === option.value;
            return (
              <button
                key={option.value}
                type="button"
                disabled={Boolean(saving)}
                onClick={() => void confirmAct(option.value)}
                className="group min-h-[76px] rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 text-left transition hover:-translate-y-px hover:border-[var(--ms-gold)]/35 hover:bg-[var(--ms-gold)]/[0.045] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ms-gold)]/55 disabled:cursor-wait disabled:opacity-55"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-white/85 group-hover:text-[#F6E8B8]">
                      {option.label}
                    </p>
                    <p className="mt-1 text-[11px] leading-4 text-white/38">
                      {option.description}
                    </p>
                  </div>
                  {pending && (
                    <Loader2 className="mt-0.5 h-4 w-4 shrink-0 animate-spin text-[var(--ms-gold)]" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-4 flex gap-2 rounded-xl border border-amber-500/15 bg-amber-500/[0.035] p-3 text-[11px] leading-5 text-white/38">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-300/80" />
          <p>
            If the act cannot be confirmed from the package or authoritative instructions, leave this Matter in review. Do not choose an act merely to open scheduling or BlueNotary.
          </p>
        </div>
      </div>
    </div>
  );
}
