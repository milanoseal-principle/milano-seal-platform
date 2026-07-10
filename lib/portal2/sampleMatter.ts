// Client Portal 2.0 — SAMPLE matter for the labeled preview experience.
//
// This is clearly-labeled sample content (see isSample in ClientPortalShell).
// It is NOT real client data. It exists only so an account with no linked
// matter can preview the portal. Every field here is client-safe by design.

import type { PortalMatter } from "./types";

export function buildSampleMatter(): PortalMatter {
  return {
    matterId: "sample-matter",
    displayId: "SAMPLE-01",
    clientName: "Sample Client",
    documentType: "Power of Attorney",
    destinationCountry: "Italy",
    status: "apostille_processing",
    paymentConfirmed: true,
    createdAt: "2026-06-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",

    timeline: [
      { id: "s1", status: "intake_received", label: "Intake Received", description: "", timestamp: "2026-06-01T10:00:00.000Z", state: "complete" },
      { id: "s2", status: "quoted", label: "Proposal Issued", description: "", timestamp: "2026-06-03T10:00:00.000Z", state: "complete" },
      { id: "s3", status: "in_execution", label: "In Execution", description: "", timestamp: "2026-06-20T10:00:00.000Z", state: "complete" },
      { id: "s4", status: "apostille_processing", label: "Apostille Processing", description: "", timestamp: "2026-07-01T10:00:00.000Z", state: "current" },
    ],

    invoice: {
      invoiceNumber: "INV-SAMPLE-01",
      currency: "USD",
      amountDue: 1450,
      amountPaid: 1450,
      balance: 0,
      status: "paid",
      issuedAt: "2026-06-03T10:00:00.000Z",
      paidAt: "2026-06-05T10:00:00.000Z",
    },

    vault: [
      { id: "v1", name: "Power of Attorney (client upload)", category: "client_upload", status: "available", availableAt: "2026-06-01T10:00:00.000Z", downloadable: true },
      { id: "v2", name: "Executed & Notarized Document", category: "executed_document", status: "available", availableAt: "2026-06-20T10:00:00.000Z", downloadable: true },
      { id: "v3", name: "Apostille Certificate", category: "apostille", status: "processing", availableAt: null, downloadable: false },
    ],

    executionChecklist: [
      { id: "c1", label: "Confirm signer identity", description: "Government-issued photo ID verified.", state: "complete", clientAction: false },
      { id: "c2", label: "Bring valid ID to session", description: "Have your passport or driver's license ready.", state: "complete", clientAction: true },
      { id: "c3", label: "Notarization session", description: "Remote online notarization completed.", state: "complete", clientAction: false },
      { id: "c4", label: "Apostille submission", description: "Document submitted to the state authority.", state: "in_progress", clientAction: false },
    ],

    ronMilestones: [
      { id: "r1", label: "Session scheduled", timestamp: "2026-06-18T10:00:00.000Z", state: "complete" },
      { id: "r2", label: "Identity verified", timestamp: "2026-06-20T10:00:00.000Z", state: "complete" },
      { id: "r3", label: "Document signed & sealed", timestamp: "2026-06-20T10:05:00.000Z", state: "complete" },
    ],

    apostilleMilestones: [
      { id: "a1", label: "Submitted for apostille", authority: "Secretary of State", timestamp: "2026-06-22T10:00:00.000Z", state: "complete" },
      { id: "a2", label: "Apostille in processing", authority: "Secretary of State", timestamp: "2026-07-01T10:00:00.000Z", state: "current" },
      { id: "a3", label: "Apostille issued", authority: "Secretary of State", timestamp: null, state: "upcoming" },
    ],

    courierMilestones: [
      { id: "k1", label: "Awaiting release", location: null, timestamp: null, state: "current" },
      { id: "k2", label: "Handed to courier", location: null, timestamp: null, state: "upcoming" },
      { id: "k3", label: "Delivered", location: "Italy", timestamp: null, state: "upcoming" },
    ],

    countryReadiness: {
      destinationCountry: "Italy",
      hagueMember: true,
      requirements: [
        { id: "q1", label: "Notarized original document", met: true },
        { id: "q2", label: "Apostille from issuing authority", met: false },
        { id: "q3", label: "Certified translation (if required)", met: false },
      ],
      note: "Italy is a party to the Hague Apostille Convention, so an apostille is generally used in place of consular legalization.",
    },

    finalRelease: [
      { id: "f1", label: "Apostilled Document Packet", released: false, releasedAt: null, downloadable: false },
      { id: "f2", label: "Certificate of Completion", released: false, releasedAt: null, downloadable: false },
    ],

    completionCertificate: {
      certificateId: null,
      matterDisplayId: "SAMPLE-01",
      clientName: "Sample Client",
      documentType: "Power of Attorney",
      destinationCountry: "Italy",
      completedAt: null,
      verificationUrl: null,
      available: false,
    },
  };
}
