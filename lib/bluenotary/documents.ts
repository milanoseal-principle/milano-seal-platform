import type { BNDocumentPayload } from './types';

/**
 * Build a document payload for upload to BlueNotary.
 *
 * IMPORTANT: base64Content must NEVER be persisted after upload.
 * Callers must ensure the base64 string is wiped from memory/logs immediately
 * after this payload is submitted to the BlueNotary API.
 */
export function buildDocumentPayload(
  documentName: string,
  base64Content: string,
  templateId?: string,
  smartTags?: string[]
): BNDocumentPayload {
  const payload: BNDocumentPayload = {
    document_name: documentName,
    base64_content: base64Content, // NEVER log — wipe after upload
    ...(templateId ? { template_id: templateId } : {}),
    ...(smartTags && smartTags.length > 0 ? { smart_tags: smartTags } : {}),
  };

  return payload;
}

/**
 * Sanitize a document name for BlueNotary compatibility.
 * Strips special characters, normalizes whitespace.
 */
export function sanitizeDocumentName(name: string): string {
  return name
    .replace(/[^a-zA-Z0-9._\- ]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 200);
}

/**
 * Derive a BlueNotary document name from storage path or original filename.
 */
export function deriveBlueNotaryDocumentName(
  storagePath: string,
  documentType?: string | null
): string {
  const filename = storagePath.split('/').pop() ?? 'document.pdf';
  const extMatch = filename.match(/\.[^.]+$/);
  const ext = extMatch ? extMatch[0] : '.pdf';
  const baseName = filename.replace(/\.[^.]+$/, '');
  const prefix = documentType ? `${documentType.replace(/\s+/g, '_')}_` : '';
  return sanitizeDocumentName(`${prefix}${baseName}${ext}`);
}
