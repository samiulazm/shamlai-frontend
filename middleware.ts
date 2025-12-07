import { NextResponse, type NextRequest } from 'next/server';
import { normalizeSubdomain } from './lib/services/shop';
import { createClient } from './utils/supabase/middleware';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Edge-compatible Supabase client (no browser session persistence)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const edgeSupabase = createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Edge-compatible subdomain lookup (returns user_id for storefront routing)
async function getShopIdBySubdomain(subdomain: string): Promise<string | null> {
  try {
    const { data, error } = await edgeSupabase
      .from('shop_settings')
      .select('user_id')
      .eq('subdomain', subdomain)
      .single();
    if (error) {
      console.log('[Middleware] Subdomain lookup error:', error.message);
      return null;
    }
    console.log('[Middleware] Found user_id for subdomain:', subdomain, '=>', data?.user_id);
    return data?.user_id || null;
  } catch (e) {
    console.error('[Middleware] getShopIdBySubdomain exception:', e);
    return null;
  }
}

// Edge-compatible shop_id/user_id to subdomain lookup
async function getSubdomainByShopId(id: string): Promise<string | null> {
  try {
    // Try by shop_id first
    const { data, error } = await edgeSupabase
      .from('shop_settings')
      .select('subdomain')
      .eq('shop_id', id)
      .single();
    if (!error && data?.subdomain) return data.subdomain;

    // Try by user_id
    const result = await edgeSupabase
      .from('shop_settings')
      .select('subdomain')
      .eq('user_id', id)
      .single();
    if (result.error) return null;
    return result.data?.subdomain || null;
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
