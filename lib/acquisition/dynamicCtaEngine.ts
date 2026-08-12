import type { AcquisitionAudience } from "./types";
const CTA_COPY: Record<AcquisitionAudience, string> = { country: "Begin Secure Records Intake", attorney: "Request Professional Coordination", university: "Review Academic Document Path", healthcare: "Review Healthcare Document Path", professional: "Request Professional Coordinator Review", airport_emergency: "Request Airport-Area Availability Review" };
export function getDynamicCta(audience: AcquisitionAudience): string { return CTA_COPY[audience]; }
