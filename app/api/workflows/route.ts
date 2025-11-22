import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows, createWorkflow } from '@/lib/services/workflows';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/workflows
 * Get all workflows for the authenticated user's shop
 */
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workflows
    const workflows = await getWorkflows(user.id);

    return NextResponse.json({ workflows, count: workflows.length });
  } catch (error) {
    logger.error('GET /api/workflows failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 */
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();

    // Create workflow
    const workflow = await createWorkflow({
      ...body,
      shop_id: user.id,
      created_by: user.id,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/workflows failed', error instanceof Error ? error : new Error(String(error)));

    // Check if it's a validation error
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}
