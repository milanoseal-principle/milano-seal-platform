# The Milano Seal™ — PDF Locking & Version Control

**Classification:** Internal SOP  
**Module:** Document Integrity  
**Status:** Active

---

## Purpose

Define the protocol for locking, versioning, and delivering PDFs so that every document leaving the Milano Seal system is traceable, tamper-evident, and professionally presented.

---

## Version Naming Convention

```
MS-[MATTER_ID]-[DOCUMENT_TYPE]-v[VERSION]-[DATE].pdf

Examples:
MS-2026-0001-APOSTILLE-v1-2026-06-11.pdf
MS-2026-0001-POA-EXECUTED-v1-2026-06-11.pdf
MS-2026-0001-RON-CERTIFICATE-v1-2026-06-11.pdf
```

**Rules:**
- Version starts at `v1`. Re-executions increment: `v2`, `v3`
- Date format: `YYYY-MM-DD`
- No spaces in filename
- Document type is uppercase snake-case

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
| Minor correction pre-delivery | Overwrite v1, log correction reason |
| Re-execution required | Create v2, retain v1 in vault (archived) |
| Client requests a copy post-delivery | Generate new signed URL — do not re-upload |
| Document recalled / voided | Mark `vault_status = "voided"`, log `DOCUMENT_VOIDED`, notify client |

---

## Digital Delivery Checklist

- [ ] File named per convention
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
