/**
 * Google service-account auth for Cloudflare Workers.
 *
 * Reads the service-account JSON from `process.env.GOOGLE_SERVICE_ACCOUNT_JSON`
 * (set via `wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON`). Mints a signed
 * RS256 JWT with WebCrypto, exchanges it for an OAuth access token, and caches
 * the token in module scope until ~1 min before expiry.
 *
 * Scopes requested:
 *   - analytics.readonly   (GA4 Data API + Analytics Admin API)
 *   - webmasters.readonly  (Search Console API)
 */

type ServiceAccountCredentials = {
  client_email: string;
  private_key: string;
  project_id?: string;
};

let cachedCreds: ServiceAccountCredentials | null = null;
let cachedToken: { token: string; expiresAt: number } | null = null;

function getServiceAccountCredentials(): ServiceAccountCredentials {
  if (cachedCreds) return cachedCreds;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (!raw) {
    throw new Error(
      "GOOGLE_SERVICE_ACCOUNT_JSON is not set. Run: wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON",
    );
  }
  const parsed = JSON.parse(raw) as ServiceAccountCredentials;
  if (!parsed.client_email || !parsed.private_key) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON missing client_email or private_key.");
  }
  cachedCreds = parsed;
  return parsed;
}

/** base64url encode a string or ArrayBuffer (Workers-safe, uses btoa). */
function base64url(input: string | ArrayBuffer | Uint8Array): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : input instanceof Uint8Array
        ? input
        : new Uint8Array(input);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Convert a PEM private key string to a DER ArrayBuffer for WebCrypto. */
function pemToDer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/-----BEGIN RSA PRIVATE KEY-----/, "")
    .replace(/-----END RSA PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binary = atob(b64);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buffer;
}

async function createSignedJwt(
  payload: Record<string, unknown>,
  privateKeyPem: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToDer(privateKeyPem),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const header = { alg: "RS256", typ: "JWT" };
  const headerB64 = base64url(JSON.stringify(header));
  const payloadB64 = base64url(JSON.stringify(payload));
  const input = `${headerB64}.${payloadB64}`;
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(input),
  );
  return `${input}.${base64url(signature)}`;
}

const SCOPES = [
  "https://www.googleapis.com/auth/analytics.readonly",
  "https://www.googleapis.com/auth/webmasters.readonly",
].join(" ");

/**
 * Returns a valid Google OAuth access token, minting a new one if needed.
 * Cached in module scope — Workers isolates reuse this across requests.
 */
export async function getGoogleAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const creds = getServiceAccountCredentials();
  const now = Math.floor(Date.now() / 1000);
  const jwt = await createSignedJwt(
    {
      iss: creds.client_email,
      scope: SCOPES,
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    },
    creds.private_key,
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Google OAuth token exchange failed (${res.status}): ${text}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  return data.access_token;
}

/** Service-account email (non-sensitive) — for display in the admin UI. */
export function getGoogleServiceAccountEmail(): string | null {
  try {
    return getServiceAccountCredentials().client_email;
  } catch {
    return null;
  }
}

/** Whether the secret is configured (for UI status badges). */
export function isGoogleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim());
}
