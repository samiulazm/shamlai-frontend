import { NextResponse } from 'next/server';
import { getInsforgeServerClient } from '@/lib/insforge';
import { normalizeSubdomain } from '@/lib/services/shop';

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

    // Use server client with service role to check subdomain availability
    // This bypasses RLS policies and allows checking without authentication
    const serverClient = getInsforgeServerClient();
    const { data, error } = await serverClient.database
      .from('shop_settings')
      .select('id')
      .eq('subdomain', normalized)
      .limit(1);

    if (error) {
      console.error('Error checking subdomain:', error);
      return NextResponse.json(
        { error: 'Failed to check subdomain availability' },
        { status: 500 }
      );
    }

    const available = !data || data.length === 0;

    return NextResponse.json({
      available,
      normalized,
    });
  } catch (error) {
    console.error('Subdomain check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
