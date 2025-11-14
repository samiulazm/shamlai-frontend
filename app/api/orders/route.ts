import { NextRequest, NextResponse } from 'next/server';
import { insforgeClient } from '@/lib/insforge';
import { getOrders } from '@/lib/services/orders';
import { logger } from '@/lib/utils/logger';

/**
 * Get orders with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    // Get current user
    const { data } = await insforgeClient.auth.getCurrentUser();

    if (!data?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = data.user;

    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const filters: any = {
      page,
      pageSize,
      search,
    };

    if (status) filters.status = status;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const result = await getOrders(user.id, filters);

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Get orders error', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to get orders' }, { status: 500 });
  }
}
