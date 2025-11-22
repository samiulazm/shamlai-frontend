import { NextRequest, NextResponse } from 'next/server';
import { getWorkflowTemplates, createWorkflowFromTemplate } from '@/lib/services/workflows';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/workflow-templates
 * Get all workflow templates
 */
export async function GET(request: NextRequest) {
  try {
    // Get category filter from query params
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;

    // Get templates
    const templates = await getWorkflowTemplates(category);

    return NextResponse.json({ templates, count: templates.length });
  } catch (error) {
    logger.error('GET /api/workflow-templates failed', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: 'Failed to fetch workflow templates' }, { status: 500 });
  }
}

/**
 * POST /api/workflow-templates
 * Create a workflow from a template
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
    const { templateId, customName } = body;

    if (!templateId) {
      return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
    }

    // Create workflow from template
    const workflow = await createWorkflowFromTemplate(templateId, user.id, customName);

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    logger.error('POST /api/workflow-templates failed', error instanceof Error ? error : new Error(String(error)));

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Failed to create workflow from template' }, { status: 500 });
  }
}
