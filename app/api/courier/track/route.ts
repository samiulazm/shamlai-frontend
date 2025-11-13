import { NextRequest, NextResponse } from 'next/server';
import { trackShipment, CourierType } from '@/lib/services/courier';
import { logger } from '@/lib/utils/logger';

/**
 * Track courier shipment
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const trackingNumber = searchParams.get('trackingNumber');
    const courier = searchParams.get('courier');

    if (!trackingNumber || !courier) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const result = await trackShipment(courier as CourierType, trackingNumber);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to track shipment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      status: result.status,
      statusHistory: result.statusHistory,
    });
  } catch (error) {
    logger.error('Courier tracking API error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
