export const AUTH_SESSION_DAYS = 7;
export const AUTH_SESSION_MS = AUTH_SESSION_DAYS * 24 * 60 * 60 * 1000;

export const AUTH_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'akou_access_token';
export const AUTH_TENANT_ID_KEY = process.env.NEXT_PUBLIC_TENANT_ID_KEY || 'akou_tenant_id';
export const AUTH_TENANT_SLUG_KEY = process.env.NEXT_PUBLIC_TENANT_SLUG_KEY || 'akou_tenant_slug';
export const AUTH_USER_EMAIL_KEY = process.env.NEXT_PUBLIC_USER_EMAIL_KEY || 'akou_user_email';
export const AUTH_META_KEY = process.env.NEXT_PUBLIC_AUTH_META_KEY || 'akou_auth_meta';

export interface AuthSessionMeta {
  expiresAt: number;
  issuedAt: number;
}

function base64UrlDecode(input: string): string | null {
  try {
    const normalized = input.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    if (typeof atob !== 'undefined') return atob(padded);
    if (typeof Buffer !== 'undefined') return Buffer.from(padded, 'base64').toString('utf8');
    return null;
  } catch {
    return null;
  }
}

export function getJwtExpiryMs(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const decoded = base64UrlDecode(parts[1]);
    if (!decoded) return null;
    const payload = JSON.parse(decoded) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

export function getSessionExpiryMs(token: string, now = Date.now()): number {
  const jwtExpiry = getJwtExpiryMs(token);
  const sessionExpiry = now + AUTH_SESSION_MS;
  return jwtExpiry ? Math.min(jwtExpiry, sessionExpiry) : sessionExpiry;
}

export function isSessionExpired(expiresAt: number | null | undefined, now = Date.now()): boolean {
  return !expiresAt || now >= expiresAt;
}

export function readCookieValue(source: string | null | undefined, name: string): string | null {
  if (!source) return null;
  const cookie = source
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  if (!cookie) return null;
  return decodeURIComponent(cookie.slice(name.length + 1));
}

export function readBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  return readCookieValue(document.cookie, name);
}

export function buildCookieString(name: string, value: string, expiresAtMs: number, secure = false): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=/`,
    `SameSite=Lax`,
    `Expires=${new Date(expiresAtMs).toUTCString()}`,
    `Max-Age=${Math.max(1, Math.floor((expiresAtMs - Date.now()) / 1000))}`,
  ];

  if (secure) parts.push('Secure');
  return parts.join('; ');
}

export function removeCookieString(name: string): string {
  return `${name}=; Path=/; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT`;
}

