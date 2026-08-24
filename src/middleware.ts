import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/daftar',
  '/api/auth/login',
  '/api/auth/register-otp',
  '/api/auth/verify-otp',
  '/api/auth/logout',
  '/api/public',
];

// Platform paths
const PLATFORM_PATHS = ['/superadmin', '/api/platform-auth', '/api/superadmin'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isPlatformPath(pathname: string): boolean {
  return PLATFORM_PATHS.some((p) => pathname.startsWith(p));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static files and API routes that handle their own auth
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/manifest')
  ) {
    return NextResponse.next();
  }

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Check for session cookie
  const sessionCookie = request.cookies.get('mylandry-session');
  const platformSessionCookie = request.cookies.get('mylandry-platform-session');

  // Platform routes require platform session
  if (isPlatformPath(pathname)) {
    if (!platformSessionCookie) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json(
          { success: false, message: 'Silakan login sebagai superadmin.' },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Tenant routes require tenant session
  if (!sessionCookie) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'Silakan login terlebih dahulu.' },
        { status: 401 }
      );
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|icons/).*)',
  ],
};
