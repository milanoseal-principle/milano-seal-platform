/**
 * Authority Dependency Graph
 *
 * Defines the ordered chains of authorities a document must pass through
 * for a given country and document type.
 *
 * Rules:
 * - required_order: 1 = first (origin/issuing), highest number = receiving end
 * - All dependencies are advisory until upstream authority is at least OBSERVED
 * - Never assert a dependency as confirmed without a source
 * - Dependencies sourced from country-level Hague guidance or direct authority research
 *
 * Current state: Italian execution chains seeded from general knowledge of
 * Italian document authentication procedures. All marked source_reference: null
 * until operator verifies against official sources.
 */

import type { AuthorityDependency } from "./types";

export const AUTHORITY_DEPENDENCIES: AuthorityDependency[] = [
  // ── Italy — Birth Certificate chain ──────────────────────────────────────────
  // General pattern: Italian municipality (origin) → Prefettura (apostille) → Receiving authority
  // Note: For matters sent to receiving authorities that accept apostille directly,
  // the consulate step is skipped. Chain below represents full authentication path.

  {
    id: "dep-it-birth-cert-001",
    document_type_slug: "birth-certificate",
    country: "IT",
    upstream_authority_id: "it-comune-cansano",
    downstream_authority_id: "it-prefettura-laquila",
    dependency_type: "authentication_chain",
    upstream_role: "origin",
    downstream_role: "authenticator",
    required_order: 1,
    condition_note: "Applies when the birth record originates from Comune di Cansano. Prefettura di L'Aquila handles apostille for Abruzzo municipalities.",
    source_reference: null,
    valid_from: "2026-05-31",
    valid_to: null,
  },
  {
    id: "dep-it-birth-cert-002",
    document_type_slug: "birth-certificate",
    country: "IT",
    upstream_authority_id: "it-comune-roma",
    downstream_authority_id: "it-prefettura-roma",
    dependency_type: "authentication_chain",
    upstream_role: "origin",
    downstream_role: "authenticator",
    required_order: 1,
    condition_note: "Applies when birth record originates from Comune di Roma. Prefettura di Roma handles apostille for Lazio municipalities.",
    source_reference: null,
    valid_from: "2026-05-31",
    valid_to: null,
  },
  {
    id: "dep-it-birth-cert-003",
    document_type_slug: "birth-certificate",
    country: "IT",
    upstream_authority_id: "it-comune-milano",
    downstream_authority_id: "it-prefettura-milano",
    dependency_type: "authentication_chain",
    upstream_role: "origin",
    downstream_role: "authenticator",
    required_order: 1,
    condition_note: "Applies when birth record originates from Comune di Milano. Prefettura di Milano handles apostille for Lombardia municipalities.",
    source_reference: null,
    valid_from: "2026-05-31",
    valid_to: null,
  },

  // ── Italy — Power of Attorney chain ──────────────────────────────────────────
  // General pattern: Notaio (origin) → Prefettura (apostille)
  // Note: POA apostille in Italy issues from Prefettura of the notary's registration.

  // No POA-specific Italian notaio seed authority yet — placeholder structure only.
  // Add dep entries when it-notaio-* records are seeded.

  // ── Mexico — Birth Certificate chain ─────────────────────────────────────────
  // General pattern: Registro Civil (origin) → SRE (apostille) → Receiving authority
  // Mexico apostille issues from SRE (Secretaría de Relaciones Exteriores) state offices.

  {
    id: "dep-mx-birth-cert-001",
    document_type_slug: "birth-certificate",
    country: "MX",
    upstream_authority_id: "mx-registro-civil",
    downstream_authority_id: "mx-notaria-publica",
    dependency_type: "conditional",
    upstream_role: "origin",
    downstream_role: "authenticator",
    required_order: 1,
    condition_note: "Notarization of Registro Civil extract may be required by some receiving authorities. Conditional — not universally required.",
    source_reference: null,
    valid_from: "2026-05-31",
    valid_to: null,
  },

  // ── Portugal — Birth Certificate chain ───────────────────────────────────────
  // General pattern: Conservatória do Registo Civil (origin) → IRN (central coordination) → Apostille

  {
    id: "dep-pt-birth-cert-001",
    document_type_slug: "birth-certificate",
    country: "PT",
    upstream_authority_id: "pt-conservatoria-registo-civil",
    downstream_authority_id: "pt-conservatoria-registo-civil",
    dependency_type: "authentication_chain",
    upstream_role: "origin",
    downstream_role: "authenticator",
    required_order: 1,
    condition_note: "Portuguese apostille issues from the same Conservatória that issues the certificate, or from the IRN central office. Dependency self-references as both origin and authenticator at same authority type level.",
    source_reference: null,
    valid_from: "2026-05-31",
    valid_to: null,
  },
];
