import { NextRequest, NextResponse } from 'next/server';
import { AUTH_TOKEN_KEY, getJwtExpiryMs } from '@/lib/auth-session';

const PUBLIC_ROUTES = new Set(['/login', '/signup', '/create-account']);

function hasValidToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const expiresAt = getJwtExpiryMs(token);
  return typeof expiresAt === 'number' && expiresAt > Date.now();
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_TOKEN_KEY)?.value;
  const isAuthenticated = hasValidToken(token);
  const isPublicRoute = PUBLIC_ROUTES.has(pathname);
  const isRoot = pathname === '/';

  if (isAuthenticated && (isPublicRoute || isRoot)) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  if (!isAuthenticated && !isPublicRoute && !isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    const response = NextResponse.redirect(url);
    response.cookies.delete(AUTH_TOKEN_KEY);
    return response;
  }

  if (!isAuthenticated && isRoot) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|txt|css|js)).*)'],
};


