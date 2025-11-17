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

export async function middleware(request: NextRequest) {
  const { nextUrl } = request;
  const { pathname, hostname } = nextUrl;

  // --- Subdomain routing for storefronts ---
  if (!isReservedPath(pathname)) {
    // Configure your root domain via env. Example: "yourdomain.com"
    const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';
    const sub = extractSubdomain(hostname, rootDomain);

    if (sub) {
      // Avoid loops if already rewritten to /<shopId>
      // Shop IDs are now 8-10 digit numbers
      const alreadyShopRouted = /^\/\d{8,10}(?:\/|$)/.test(pathname);
      if (!alreadyShopRouted) {
        const shopId = await getShopIdBySubdomain(sub);
        if (shopId) {
          const rewritePath = pathname === '/' ? `/${shopId}` : `/${shopId}${pathname}`;
          const url = nextUrl.clone();
          url.pathname = rewritePath;
          return NextResponse.rewrite(url);
        } else if (rootDomain) {
          // If a subdomain is present but no matching shop exists in the database,
          // redirect the visitor back to the main marketing site on the root domain.
          const url = new URL(`https://${rootDomain}${pathname}`);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  const { pathname: finalPathname } = request.nextUrl;

  // --- Public storefront and auth routing ---

  // Check if it's a storefront route (public)
  if (storefrontPattern.test(finalPathname)) {
    return NextResponse.next();
  }

  // Allow public routes
  if (publicRoutes.some((route) => finalPathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check for auth token in cookies
  const authToken = request.cookies.get('sb-access-token');

  // Redirect to login if trying to access protected route without auth
  if (protectedRoutes.some((route) => finalPathname.startsWith(route)) && !authToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', finalPathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth pages while logged in
  if ((finalPathname.startsWith('/login') || finalPathname.startsWith('/signup')) && authToken) {
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
     * - robots.txt / sitemap.xml
     * - public folder and other static assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*|public).*)',
  ],
};
