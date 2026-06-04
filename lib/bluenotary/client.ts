// BlueNotary API Client — server-side only
// NEVER expose BLUENOTARY_API_KEY, signing URLs, or base64 content in logs.

import type {
  BNCreateSessionPayload,
  BNSession,
  BNDocumentPayload,
  BNReschedulePayload,
  BNSignedDocumentResult,
} from './types';

function getBNBaseUrl(): string {
  return (
    process.env.BLUENOTARY_BASE_URL ??
    'https://app.bluenotary.us/api/integrationsv2'
  );
}

function getBNHeaders(): HeadersInit {
  const key = process.env.BLUENOTARY_API_KEY;
  if (!key) throw new Error('BLUENOTARY_API_KEY is not set');
  // Never log this header or the key value
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${key}`,
  };
}

async function bnFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${getBNBaseUrl()}${path}`;
  const headers = getBNHeaders();

  const res = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    // Never include Authorization in error messages
    throw new Error(
      `BlueNotary API error ${res.status} on ${options.method ?? 'GET'} ${path}: ${body}`
    );
  }

  return res.json() as Promise<T>;
}

/** Create a new notarization session in BlueNotary */
export async function createBlueNotarySession(
  payload: BNCreateSessionPayload
): Promise<BNSession> {
  return bnFetch<BNSession>('/notarizations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** Retrieve a session by BlueNotary session id */
export async function getBlueNotarySession(
  bnSessionId: string
): Promise<BNSession> {
  return bnFetch<BNSession>(`/notarizations/${bnSessionId}`);
}

/** Upload documents to a session */
export async function addBlueNotaryDocuments(
  bnSessionId: string,
  documents: BNDocumentPayload[]
): Promise<{ success: boolean }> {
  // base64_content must NOT be logged at any point
  return bnFetch<{ success: boolean }>(
    `/notarizations/${bnSessionId}/documents`,
    {
      method: 'POST',
      body: JSON.stringify({ documents }),
    }
  );
}

/** Reschedule a session */
export async function rescheduleBlueNotarySession(
  bnSessionId: string,
  sessionTiming: string
): Promise<BNSession> {
  const payload: BNReschedulePayload = { session_timing: sessionTiming };
  return bnFetch<BNSession>(`/notarizations/${bnSessionId}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

/** Mark a session as expired */
export async function expireBlueNotarySession(
  bnSessionId: string
): Promise<{ success: boolean }> {
  return bnFetch<{ success: boolean }>(
    `/notarizations/${bnSessionId}/expire`,
    { method: 'POST' }
  );
}

/** Retrieve signed documents — base64 content must be decoded server-side and never returned to client */
export async function getBlueNotarySignedDocuments(
  bnSessionId: string
): Promise<BNSignedDocumentResult[]> {
  return bnFetch<BNSignedDocumentResult[]>(
    `/notarizations/${bnSessionId}/signed_documents`
  );
}
