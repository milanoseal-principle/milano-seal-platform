export const SEO_PHASE_1_ROUTES = ["/pricing", "/secure-portal", "/intake", "/apostille/italy", "/apostille/brazil"] as const;
export const SEO_PHASE_2_TARGET = 60;
export const SEO_PHASE_3_TARGET = 2400;
export const SEO_PHASE_3_STATUS = "staged_only" as const;
export const AFFIDAVIT_CLUSTER_STATUS = "staged" as const;

export function isSeoProgrammaticLive(): boolean {
  return false;
}
