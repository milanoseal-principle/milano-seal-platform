import { DESTINATIONS } from "@/data/destinations";
import { DOCUMENTS } from "@/data/documents";

export function getRelatedCountries(currentSlug: string, limit = 6) {
  return DESTINATIONS.filter((d) => d.slug !== currentSlug).slice(0, limit);
}

export function getRelatedDocuments(currentId: string) {
  return DOCUMENTS.filter((d) => d.id !== currentId);
}
