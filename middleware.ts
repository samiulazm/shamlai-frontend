import { NextResponse, type NextRequest } from 'next/server';
import { normalizeSubdomain } from './lib/utils/subdomain';
import { createClient } from './utils/supabase/middleware';
import { getSupabaseAnonKey, getSupabaseUrl } from './utils/supabase/env';

const restHeaders = (): HeadersInit | null => {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  };
};

/** PostgREST fetch — avoids @supabase/supabase-js in Edge (realtime uses Node-only APIs). */
async function getShopIdBySubdomain(subdomain: string): Promise<string | null> {
  const headers = restHeaders();
  if (!headers) return null;
  try {
    const base = getSupabaseUrl();
    const q = `subdomain=eq.${encodeURIComponent(subdomain)}&select=user_id&limit=1`;
    const res = await fetch(`${base}/rest/v1/shop_settings?${q}`, { headers });
    if (!res.ok) {
      console.log('[Middleware] Subdomain lookup error:', res.status);
      return null;
    }
    const rows = (await res.json()) as { user_id?: string }[];
    const userId = rows[0]?.user_id;
    console.log('[Middleware] Found user_id for subdomain:', subdomain, '=>', userId);
    return userId || null;
  } catch (e) {
    console.error('[Middleware] getShopIdBySubdomain exception:', e);
    return null;
  }
}

async function getSubdomainByShopId(id: string): Promise<string | null> {
  const headers = restHeaders();
  if (!headers) return null;
  try {
    const base = getSupabaseUrl();
    for (const col of ['shop_id', 'user_id'] as const) {
      const q = `${col}=eq.${encodeURIComponent(id)}&select=subdomain&limit=1`;
      const res = await fetch(`${base}/rest/v1/shop_settings?${q}`, { headers });
      if (!res.ok) continue;
      const rows = (await res.json()) as { subdomain?: string }[];
      if (rows[0]?.subdomain) return rows[0].subdomain;
    }
    return null;
  } catch {
    return null;
  }
}

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
  const { pathname } = nextUrl;

  // Get the actual hostname from headers (Heroku uses proxy, nextUrl.hostname is '0.0.0.0')
  const hostname =
    request.headers.get('x-forwarded-host') || request.headers.get('host') || nextUrl.hostname;

  // Configure your root domain via env. Example: "yourdomain.com"
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || '';

  // Debug: Log every request
  console.log('[Middleware] Request:', { hostname, pathname, rootDomain });

  // --- Subdomain routing for storefronts ---
  if (!isReservedPath(pathname)) {
    if (!rootDomain) {
      console.warn('[Middleware] NEXT_PUBLIC_ROOT_DOMAIN is not set!');
    }
    const sub = extractSubdomain(hostname, rootDomain);
    console.log('[Middleware] Extracted subdomain:', sub);

    if (sub) {
      // Avoid loops if already rewritten to /<userId>
      // User IDs are UUIDs (36 chars with hyphens) or 8-10 digit numbers
      const uuidPattern =
        /^\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}(?:\/|$)/i;
      const numericPattern = /^\/\d{8,10}(?:\/|$)/;
      const alreadyShopRouted = uuidPattern.test(pathname) || numericPattern.test(pathname);

      if (!alreadyShopRouted) {
        const userId = await getShopIdBySubdomain(sub);
        console.log('[Middleware] Subdomain lookup:', { subdomain: sub, userId });

        if (userId) {
          const rewritePath = pathname === '/' ? `/${userId}` : `/${userId}${pathname}`;
          const url = nextUrl.clone();
          url.pathname = rewritePath;
          console.log('[Middleware] Rewriting to:', rewritePath);
          return NextResponse.rewrite(url);
        } else if (rootDomain) {
          // If a subdomain is present but no matching shop exists in the database,
          // redirect the visitor back to the main marketing site on the root domain.
          console.log('[Middleware] No shop found for subdomain, redirecting to root');
          const url = new URL(`https://${rootDomain}${pathname}`);
          return NextResponse.redirect(url);
        }
      }
    }
  }

  // --- Redirect shop ID paths to subdomain URLs ---
  // Pattern: /uuid or /uuid/... or /8-10 digit shop ID
  const shopIdPathMatch = pathname.match(
    /^\/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}|\d{8,10})(\/.*)?$/i
  );
  if (shopIdPathMatch && rootDomain) {
    const shopId = shopIdPathMatch[1];
    const restPath = shopIdPathMatch[2] || '';
    const subdomain = await getSubdomainByShopId(shopId);
    if (subdomain) {
      const redirectUrl = `https://${subdomain}.${rootDomain}${restPath}`;
      return NextResponse.redirect(redirectUrl);
    }
  }

  const { pathname: finalPathname } = request.nextUrl;

  // --- Supabase Auth Session Refresh ---
  // Create Supabase client for middleware to refresh user session
  const { supabase, response } = createClient(request);

  // Refresh session if expired - required for Server Components
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // --- Public storefront and auth routing ---

  // Check if it's a storefront route (public)
  if (storefrontPattern.test(finalPathname)) {
    return response;
  }

  // Allow public routes
  if (publicRoutes.some((route) => finalPathname.startsWith(route))) {
    return response;
  }

  // Redirect to login if trying to access protected route without auth
  if (protectedRoutes.some((route) => finalPathname.startsWith(route)) && !user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', finalPathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect to dashboard if trying to access auth pages while logged in
  if ((finalPathname.startsWith('/login') || finalPathname.startsWith('/signup')) && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return response;
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
