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
  {
    id: "cl-it-comune-cansano-001",
    authority_id: "it-comune-cansano",
    field: "authority_confidence",
    old_value: "VERIFICATION_REQUIRED",
    new_value: "OBSERVED",
    actor: "system-research",
    reason: "Initial source discovery run. Official municipal website confirmed at comune.cansano.aq.it. Phone, PEC, address, and anagrafe/stato civile service presence verified via indexed search results. No requirements page found — ceiling is OBSERVED.",
    timestamp: "2026-05-31T00:00:00Z",
    system_generated: false,
  },
  {
    id: "cl-it-comune-roma-001",
    authority_id: "it-comune-roma",
    field: "authority_confidence",
    old_value: "VERIFICATION_REQUIRED",
    new_value: "OBSERVED",
    actor: "system-research",
    reason: "Source discovery run. Official Roma Capitale website confirmed at www.comune.roma.it. Stato Civile office page, PEC certificati.anagrafe@pec.comune.roma.it, unified phone 060606, and Via Luigi Petroselli 50 address confirmed via official indexed pages. No municipal requirements page found — confidence ceiling OBSERVED.",
    timestamp: "2026-05-31T00:00:00Z",
    system_generated: false,
  },
  {
    id: "cl-it-comune-milano-001",
    authority_id: "it-comune-milano",
    field: "authority_confidence",
    old_value: "VERIFICATION_REQUIRED",
    new_value: "OBSERVED",
    actor: "system-research",
    reason: "Source discovery run. Official Comune di Milano website confirmed at www.comune.milano.it. Stato Civile and anagrafe service pages confirmed, PEC protocollo@postacert.comune.milano.it, unified phone 020202, and Via Larga 12 address confirmed via official indexed pages. No municipal requirements page found — confidence ceiling OBSERVED.",
    timestamp: "2026-05-31T00:00:00Z",
    system_generated: false,
  },
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
    id: "tl-it-comune-cansano-002",
    authority_id: "it-comune-cansano",
    event_type: "OBSERVED",
    actor: "system-research",
    note: "Official website identified at https://comune.cansano.aq.it/. Contact information on file: phone +39 0864 40131, PEC comunedicansano@pec.it, address Viale Felice Villani n. 1, 67030 Cansano (AQ). Anagrafe/Stato Civile service presence confirmed via transparency index. No requirements page found.",
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
    id: "tl-it-comune-roma-002",
    authority_id: "it-comune-roma",
    event_type: "OBSERVED",
    actor: "system-research",
    note: "Official website confirmed at https://www.comune.roma.it. Stato Civile office page and Anagrafe office listing confirmed at comune.roma.it. Contact details on file: PEC certificati.anagrafe@pec.comune.roma.it, phone 060606, address Via Luigi Petroselli 50 Roma. Hours: Mon/Wed/Fri 08:30–13:00, Tue/Thu 08:30–17:00 by appointment (TUPASSI). No municipal requirements page found. Apostille handled by Prefettura di Roma.",
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
    id: "tl-it-comune-milano-002",
    authority_id: "it-comune-milano",
    event_type: "OBSERVED",
    actor: "system-research",
    note: "Official website confirmed at https://www.comune.milano.it. Stato Civile and anagrafe service pages confirmed including sedi-anagrafiche page. Contact details on file: PEC protocollo@postacert.comune.milano.it, phone 020202, address Via Larga 12 (entrance Via Pecorari 3) 20122 Milano. Hours: Mon–Fri 08:30–15:30, Thu 08:30–19:00, Sat 08:30–11:30 by appointment. No municipal requirements page found. Apostille handled by Prefettura di Milano.",
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
  {
    id: "sv-it-comune-cansano-001",
    authority_id: "it-comune-cansano",
    source_type: "RECEIVING_AUTHORITY",
    label: "Official Comune di Cansano website",
    url: "https://comune.cansano.aq.it/",
    notes: "Official institutional site on comune.cansano.aq.it domain (Province of L'Aquila, Abruzzo). Confirmed active in search index. Contains transparency section listing offices including Anagrafe/Stato Civile. Phone 0864/40131 and PEC comunedicansano@pec.it confirmed from search result snippets cross-referencing the site transparency pages. No document requirements page found at time of capture.",
    captured_at: "2026-05-31T00:00:00Z",
    captured_by: "system-research",
    valid_from: "2026-05-31",
    valid_to: null,
  },
  {
    id: "sv-it-comune-roma-001",
    authority_id: "it-comune-roma",
    source_type: "RECEIVING_AUTHORITY",
    label: "Official Roma Capitale website — Anagrafe Stato Civile office listing",
    url: "https://www.comune.roma.it/web/it/dettaglio.page?contentId=UFF25457",
    notes: "Official Roma Capitale institutional site (comune.roma.it domain). Office listing page for Ufficio Anagrafe Stato Civile e Certificazioni confirmed active in search index. PEC certificati.anagrafe@pec.comune.roma.it and phone 060606 confirmed from indexed official service pages. Stato Civile service page also at /scheda-servizi.page?contentId=INF138464. Via Luigi Petroselli 50 address confirmed. No document requirements page found at time of capture.",
    captured_at: "2026-05-31T00:00:00Z",
    captured_by: "system-research",
    valid_from: "2026-05-31",
    valid_to: null,
  },
  {
    id: "sv-it-comune-milano-001",
    authority_id: "it-comune-milano",
    source_type: "RECEIVING_AUTHORITY",
    label: "Official Comune di Milano website — anagrafe registered offices page",
    url: "https://www.comune.milano.it/en/argomenti/anagrafe/sedi-anagrafiche",
    notes: "Official Comune di Milano institutional site (comune.milano.it domain). Registered offices page for anagrafe confirmed active in search index. PEC protocollo@postacert.comune.milano.it and phone 020202 confirmed from indexed official pages. Stato Civile corrections service page also at /servizi/anagrafe/rettifiche-di-atti-di-nascita-matrimonio-cittadinanza-decesso. Via Larga 12 address confirmed. No document requirements page found at time of capture.",
    captured_at: "2026-05-31T00:00:00Z",
    captured_by: "system-research",
    valid_from: "2026-05-31",
    valid_to: null,
  },
];
