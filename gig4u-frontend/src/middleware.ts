import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/login', '/signup', '/'];

interface StoredAuth {
  state: {
    accessToken: string | null;
    user: {
      userType: string;
    } | null;
  };
}

interface JwtClaims {
  sub: string;
  userType: string;
  roles: string[];
  permissions: string[];
}

function parseJwtPayload(token: string): JwtClaims | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    return payload as JwtClaims;
  } catch {
    return null;
  }
}

function getAuthFromCookie(request: NextRequest): {
  token: string | null;
  userType: string | null;
  claims: JwtClaims | null;
} {
  const cookie = request.cookies.get('gig4u-auth');
  if (!cookie?.value) {
    return { token: null, userType: null, claims: null };
  }

  try {
    const parsed: StoredAuth = JSON.parse(cookie.value);
    const token = parsed.state?.accessToken ?? null;
    const userType = parsed.state?.user?.userType ?? null;
    const claims = token ? parseJwtPayload(token) : null;
    return { token, userType, claims };
  } catch {
    return { token: null, userType: null, claims: null };
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { token, userType, claims } = getAuthFromCookie(request);
  const isAuthenticated = !!token && !!userType;

  // Authenticated users visiting auth pages → redirect to dashboard
  if (isAuthenticated && PUBLIC_PATHS.includes(pathname)) {
    const dashboardMap: Record<string, string> = {
      CLIENT: '/client',
      SP: '/sp',
      ADMIN: '/admin/super',
    };
    const dest = dashboardMap[userType!] || '/';
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // Public paths don't need protection
  if (PUBLIC_PATHS.includes(pathname) || pathname.startsWith('/_next') || pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  // Unauthenticated users → redirect to login
  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('returnUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Route-level type guards
  if (pathname.startsWith('/client') && userType !== 'CLIENT') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/sp') && userType !== 'SP') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (pathname.startsWith('/admin') && userType !== 'ADMIN') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Super admin panel requires roles:write permission
  if (pathname.startsWith('/admin/super')) {
    const hasPermission = claims?.permissions?.includes('roles:write');
    const isSuperAdmin = claims?.roles?.includes('SUPER_ADMIN');
    if (!hasPermission && !isSuperAdmin) {
      return NextResponse.redirect(new URL('/admin/kyc', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|fonts|images).*)',
  ],
};
