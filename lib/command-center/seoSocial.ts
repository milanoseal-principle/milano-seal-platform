export const authorityProfiles = [
  { label: "Instagram Brand", value: "@themilanoseal", visibility: "public" },
  { label: "Instagram Personal", value: "@mr.nickmilano", visibility: "public" },
  { label: "LinkedIn Company", value: "The Milano Seal", visibility: "public" },
  { label: "LinkedIn Personal", value: "Mr. Nick Milano", visibility: "public" },
  { label: "Facebook Brand", value: "The Milano Seal", visibility: "public" },
  { label: "Google Profile", value: "The Milano Seal", visibility: "public" },
  { label: "Website", value: "themilanoseal.com", visibility: "public" },
  { label: "WhatsApp Business", value: "operator-managed", visibility: "private" },
  { label: "Email", value: "nicholas@themilanoseal.com", visibility: "public" },
  { label: "Wise Payment", value: "internal only; approved payment flow only", visibility: "internal" },
] as const;

export const authorityPageTargets = [
  { legacyTarget: "/apostille-for-italy", currentRoute: "/countries/italy", intent: "Italy apostille authority" },
  { legacyTarget: "/remote-online-notary", currentRoute: "/services", intent: "RON eligibility education" },
  { legacyTarget: "/international-notary", currentRoute: "/services", intent: "international execution positioning" },
  { legacyTarget: "/international-affidavit-library", currentRoute: "/documents/affidavit", intent: "affidavit document demand" },
  { legacyTarget: "/fbi-apostille", currentRoute: "/services", intent: "FBI apostille coordination" },
  { legacyTarget: "/review", currentRoute: "/reviews", intent: "post-delivery reputation flow" },
] as const;

export function getPublicAuthorityProfiles() {
  return authorityProfiles.filter((profile) => profile.visibility === "public");
}

export function mapAuthorityTarget(target: string) {
  return authorityPageTargets.find((page) => page.legacyTarget === target || page.currentRoute === target) ?? null;
}
