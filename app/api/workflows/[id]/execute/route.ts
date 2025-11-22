import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowById } from '@/lib/services/workflows';
import { workflowEngine } from '@/lib/services/workflow-engine';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * POST /api/workflows/[id]/execute
 * Test execute a workflow with sample data
 */
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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

    // Parse request body for test data
    const body = await request.json();
    const { triggerData } = body;

    if (!triggerData) {
      return NextResponse.json({ error: 'triggerData is required' }, { status: 400 });
    }

    // Execute workflow
    const execution = await workflowEngine.execute(workflow, triggerData);

    // Get updated execution record
    const { data: executionRecord } = await supabaseClient
      .from('workflow_executions')
      .select('*')
      .eq('id', execution.id)
      .single();

    return NextResponse.json({
      success: true,
      execution: executionRecord || execution,
      message: 'Workflow executed successfully',
    });
  } catch (error) {
    logger.error('POST /api/workflows/[id]/execute failed', error instanceof Error ? error : new Error(String(error)), {
      workflowId: params.id,
    });

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to execute workflow',
      },
      { status: 500 }
    );
  }
}
