import { useState, useEffect, useCallback } from 'react';
import type { Workflow, WorkflowInsert, WorkflowUpdate, WorkflowTemplate } from '../types/database';

// ============================================================================
// Fetch Workflows Hook
// ============================================================================

export function useWorkflows(shopId?: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!shopId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workflows');

      if (!response.ok) {
        throw new Error('Failed to fetch workflows');
      }

      const data = await response.json();
      setWorkflows(data.workflows || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  }, [shopId]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    workflows,
    loading,
    error,
    refetch: fetchWorkflows,
  };
}

// ============================================================================
// Fetch Single Workflow Hook
// ============================================================================

export function useWorkflow(id: string | null) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorkflow = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}`);

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workflow not found');
        }
        throw new Error('Failed to fetch workflow');
      }

      const data = await response.json();
      setWorkflow(data.workflow);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setWorkflow(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchWorkflow();
  }, [fetchWorkflow]);

  return {
    workflow,
    loading,
    error,
    refetch: fetchWorkflow,
  };
}

// ============================================================================
// Workflow Mutations Hook
// ============================================================================

export function useWorkflowMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createWorkflow = async (data: WorkflowInsert): Promise<Workflow> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/workflows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow');
      }

      const result = await response.json();
      return result.workflow;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflow = async (id: string, data: WorkflowUpdate): Promise<Workflow> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update workflow');
      }

      const result = await response.json();
      return result.workflow;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete workflow');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const toggleWorkflow = async (id: string, active: boolean): Promise<Workflow> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to toggle workflow');
      }

      const result = await response.json();
      return result.workflow;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const executeWorkflow = async (id: string, triggerData: Record<string, any>): Promise<any> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ triggerData }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute workflow');
      }

      const result = await response.json();
      return result.execution;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    executeWorkflow,
    loading,
    error,
  };
}

// ============================================================================
// Workflow Templates Hook
// ============================================================================

export function useWorkflowTemplates(category?: string) {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const url = category ? `/api/workflow-templates?category=${category}` : '/api/workflow-templates';
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to fetch workflow templates');
      }

      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  }, [category]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const createFromTemplate = async (templateId: string, customName?: string): Promise<Workflow> => {
    try {
      const response = await fetch('/api/workflow-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, customName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create workflow from template');
      }

      const result = await response.json();
      return result.workflow;
    } catch (err) {
      throw err;
    }
  };

  return {
    templates,
    loading,
    error,
    refetch: fetchTemplates,
    createFromTemplate,
  };
}
