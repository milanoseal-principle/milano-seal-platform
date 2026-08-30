import { createSign } from 'node:crypto';

export interface SearchConsoleRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

type ServiceAccount = { client_email: string; private_key: string; token_uri?: string };

function encode(value: unknown) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function credentials(): ServiceAccount | null {
  const raw = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ServiceAccount;
    return parsed.client_email && parsed.private_key ? parsed : null;
  } catch { return null; }
}

export function searchConsoleConfigured() {
  return Boolean(credentials() && process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL);
}

async function accessToken(account: ServiceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const tokenUri = account.token_uri || 'https://oauth2.googleapis.com/token';
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({
    iss: account.client_email,
    scope: 'https://www.googleapis.com/auth/webmasters.readonly',
    aud: tokenUri,
    iat: now,
    exp: now + 3600,
  })}`;
  const signer = createSign('RSA-SHA256');
  signer.update(unsigned);
  signer.end();
  const assertion = `${unsigned}.${signer.sign(account.private_key, 'base64url')}`;
  const response = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`SEARCH_CONSOLE_AUTH_${response.status}`);
  const json = await response.json() as { access_token?: string };
  if (!json.access_token) throw new Error('SEARCH_CONSOLE_AUTH_NO_TOKEN');
  return json.access_token;
}

export async function querySearchConsole(startDate: string, endDate: string): Promise<SearchConsoleRow[]> {
  const account = credentials();
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL;
  if (!account || !siteUrl) throw new Error('SEARCH_CONSOLE_UNCONFIGURED');
  const token = await accessToken(account);
  const endpoint = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ startDate, endDate, dimensions: ['date','query','page','country'], rowLimit: 25000, dataState: 'final' }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`SEARCH_CONSOLE_QUERY_${response.status}`);
  const json = await response.json() as { rows?: SearchConsoleRow[] };
  return json.rows ?? [];
}
