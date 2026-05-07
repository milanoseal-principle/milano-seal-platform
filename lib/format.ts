export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatCurrencyDetailed(
  amount: number | null | undefined
): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
}

export function formatDate(
  dateString: string | Date | null | undefined
): string {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(
  dateString: string | Date | null | undefined
): string {
  if (!dateString) return "—";
  const date =
    typeof dateString === "string" ? new Date(dateString) : dateString;
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

export function timeAgo(dateString: string | Date | null | undefined): string {
  if (!dateString) return "—";
  const d =
    typeof dateString === "string"
      ? new Date(dateString).getTime()
      : dateString.getTime();
  if (Number.isNaN(d)) return "—";
  const diff = (Date.now() - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return formatDate(dateString);
}

export function capitalize(str: string | null | undefined): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  reviewing: "In Review",
  quoted: "Quoted",
  awaiting_payment: "Awaiting Payment",
  scheduled: "Scheduled",
  in_execution: "In Execution",
  apostille: "Apostille",
  shipped: "Shipped",
  completed: "Completed",
  lost: "Lost",
};

export function stageLabel(stage: string | null | undefined): string {
  if (!stage) return "—";
  return STAGE_LABELS[stage] ?? capitalize(stage.replace(/_/g, " "));
}

export type StageTone = "paid" | "await" | "critical" | "muted";

export function stageTone(stage: string | null | undefined): StageTone {
  if (!stage) return "muted";
  if (["completed", "shipped"].includes(stage)) return "paid";
  if (stage === "lost") return "critical";
  if (["in_execution", "apostille", "scheduled"].includes(stage)) return "paid";
  if (["new", "reviewing", "quoted", "awaiting_payment"].includes(stage))
    return "await";
  return "muted";
}

export function stageBadgeClasses(stage: string | null | undefined): string {
  switch (stageTone(stage)) {
    case "paid":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "await":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "critical":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-white/5 text-white/60 border-white/10";
  }
}

export function paymentBadgeClasses(status: string | null | undefined): string {
  if (status === "paid")
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  if (status === "failed")
    return "bg-red-500/10 text-red-400 border-red-500/20";
  return "bg-amber-500/10 text-amber-400 border-amber-500/20";
}
