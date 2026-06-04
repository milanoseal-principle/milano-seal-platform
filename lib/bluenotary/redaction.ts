// BlueNotary payload redaction — removes sensitive fields before any logging

const REDACTED_KEYS = new Set([
  'authorization',
  'Authorization',
  'api_key',
  'apiKey',
  'token',
  'full_signing_url',
  'signing_url',
  'bn_signing_url',
  'base64Doc',
  'base64_content',
  'base64Content',
  'final_output_files',
  'password',
  'passphrase',
  // Signer credential fields
  'ssn',
  'date_of_birth',
  'dateOfBirth',
  'drivers_license',
  'driversLicense',
  'id_number',
]);

type PlainObject = Record<string, unknown>;

/**
 * Deep-clone an object and remove all sensitive fields before logging.
 * Handles nested objects and arrays. Does not mutate the original.
 */
export function redactBNPayload(obj: unknown): unknown {
  if (obj === null || obj === undefined) return obj;

  if (Array.isArray(obj)) {
    return obj.map(redactBNPayload);
  }

  if (typeof obj === 'object') {
    const result: PlainObject = {};
    for (const [key, value] of Object.entries(obj as PlainObject)) {
      if (REDACTED_KEYS.has(key)) {
        result[key] = '[REDACTED]';
      } else if (
        // Redact any key containing these substrings (case-insensitive)
        /secret|token|password|api.?key|authorization|base64|signing.?url/i.test(key)
      ) {
        result[key] = '[REDACTED]';
      } else {
        result[key] = redactBNPayload(value);
      }
    }
    return result;
  }

  // Strings that look like base64 (>500 chars, high base64 char density)
  if (typeof obj === 'string' && obj.length > 500 && /^[A-Za-z0-9+/=]+$/.test(obj.slice(0, 50))) {
    return '[BASE64_REDACTED]';
  }

  return obj;
}
