export function isE2EDemoModeEnabled(): boolean {
  // Demo mutation endpoints are permitted only outside the Vercel production
  // environment. A misconfigured MILANO_E2E_DEMO_MODE flag can never activate
  // them on themilanoseal.com.
  if (process.env.VERCEL_ENV === "production") return false;
  return process.env.MILANO_E2E_DEMO_MODE === "true";
}
