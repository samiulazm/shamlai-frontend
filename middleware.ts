import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const publicRoutes = [
  '/',
  '/features',
  '/pricing',
  '/login',
  '/signup',
  '/demo',
  '/reset-password',
  '/verify-email',
];

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Storefront routes pattern
const storefrontPattern = /^\/[a-zA-Z0-9_-]+(?:\/(?:product|cart|checkout|order)(?:\/[^\/]+)?)?$/;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a storefront route (public)
  if (storefrontPattern.test(pathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const authToken = request.cookies.get('sb-access-token');
  const refreshToken = request.cookies.get('sb-refresh-token');

  // Redirect to login if trying to access protected route without auth
  if (protectedRoutes.some(route => pathname.startsWith(route)) && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth pages while logged in
  if ((pathname.startsWith('/login') || pathname.startsWith('/signup')) && authToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
