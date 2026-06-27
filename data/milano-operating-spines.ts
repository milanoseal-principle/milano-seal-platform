export type MilanoOperatingSpine = { id: string; label: string; publicName: string; privateName: string; purpose: string; publicSummary: string; privateControlNotes: string[]; requiredInputs: string[]; requiredChecks: string[]; unlockCondition: string; clientVisibleStatus: string; operatorEvents: string[]; failureModes: string[]; resolutionProtocol: string[]; };

const boundary = "Receiving-authority review applies. Milano Seal is not a law firm and does not provide legal advice or guarantee acceptance.";
export const MILANO_OPERATING_SPINES: MilanoOperatingSpine[] = [
  {
    "id": "public_authority_engine",
    "label": "Public Authority Engine",
    "publicName": "public authority engine",
    "privateName": "public_authority_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "smart_intake_engine",
    "label": "Smart Intake Engine",
    "publicName": "smart intake engine",
    "privateName": "smart_intake_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "trust_engine",
    "label": "Trust Engine",
    "publicName": "trust engine",
    "privateName": "trust_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "compliance_routing_engine",
    "label": "Compliance Routing Engine",
    "publicName": "compliance routing engine",
    "privateName": "compliance_routing_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "global_compliance_atlas_engine",
    "label": "Global Compliance Atlas Engine",
    "publicName": "global compliance atlas engine",
    "privateName": "global_compliance_atlas_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "receiving_authority_engine",
    "label": "Receiving Authority Engine",
    "publicName": "receiving authority engine",
    "privateName": "receiving_authority_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "identifier_lock_engine",
    "label": "Identifier Lock Engine",
    "publicName": "identifier lock engine",
    "privateName": "identifier_lock_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "document_version_engine",
    "label": "Document Version Engine",
    "publicName": "document version engine",
    "privateName": "document_version_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "pricing_proforma_engine",
    "label": "Pricing Proforma Engine",
    "publicName": "pricing proforma engine",
    "privateName": "pricing_proforma_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "wise_payment_gate_engine",
    "label": "Wise Payment Gate Engine",
    "publicName": "wise payment gate engine",
    "privateName": "wise_payment_gate_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "discount_code_engine",
    "label": "Discount Code Engine",
    "publicName": "discount code engine",
    "privateName": "discount_code_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "scheduling_ron_engine",
    "label": "Scheduling Ron Engine",
    "publicName": "scheduling ron engine",
    "privateName": "scheduling_ron_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "deposit_confirmed or operator override",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "execution_qa_engine",
    "label": "Execution Qa Engine",
    "publicName": "execution qa engine",
    "privateName": "execution_qa_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "apostille_packet_engine",
    "label": "Apostille Packet Engine",
    "publicName": "apostille packet engine",
    "privateName": "apostille_packet_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "final_payment_release_engine",
    "label": "Final Payment Release Engine",
    "publicName": "final payment release engine",
    "privateName": "final_payment_release_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "final_payment_confirmed",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "final_packet_engine",
    "label": "Final Packet Engine",
    "publicName": "final packet engine",
    "privateName": "final_packet_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "shippo_shipping_engine",
    "label": "Shippo Shipping Engine",
    "publicName": "shippo shipping engine",
    "privateName": "shippo_shipping_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "customs_delivery_watch_engine",
    "label": "Customs Delivery Watch Engine",
    "publicName": "customs delivery watch engine",
    "privateName": "customs_delivery_watch_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "client_portal_confidence_engine",
    "label": "Client Portal Confidence Engine",
    "publicName": "client portal confidence engine",
    "privateName": "client_portal_confidence_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "client_notification_engine",
    "label": "Client Notification Engine",
    "publicName": "client notification engine",
    "privateName": "client_notification_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "error_delay_resolution_engine",
    "label": "Error Delay Resolution Engine",
    "publicName": "error delay resolution engine",
    "privateName": "error_delay_resolution_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "alliance_notary_engine",
    "label": "Alliance Notary Engine",
    "publicName": "alliance notary engine",
    "privateName": "alliance_notary_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "va_review_engine",
    "label": "Va Review Engine",
    "publicName": "va review engine",
    "privateName": "va_review_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "operator_command_engine",
    "label": "Operator Command Engine",
    "publicName": "operator command engine",
    "privateName": "operator_command_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "sales_access_engine",
    "label": "Sales Access Engine",
    "publicName": "sales access engine",
    "privateName": "sales_access_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "lawyer_private_client_engine",
    "label": "Lawyer Private Client Engine",
    "publicName": "lawyer private client engine",
    "privateName": "lawyer_private_client_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "seo_growth_engine",
    "label": "Seo Growth Engine",
    "publicName": "seo growth engine",
    "privateName": "seo_growth_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  },
  {
    "id": "validation_engine",
    "label": "Validation Engine",
    "publicName": "validation engine",
    "privateName": "validation_engine control spine",
    "purpose": "Controlled international document execution with Wise-first gates, event ledger, client-safe status, and operator oversight.",
    "publicSummary": "Secure International Document Execution & Authentication Infrastructure. Receiving-authority review applies before clients rely on routing snapshots.",
    "privateControlNotes": [
      "Patch existing system; do not rebuild",
      "Wise payment controls scheduling and final release",
      "Internal operator workflow remains private"
    ],
    "requiredInputs": [
      "matter reference",
      "destination country",
      "document type",
      "receiving authority if known"
    ],
    "requiredChecks": [
      "payment gate",
      "identifier lock",
      "receiving-authority boundary",
      "event ledger write"
    ],
    "unlockCondition": "operator-reviewed readiness",
    "clientVisibleStatus": "Controlled review in progress",
    "operatorEvents": [
      "INTAKE_CREATED",
      "QUOTE_GENERATED",
      "PAYMENT_INSTRUCTIONS_SENT",
      "SCHEDULING_UNLOCKED",
      "FINAL_PAYMENT_CONFIRMED"
    ],
    "failureModes": [
      "missing client input",
      "identifier mismatch",
      "payment mismatch",
      "receiving authority uncertainty"
    ],
    "resolutionProtocol": [
      "pause matter",
      "request correction",
      "record ledger event",
      "operator review"
    ]
  }
];
export function getMilanoOperatingSpine(id: string) { return MILANO_OPERATING_SPINES.find((spine) => spine.id === id); }
export function getPublicOperatingSpines() { return MILANO_OPERATING_SPINES.map(({ privateName, privateControlNotes, operatorEvents, ...spine }) => ({ ...spine, publicSummary: spine.publicSummary + " " + boundary })); }
export function getPrivateOperatingSpines() { return MILANO_OPERATING_SPINES; }
