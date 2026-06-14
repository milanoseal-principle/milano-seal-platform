# The Milano Seal™ — PDF Locking & Version Control

**Classification:** Internal SOP  
**Module:** Document Integrity  
**Status:** Active

---

## Purpose

Define the protocol for locking, versioning, and delivering PDFs so that every document leaving the Milano Seal system is traceable, tamper-evident, and professionally presented.

---

## Client Delivery Naming Convention

```
MS-[INVOICE#]_[DOCUMENT_TYPE]_[STATUS]_[LASTNAME_OR_ENTITY]_[YYYYMMDD].pdf

Examples:
MS-2026-03-012_Affidavit_ProForma_Rossi_20260315.pdf
MS-2026-03-012_Affidavit_FinalInvoice_Rossi_20260318.pdf
MS-2026-03-012_Affidavit_PaidReleased_Rossi_20260320.pdf
```

**Rules:**
- Status must be `ProForma`, `FinalInvoice`, or `PaidReleased`
- Date format: `YYYYMMDD`
- No spaces in filename
- Use underscores between file-name segments
- Always include invoice number, document type, status, client/entity label, and date
- A sent file is immutable and must never be overwritten

---

## PDF Locking Protocol

### Step 1 — Final Review
Before locking:
- Verify all pages are present
- Confirm notarial certificate is on the correct page
- Confirm apostille is attached if required
- Confirm all signatures and notarial seals are legible

### Step 2 — Flatten & Lock
- Flatten all form fields (no editable fields in final)
- Apply PDF password restriction: **print allowed, editing prohibited**
- Password is not shared with client — document is read/print only

### Step 3 — Apply Header/Footer (if applicable)
- Footer: `The Milano Seal™ · Matter [DISPLAY_ID] · [DATE]`
- Footer font: 7pt, gray, non-intrusive
- Do NOT add Milano Seal branding to the notarized document body — only footer metadata

### Step 4 — Upload to Storage
- Upload to Supabase Storage: `documents/[matter_id]/[filename]`
- Storage path is **never** exposed to client portal
- Client receives a signed URL via portal vault — not the raw storage path
- Signed URL expires: 72 hours (re-generated on request)

### Step 5 — Log Event
- Log `DOCUMENT_VAULT_UPLOADED` in audit ledger
- Include: `filename`, `version`, `uploaded_by`, `matter_id`

---

## Version Control Rules

| Scenario | Action |
|---|---|
| Minor correction pre-delivery | Generate a new file and log the correction reason |
| Re-execution required | Generate a new dated file and retain the prior file in the vault |
| Client requests a copy post-delivery | Generate new signed URL — do not re-upload |
| Document recalled / voided | Mark `vault_status = "voided"`, log `DOCUMENT_VOIDED`, notify client |

---

## Digital Delivery Checklist

- [ ] File named with invoice, document type, status, client/entity, and compact date
- [ ] All pages present
- [ ] Form fields flattened
- [ ] Editing locked (print-only)
- [ ] Uploaded to Supabase Storage
- [ ] Signed URL generated
- [ ] `DOCUMENT_VAULT_UPLOADED` logged
- [ ] Client portal shows document in vault

---

## Security Notes

- `storage_path` and `file_path` are **never** exposed to the client portal
- Signed URLs are scoped to the authenticated client session
- Re-execution documents retain prior version in archived state
- Voided documents are flagged, not deleted (audit trail preserved)
