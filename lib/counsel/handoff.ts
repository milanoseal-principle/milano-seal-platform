/** Validate an association only. Professional identity and referral fields must
 * already have been established by the canonical professional workflow. */
export function counselHandoffError(input: {
  inquiryEmail: string;
  profileEmail: string | null | undefined;
  professionalProfileId: string | null | undefined;
  referralSourceType: string | null | undefined;
}): string | null {
  if (
    !input.professionalProfileId ||
    !["professional_submitted", "professional_client_handoff"].includes(
      input.referralSourceType ?? "",
    )
  ) {
    return "Complete the existing professional Matter workflow before linking this inquiry. Professional referral attribution is required.";
  }
  const normalize = (value: string | null | undefined) =>
    String(value ?? "")
      .trim()
      .toLowerCase();
  if (
    !normalize(input.profileEmail) ||
    normalize(input.profileEmail) !== normalize(input.inquiryEmail)
  ) {
    return "The Matter's referring professional does not match this inquiry email. Review the existing professional identity before linking.";
  }
  return null;
}
