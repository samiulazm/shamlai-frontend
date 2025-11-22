import { supabaseClient } from '../supabase';
import { logger } from '../utils/logger';
import type {
  Workflow,
  WorkflowInsert,
  WorkflowUpdate,
  WorkflowTemplate,
  WorkflowTemplateInsert,
  TriggerEvent,
} from '../types/database';
import { WorkflowInsertSchema, WorkflowUpdateSchema } from '../schemas/workflow';

/**
 * Get all workflows for a shop
 */
export async function getWorkflows(shopId: string): Promise<Workflow[]> {
  try {
    const { data, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('shop_id', shopId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to fetch workflows', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflowById(id: string, shopId?: string): Promise<Workflow> {
  try {
    let query = supabaseClient.from('workflows').select('*').eq('id', id);

    // Optionally filter by shop_id for security
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) throw new Error('Workflow not found');

    return data;
  } catch (error) {
    logger.error('Failed to fetch workflow', error instanceof Error ? error : new Error(String(error)), { id });
    throw error;
  }
}

/**
 * Create a new workflow
 */
export async function createWorkflow(data: WorkflowInsert): Promise<Workflow> {
  try {
    // Validate input
    const validated = WorkflowInsertSchema.parse(data);

    const { data: workflow, error } = await supabaseClient
      .from('workflows')
      .insert(validated)
      .select()
      .single();

    if (error) throw error;
    if (!workflow) throw new Error('Failed to create workflow');

    logger.info('Workflow created', { workflowId: workflow.id, name: workflow.name });
    return workflow;
  } catch (error) {
    logger.error('Failed to create workflow', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(id: string, data: WorkflowUpdate, shopId?: string): Promise<Workflow> {
  try {
    // Validate input
    const validated = WorkflowUpdateSchema.parse(data);

    let query = supabaseClient
      .from('workflows')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Optionally filter by shop_id for security
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data: workflow, error } = await query.select().single();

    if (error) throw error;
    if (!workflow) throw new Error('Workflow not found or update failed');

    logger.info('Workflow updated', { workflowId: id, name: workflow.name });
    return workflow;
  } catch (error) {
    logger.error('Failed to update workflow', error instanceof Error ? error : new Error(String(error)), { id });
    throw error;
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string, shopId?: string): Promise<void> {
  try {
    let query = supabaseClient.from('workflows').delete().eq('id', id);

    // Optionally filter by shop_id for security
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { error } = await query;

    if (error) throw error;

    logger.info('Workflow deleted', { workflowId: id });
  } catch (error) {
    logger.error('Failed to delete workflow', error instanceof Error ? error : new Error(String(error)), { id });
    throw error;
  }
}

/**
 * Toggle workflow active status
 */
export async function toggleWorkflow(id: string, active: boolean, shopId?: string): Promise<Workflow> {
  try {
    let query = supabaseClient
      .from('workflows')
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Optionally filter by shop_id for security
    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data: workflow, error } = await query.select().single();

    if (error) throw error;
    if (!workflow) throw new Error('Workflow not found');

    logger.info('Workflow toggled', { workflowId: id, active, name: workflow.name });
    return workflow;
  } catch (error) {
    logger.error('Failed to toggle workflow', error instanceof Error ? error : new Error(String(error)), { id });
    throw error;
  }
}

/**
 * Get active workflows for a specific trigger event
 */
export async function getActiveWorkflowsByTrigger(
  shopId: string,
  triggerEvent: TriggerEvent
): Promise<Workflow[]> {
  try {
    const { data, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('shop_id', shopId)
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error(
      'Failed to fetch active workflows',
      error instanceof Error ? error : new Error(String(error)),
      { shopId, triggerEvent }
    );
    throw error;
  }
}

/**
 * Increment workflow execution count
 */
export async function incrementExecutionCount(workflowId: string): Promise<void> {
  try {
    const { error } = await supabaseClient.rpc('increment_workflow_execution', {
      workflow_id: workflowId,
    });

    if (error) {
      // Fallback if RPC doesn't exist - manual increment
      const workflow = await getWorkflowById(workflowId);
      await supabaseClient
        .from('workflows')
        .update({
          execution_count: workflow.execution_count + 1,
          last_executed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', workflowId);
    }
  } catch (error) {
    logger.error(
      'Failed to increment execution count',
      error instanceof Error ? error : new Error(String(error)),
      { workflowId }
    );
    // Don't throw - this is not critical
  }
}

// ============================================================================
// Workflow Templates
// ============================================================================

/**
 * Get all workflow templates
 */
export async function getWorkflowTemplates(category?: string): Promise<WorkflowTemplate[]> {
  try {
    let query = supabaseClient.from('workflow_templates').select('*').order('usage_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Failed to fetch workflow templates', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Get a single workflow template by ID
 */
export async function getWorkflowTemplateById(id: string): Promise<WorkflowTemplate> {
  try {
    const { data, error } = await supabaseClient
      .from('workflow_templates')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Template not found');

    return data;
  } catch (error) {
    logger.error('Failed to fetch workflow template', error instanceof Error ? error : new Error(String(error)), {
      id,
    });
    throw error;
  }
}

/**
 * Create workflow from template
 */
export async function createWorkflowFromTemplate(
  templateId: string,
  shopId: string,
  customName?: string
): Promise<Workflow> {
  try {
    // Get template
    const template = await getWorkflowTemplateById(templateId);

    // Create workflow from template
    const workflowData: WorkflowInsert = {
      shop_id: shopId,
      name: customName || `${template.template_name} (from template)`,
      description: template.description,
      trigger_event: template.trigger_event,
      trigger_conditions: template.trigger_conditions,
      actions: template.actions,
      is_active: false, // Start inactive so user can review
    };

    const workflow = await createWorkflow(workflowData);

    // Increment template usage count
    await supabaseClient
      .from('workflow_templates')
      .update({
        usage_count: template.usage_count + 1,
      })
      .eq('id', templateId);

    logger.info('Workflow created from template', {
      workflowId: workflow.id,
      templateId,
      templateName: template.template_name,
    });

    return workflow;
  } catch (error) {
    logger.error(
      'Failed to create workflow from template',
      error instanceof Error ? error : new Error(String(error)),
      { templateId }
    );
    throw error;
  }
}

/**
 * Create a new workflow template
 */
export async function createWorkflowTemplate(data: WorkflowTemplateInsert): Promise<WorkflowTemplate> {
  try {
    const { data: template, error } = await supabaseClient
      .from('workflow_templates')
      .insert(data)
      .select()
      .single();

    if (error) throw error;
    if (!template) throw new Error('Failed to create template');

    logger.info('Workflow template created', {
      templateId: template.id,
      name: template.template_name,
    });

    return template;
  } catch (error) {
    logger.error('Failed to create workflow template', error instanceof Error ? error : new Error(String(error)));
    throw error;
  }
}

/**
 * Duplicate an existing workflow
 */
export async function duplicateWorkflow(workflowId: string, shopId: string): Promise<Workflow> {
  try {
    const originalWorkflow = await getWorkflowById(workflowId, shopId);

    const duplicateData: WorkflowInsert = {
      shop_id: shopId,
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      trigger_event: originalWorkflow.trigger_event,
      trigger_conditions: originalWorkflow.trigger_conditions,
      actions: originalWorkflow.actions,
      is_active: false, // Start inactive
    };

    const workflow = await createWorkflow(duplicateData);

    logger.info('Workflow duplicated', {
      originalId: workflowId,
      newId: workflow.id,
      name: workflow.name,
    });

    return workflow;
  } catch (error) {
    logger.error('Failed to duplicate workflow', error instanceof Error ? error : new Error(String(error)), {
      workflowId,
    });
    throw error;
  }
}
