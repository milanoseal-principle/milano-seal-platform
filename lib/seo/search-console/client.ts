import { createSign } from "node:crypto";

interface ServiceAccountCredentials {
  client_email: string;
  private_key: string;
  token_uri?: string;
}

export interface SearchConsoleApiRow {
  keys?: string[];
  clicks?: number;
  impressions?: number;
  ctr?: number;
  position?: number;
}

export interface SearchConsoleQueryResult {
  rows: SearchConsoleApiRow[];
  siteUrl: string;
}

export function getSearchConsoleConfiguration() {
  const credentialJson = process.env.GOOGLE_SEARCH_CONSOLE_SERVICE_ACCOUNT_JSON?.trim();
  const siteUrl = process.env.GOOGLE_SEARCH_CONSOLE_SITE_URL?.trim();
  return { configured: Boolean(credentialJson && siteUrl), credentialJson, siteUrl };
}

function base64Url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function parseCredentials(raw: string): ServiceAccountCredentials {
  const parsed = JSON.parse(raw) as Partial<ServiceAccountCredentials>;
  if (!parsed.client_email || !parsed.private_key) throw new Error("SEARCH_CONSOLE_CREDENTIALS_INVALID");
  return { client_email: parsed.client_email, private_key: parsed.private_key, token_uri: parsed.token_uri };
}

async function accessToken(credentials: ServiceAccountCredentials) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64Url(JSON.stringify({ iss: credentials.client_email, scope: "https://www.googleapis.com/auth/webmasters.readonly", aud: credentials.token_uri ?? "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }));
  const signer = createSign("RSA-SHA256");
  signer.update(`${header}.${claims}`);
  const assertion = `${header}.${claims}.${base64Url(signer.sign(credentials.private_key))}`;
  const response = await fetch(credentials.token_uri ?? "https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }), cache: "no-store" });
  if (!response.ok) throw new Error("SEARCH_CONSOLE_AUTH_FAILED");
  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("SEARCH_CONSOLE_AUTH_FAILED");
  return data.access_token;
}

export async function querySearchConsole(startDate: string, endDate: string): Promise<SearchConsoleQueryResult> {
  const config = getSearchConsoleConfiguration();
  if (!config.configured || !config.credentialJson || !config.siteUrl) throw new Error("SEARCH_CONSOLE_UNCONFIGURED");
  const credentials = parseCredentials(config.credentialJson);
  const token = await accessToken(credentials);
  const response = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.siteUrl)}/searchAnalytics/query`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({ startDate, endDate, dimensions: ["date", "query", "page", "country"], rowLimit: 25_000, dataState: "final" }),
    cache: "no-store",
  });
  if (response.status === 403) throw new Error("SEARCH_CONSOLE_SITE_NOT_AUTHORIZED");
  if (!response.ok) throw new Error("SEARCH_CONSOLE_QUERY_FAILED");
  const data = await response.json() as { rows?: SearchConsoleApiRow[] };
  return { rows: data.rows ?? [], siteUrl: config.siteUrl };
}
