/**
 * Authority Change Log
 *
 * Immutable append-only audit trail for all authority record changes.
 * Every confidence promotion, demotion, source addition, or rule change
 * must be recorded here. Never delete or overwrite entries.
 *
 * In production this would persist to the database.
 * This module holds the in-memory seed entries for the 7 seed authorities.
 */

import type { AuthorityChangeLogEntry, AuthorityTimelineEvent, SourceVaultEntry } from "./types";

export const AUTHORITY_CHANGE_LOG: AuthorityChangeLogEntry[] = [
  // Entries appended here as changes occur.
  // Format: { id, authority_id, field, old_value, new_value, actor, reason, timestamp, system_generated }
];

export const AUTHORITY_TIMELINE: AuthorityTimelineEvent[] = [
  // Seed creation events for each of the 7 seed authorities
  {
    id: "tl-it-comune-cansano-001",
    authority_id: "it-comune-cansano",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-it-comune-roma-001",
    authority_id: "it-comune-roma",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-it-comune-milano-001",
    authority_id: "it-comune-milano",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-it-prefettura-001",
    authority_id: "it-prefettura",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-pt-conservatoria-001",
    authority_id: "pt-conservatoria-registo-civil",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-mx-registro-civil-001",
    authority_id: "mx-registro-civil",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
  {
    id: "tl-mx-notaria-001",
    authority_id: "mx-notaria-publica",
    event_type: "CREATED",
    actor: "system",
    note: "Seed authority record created. VERIFICATION_REQUIRED.",
    timestamp: "2026-05-31T00:00:00Z",
  },
];

export const SOURCE_VAULT: SourceVaultEntry[] = [
  // Source vault entries appended here as sources are captured.
  // Never pre-populate without a real source.
];
