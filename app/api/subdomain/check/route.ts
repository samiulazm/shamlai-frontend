import { NextResponse } from 'next/server';
import { normalizeSubdomain, isSubdomainAvailable } from '@/lib/services/shop';
import { logger } from '@/lib/utils/logger';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const subdomain = searchParams.get('subdomain');

    if (!subdomain) {
      return NextResponse.json({ error: 'Subdomain parameter is required' }, { status: 400 });
    }

    const normalized = normalizeSubdomain(subdomain);

    if (!normalized) {
      return NextResponse.json(
        { available: false, normalized: '', error: 'Invalid subdomain format' },
        { status: 200 }
      );
    }

    // Use the shop service function which has proper error handling
    // for cases where RLS policies or service role key are not configured
    const available = await isSubdomainAvailable(normalized);

    return NextResponse.json({
      available,
      normalized,
    });
  } catch (error) {
    logger.error(
      'Subdomain check error',
      error instanceof Error ? error : new Error(String(error))
    );
    // Return available=true on error to not block signup
    // (same behavior as isSubdomainAvailable function)
    const { searchParams } = new URL(request.url);
    const subdomainParam = searchParams.get('subdomain') || '';
    return NextResponse.json({
      available: true,
      normalized: normalizeSubdomain(subdomainParam),
    });
  }
}
