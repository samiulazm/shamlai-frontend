import { NextResponse, type NextRequest } from 'next/server';
import { getShopIdBySubdomain, normalizeSubdomain } from './lib/services/shop';

// Reserved hosts and paths that should bypass subdomain routing
const RESERVED_HOSTS = new Set(['www', 'app', 'api', 'static', 'assets', 'localhost']);
const RESERVED_PATH_PREFIXES = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/dashboard',
  '/login',
  '/signup',
  '/auth',
];

function isReservedPath(pathname: string): boolean {
  return RESERVED_PATH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function extractSubdomain(hostname: string, rootDomain: string): string | null {
  if (!hostname || !rootDomain) return null;
  if (hostname === rootDomain || hostname === `www.${rootDomain}`) return null;
  if (!hostname.endsWith(`.${rootDomain}`)) return null;
  const sub = hostname.slice(0, -(rootDomain.length + 1)); // remove ".rootDomain"
  if (!sub || RESERVED_HOSTS.has(sub)) return null;
  return normalizeSubdomain(sub);
}

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, hostname } = nextUrl;

  // Bypass internal and reserved paths
  if (isReservedPath(pathname)) {
    return NextResponse.next();
  }

  // Configure your root domain via env. Example: "yourdomain.com"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
  const sub = extractSubdomain(hostname, rootDomain);
  if (!sub) {
    return NextResponse.next();
  }

  // Avoid loops if already rewritten to /<shopId>
  const alreadyShopRouted = /^\/[0-9a-fA-F-]{36}(?:\/|$)/.test(pathname);
  if (alreadyShopRouted) {
    return NextResponse.next();
  }

  const shopId = await getShopIdBySubdomain(sub);
  if (!shopId) {
    // Optional: return 404 response or fallthrough
    return NextResponse.next();
  }

  // Rewrite to the storefront route structure: /(storefront)/[shop]/*
  const rewritePath = pathname === '/' ? `/${shopId}` : `/${shopId}${pathname}`;
  const url = nextUrl.clone();
  url.pathname = rewritePath;
  return NextResponse.rewrite(url);
}

export const config = {
  // Apply to all paths except static files (Next.js also optimizes by default)
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|api).*)'],
};

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
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const authToken = request.cookies.get('sb-access-token');
  const refreshToken = request.cookies.get('sb-refresh-token');

  // Redirect to login if trying to access protected route without auth
  if (protectedRoutes.some((route) => pathname.startsWith(route)) && !authToken) {
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
