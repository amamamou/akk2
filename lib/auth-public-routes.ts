/** Routes that must stay reachable without an app session (invite / recovery). */
export const AUTH_PUBLIC_PATHS = new Set([
  '/login',
  '/signup',
  '/create-account',
  '/reset-password',
  '/set-password',
]);

export function isAuthPublicPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return AUTH_PUBLIC_PATHS.has(pathname);
}

/**
 * If the URL carries a GoTrue invite/recovery token, return the password-setup path.
 * Works for hash (#access_token) and query (?token_hash, ?code) fragments.
 */
export function passwordSetupPathFromUrl(
  search: string,
  hash: string,
  pathname: string
): string | null {
  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  const query = new URLSearchParams(search);
  const type = (hashParams.get('type') || query.get('type') || '').toLowerCase();

  const hasToken = Boolean(
    hashParams.get('access_token') ||
      query.get('access_token') ||
      hashParams.get('token_hash') ||
      query.get('token_hash') ||
      query.get('code')
  );

  if (!hasToken) return null;

  if (pathname === '/set-password' || pathname === '/reset-password') {
    return null;
  }

  if (type === 'invite') return '/set-password';
  if (type === 'recovery' || type === 'signup' || type === 'email' || type === 'magiclink') {
    return '/reset-password';
  }
  // Unknown type but we have a token — default to reset unless already on set-password route.
  return '/reset-password';
}
