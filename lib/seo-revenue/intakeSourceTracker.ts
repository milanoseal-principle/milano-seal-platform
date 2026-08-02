export function createIntakeSourceSlug(slug: string) {
  return `svc_${slug.replace(/-/g, "_")}`;
}
