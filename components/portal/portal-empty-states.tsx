"use client";

import { AlertCircle, Clock, Lock, Package, FileText, MessageSquare } from "lucide-react";

interface EmptyStateProps {
  className?: string;
}

// ─── Shared shell ────────────────────────────────────────────────────────────
function EmptyShell({
  icon: Icon,
  title,
  body,
  className = "",
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  className?: string;
}) {
  return (
    <div
      className={`ms-portal-empty-state flex flex-col items-center justify-center text-center py-12 px-6 ${className}`}
    >
      <div className="w-12 h-12 rounded-full bg-[var(--ms-surface-raised)] border border-[var(--ms-border-subtle)] flex items-center justify-center mb-4">
        <Icon aria-hidden="true" className="w-5 h-5 text-[var(--ms-gold-soft)]" />
      </div>
      <h3 className="text-base font-semibold text-[var(--ms-text)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--ms-text-muted)] max-w-sm leading-6">{body}</p>
    </div>
  );
}

// ─── Specific empty states ────────────────────────────────────────────────────

export function NoMatterFound({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={FileText}
      title="No matter on file"
      body="No matter is linked to this account yet. Contact your coordinator if you believe this is a mistake."
      className={className}
    />
  );
}

export function ExpiredPortalToken({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={Lock}
      title="Session expired"
      body="Your access link has expired. Request a new access link from your coordinator to continue."
      className={className}
    />
  );
}

export function PaymentPending({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={Clock}
      title="Payment required"
      body="Payment is required before scheduling and execution can begin. Once payment is confirmed, the next steps will unlock."
      className={className}
    />
  );
}

export function DocumentNotReleased({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={Lock}
      title="Document not yet released"
      body="Your document has not been released for download yet. Once execution and apostille processing are complete, documents will be available here."
      className={className}
    />
  );
}

export function CourierTrackingUnavailable({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={Package}
      title="Tracking not yet available"
      body="Courier tracking details will appear here once your document has been dispatched. Your coordinator will notify you when shipment is confirmed."
      className={className}
    />
  );
}

export function MissingInformation({ fields }: { fields?: string[]; className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-12 h-12 rounded-full bg-amber-950/30 border border-amber-800/30 flex items-center justify-center mb-4">
        <AlertCircle className="w-5 h-5 text-amber-500" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">Additional information needed</h3>
      {fields && fields.length > 0 ? (
        <ul className="text-xs text-gray-400 space-y-1 mt-1">
          {fields.map((f) => (
            <li key={f} className="flex items-center gap-2 justify-center">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              {f}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-gray-500 max-w-xs leading-relaxed">
          Additional information is needed before the matter can proceed. Your coordinator will be in touch.
        </p>
      )}
    </div>
  );
}

export function ReviewNeeded({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={AlertCircle}
      title="Review needed"
      body="This matter requires review before execution can continue. Your coordinator has been notified."
      className={className}
    />
  );
}

export function AssistantExtractionFailed({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={MessageSquare}
      title="Intake structured for review"
      body="Your request has been received and flagged for coordinator review. A team member will follow up to confirm the document details."
      className={className}
    />
  );
}

export function OperatorNotEligible({ blockers }: { blockers?: string[]; className?: string }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-10 px-6">
      <div className="w-12 h-12 rounded-full bg-[#1a1a1c] border border-[#2a2a2d] flex items-center justify-center mb-4">
        <Lock className="w-5 h-5 text-[#D4AF37]" />
      </div>
      <h3 className="text-sm font-semibold text-white mb-2">Routing not yet active</h3>
      <p className="text-xs text-gray-500 max-w-xs leading-relaxed mb-3">
        Live job routing requires completing all onboarding, Tool Belt, and compliance requirements.
      </p>
      {blockers && blockers.length > 0 && (
        <ul className="text-xs text-gray-400 space-y-1">
          {blockers.map((b) => (
            <li key={b} className="flex items-center gap-2 justify-center text-left max-w-xs">
              <span className="w-1 h-1 rounded-full bg-red-400 shrink-0" />
              {b}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AllianceProfileIncomplete({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={AlertCircle}
      title="Profile not yet complete"
      body="Complete all onboarding steps and Tool Belt requirements to activate your alliance account and begin accepting matters."
      className={className}
    />
  );
}

export function NoVerifiedHistory({ className }: EmptyStateProps) {
  return (
    <EmptyShell
      icon={Clock}
      title="Insufficient verified history"
      body="Operator metrics are only displayed once verified through real completed matters. Check back after your first confirmed assignments."
      className={className}
    />
  );
}
