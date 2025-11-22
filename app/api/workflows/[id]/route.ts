import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById, updateWorkflow, deleteWorkflow, toggleWorkflow } from '@/lib/services/workflows';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/workflows/[id]
 * Get a single workflow by ID
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get workflow with shop_id check for security
    const workflow = await getWorkflowById(params.id, user.id);

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Verify ownership
    if (workflow.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    logger.error('GET /api/workflows/[id] failed', error instanceof Error ? error : new Error(String(error)), {
      workflowId: params.id,
    });

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to fetch workflow' }, { status: 500 });
  }
}

/**
 * PUT /api/workflows/[id]
 * Update a workflow
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Update workflow with shop_id check for security
    const workflow = await updateWorkflow(params.id, body, user.id);

    return NextResponse.json({ workflow });
  } catch (error) {
    logger.error('PUT /api/workflows/[id] failed', error instanceof Error ? error : new Error(String(error)), {
      workflowId: params.id,
    });

    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete a workflow
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete workflow with shop_id check for security
    await deleteWorkflow(params.id, user.id);

    return NextResponse.json({ success: true, message: 'Workflow deleted successfully' });
  } catch (error) {
    logger.error('DELETE /api/workflows/[id] failed', error instanceof Error ? error : new Error(String(error)), {
      workflowId: params.id,
    });

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}

/**
 * PATCH /api/workflows/[id]
 * Toggle workflow active status
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
    const { is_active } = body;

    if (typeof is_active !== 'boolean') {
      return NextResponse.json({ error: 'is_active must be a boolean' }, { status: 400 });
    }

    // Toggle workflow
    const workflow = await toggleWorkflow(params.id, is_active, user.id);

    return NextResponse.json({ workflow });
  } catch (error) {
    logger.error('PATCH /api/workflows/[id] failed', error instanceof Error ? error : new Error(String(error)), {
      workflowId: params.id,
    });

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to toggle workflow' }, { status: 500 });
  }
}
