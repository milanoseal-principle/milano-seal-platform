export type AllianceOperatingState =
  | "ACTIVE"
  | "LIMITED"
  | "PAUSED"
  | "SUSPENDED"
  | "LOST"
  | "NEEDS_REVIEW";

export function mapAllianceState(
  status: string | null | undefined,
): AllianceOperatingState {
  switch ((status ?? "").trim().toLowerCase()) {
    case "active":
      return "ACTIVE";
    case "limited":
      return "LIMITED";
    case "paused":
      return "PAUSED";
    case "suspended":
      return "SUSPENDED";
    case "terminated":
    case "lost":
      return "LOST";
    default:
      return "NEEDS_REVIEW";
  }
}
