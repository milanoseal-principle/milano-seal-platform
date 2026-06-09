import { COUNTRY_REGISTRY } from "./countries";
import { DOCUMENT_TAXONOMY } from "./documents";

export interface ValidationError {
  type: "country" | "document";
  slug: string;
  field: string;
  message: string;
}

export function validateCountryRegistry(): ValidationError[] {
  const errors: ValidationError[] = [];
  const slugs = new Set<string>();

  for (const country of COUNTRY_REGISTRY) {
    if (slugs.has(country.slug)) {
      errors.push({ type: "country", slug: country.slug, field: "slug", message: "Duplicate slug" });
    }
    slugs.add(country.slug);

    if (!country.seoTitle) {
      errors.push({ type: "country", slug: country.slug, field: "seoTitle", message: "Missing seoTitle" });
    }
    if (!country.seoDescription) {
      errors.push({ type: "country", slug: country.slug, field: "seoDescription", message: "Missing seoDescription" });
    }
    if (country.apostilleRequired && country.hagueMember === "non-member") {
      errors.push({
        type: "country",
        slug: country.slug,
        field: "apostilleRequired",
        message: "Non-Hague member cannot have apostilleRequired: true without explicit bilateral agreement",
      });
    }
  }

  return errors;
}

export function validateDocumentTaxonomy(): ValidationError[] {
  const errors: ValidationError[] = [];
  const slugs = new Set<string>();

  for (const doc of DOCUMENT_TAXONOMY) {
    if (slugs.has(doc.slug)) {
      errors.push({ type: "document", slug: doc.slug, field: "slug", message: "Duplicate slug" });
    }
    slugs.add(doc.slug);

    if (!doc.seoTitle) {
      errors.push({ type: "document", slug: doc.slug, field: "seoTitle", message: "Missing seoTitle" });
    }
    if (!doc.seoDescription) {
      errors.push({ type: "document", slug: doc.slug, field: "seoDescription", message: "Missing seoDescription" });
    }
  }

  return errors;
}

export function validateAll(): { valid: boolean; errors: ValidationError[] } {
  const errors = [
    ...validateCountryRegistry(),
    ...validateDocumentTaxonomy(),
  ];
  return { valid: errors.length === 0, errors };
}
