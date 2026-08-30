# THE MILANO SEAL™ — CLIENT DELIVERY EXPERIENCE STANDARD

Status: CANONICAL DELIVERY SOP

Purpose: preserve a controlled final-delivery experience without creating a second release, document-vault or notification engine.

## Governing sequence

1. Generate or select the approved final artifact.
2. Confirm the final artifact is release-eligible under the canonical Matter/release gates.
3. Apply governed file naming.
4. Preserve the master/version in the canonical document vault/archive.
5. Send only client-safe final artifacts through the canonical communication path.
6. Record delivery evidence in the canonical Matter/evidence history.
7. Follow up on receipt only through governed communications/follow-up logic.

Never send a draft as final. Never overwrite a previously released final artifact. Never infer receipt from sending.

## Governed file naming

Preferred final-delivery pattern:

`MS-[REFERENCE]_[DOCUMENT-TYPE]_[STATUS]_[CLIENT-OR-ENTITY]_[YYYYMMDD].pdf`

Rules:
- no spaces; use underscores
- retain a stable Milano/Matter or invoice reference
- include document type
- include release status
- include date as YYYYMMDD
- sanitize characters that are unsafe for filenames
- corrections create a new version; do not overwrite a released file

Examples are illustrative only; production references come from canonical Matter/invoice truth.

## Release statuses

Use only statuses that map to canonical document/release truth. Examples may include:
- ProForma
- FinalInvoice
- Executed
- Apostilled
- Released
- PaidReleased

Do not create a competing Matter state machine from filename labels.

## PDF protection

Final client PDF controls may restrict editing/page extraction where compatible with the receiving workflow. Protection must never make a legally/operationally required file unusable, block accessibility unnecessarily, or create false security claims.

Password protection is optional and must follow the current secure-delivery policy. Never embed predictable passwords in public documentation or email copy.

## Storage/version control

The canonical document vault/storage layer controls file truth.

Conceptual hierarchy may project:

Client → Matter → Document class/version

Do not create a separate Google Drive/desktop folder system as production truth if the Matter document vault already exists.

Every released revision retains:
- Matter reference
- document identity
- version/revision
- status
- created/released timestamp
- actor/source
- evidence link where supported

## Client-facing final delivery tone

Tone:
- calm
- precise
- premium
- concise
- non-legal-advice
- no guaranteed foreign acceptance

Approved subject pattern:

`Milano Seal — Matter Completed & Released`

Approved body pattern:

Dear [Client Name],

Your Milano Seal matter has reached its approved release stage.

The final client-safe documents associated with the Matter are available through the secure delivery channel. Where applicable, notarization and apostille/authentication coordination have been completed according to the recorded execution path.

Please retain the released documents with your records. International use and final acceptance remain subject to the destination and receiving authority.

Thank you for trusting The Milano Seal™ with the U.S. execution side of this matter.

With appreciation,
The Milano Seal™

Do not claim legal representation, legal advice, universal acceptance, or completion of a service that canonical Matter evidence does not support.

## Attachment / release rule

Send only the artifacts approved for client release.

Do not include by default:
- internal notes
- operator evidence
- raw provider/webhook payloads
- superseded drafts
- hidden pricing/margin data
- KBA/identity-verification secrets
- unrelated pro formas/invoices when a final released artifact is the intended delivery

## Delivery evidence

Track through canonical Matter/evidence/communication systems:
- Matter/reference
- client/recipient
- artifact/version
- delivery channel
- sent timestamp
- actor
- delivery/provider status where available
- receipt/confirmation only when actually observed
- follow-up required

Do not create a second spreadsheet delivery log as production truth.

## Receipt follow-up

If a delivery remains unconfirmed after the governed follow-up interval, create a follow-up action through the existing communications/follow-up system.

Suggested client-safe message:

`I’m following up to confirm that the final Milano Seal documents were accessible through the secure delivery sent for your Matter. Please let us know if you experienced any access issue.`

No automated message may claim receipt or acceptance without evidence.

## VA / execution coordinator boundaries

Authorized support personnel may perform actions permitted by current RBAC and SOP, such as:
- prepare approved artifacts
- apply governed naming/version metadata
- stage a client communication
- log delivery evidence
- execute approved delivery steps

They may not:
- alter canonical pricing authority
- change legal/document substance outside authorized workflow
- bypass QA/release gates
- mark payment verified without canonical authority
- mark a Matter complete without the required transition authority
- send unapproved final documents

## Relationship continuity

A completed Matter may create a client-safe relationship/follow-up opportunity, but no referral, review, recurring-service or marketing state may overwrite completion/release truth.

The delivery experience should end with one clear next action: retain records, confirm access if needed, or begin a new secure intake for a new Matter.
