export type CounselMatterTruth = {
  id: string;
  professional_profile_id?: string | null;
  quote_approved_at?: string | null;
  payment_settlement_status?: string | null;
  payment_confirmed?: boolean | null;
  completed_at?: string | null;
};
/** Only canonical records feed these counts. Public marketing events are never inputs. */
export function counselOperationalFunnel(rows: CounselMatterTruth[]) {
  const matters = [...new Map(rows.map((row) => [row.id, row])).values()];
  const profiles = new Map<string, number>();
  for (const matter of matters)
    if (matter.professional_profile_id)
      profiles.set(
        matter.professional_profile_id,
        (profiles.get(matter.professional_profile_id) ?? 0) + 1,
      );
  return {
    linked_matters: matters.length,
    reviewed_quotes: matters.filter((matter) =>
      Boolean(matter.quote_approved_at),
    ).length,
    verified_settlements: matters.filter(
      (matter) =>
        matter.payment_confirmed === true &&
        matter.payment_settlement_status === "cleared",
    ).length,
    completed_matters: matters.filter((matter) => Boolean(matter.completed_at))
      .length,
    repeat_professional_sources_in_linked_matters: [
      ...profiles.values(),
    ].filter((count) => count > 1).length,
  };
}
