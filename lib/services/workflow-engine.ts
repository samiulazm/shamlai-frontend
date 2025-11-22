import { supabaseClient } from '../supabase';
import { logger } from '../utils/logger';
import { sendOrderConfirmationEmail, sendShipmentNotificationEmail } from './email';
import { sendOrderConfirmationSMS, sendShipmentNotificationSMS } from './sms';
import type {
  Workflow,
  WorkflowAction,
  WorkflowExecution,
  TriggerCondition,
  EmailActionConfig,
  SMSActionConfig,
  StatusChangeActionConfig,
  WaitActionConfig,
  WebhookActionConfig,
} from '../types/database';
import { incrementExecutionCount } from './workflows';

export class WorkflowEngine {
  /**
   * Execute a workflow
   */
  async execute(workflow: Workflow, triggerData: Record<string, any>): Promise<WorkflowExecution> {
    const startTime = Date.now();

    // Create execution record
    const { data: execution, error: executionError } = await supabaseClient
      .from('workflow_executions')
      .insert({
        workflow_id: workflow.id,
        shop_id: workflow.shop_id,
        trigger_event: workflow.trigger_event,
        trigger_data: triggerData,
        status: 'running',
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (executionError || !execution) {
      logger.error(
        'Failed to create execution record',
        executionError instanceof Error ? executionError : new Error(String(executionError))
      );
      throw executionError;
    }

    try {
      // Check trigger conditions
      if (workflow.trigger_conditions?.length) {
        const conditionsMet = this.evaluateConditions(workflow.trigger_conditions, triggerData);

        if (!conditionsMet) {
          await this.completeExecution(execution.id, 'completed', 'Conditions not met');
          logger.info('Workflow execution skipped - conditions not met', {
            workflowId: workflow.id,
            executionId: execution.id,
          });
          return execution;
        }
      }

      // Execute actions sequentially
      const actionsExecuted: Record<string, any>[] = [];

      for (const action of workflow.actions.sort((a, b) => a.order - b.order)) {
        try {
          const result = await this.executeAction(action, triggerData);
          actionsExecuted.push({
            action_id: action.id,
            action_type: action.type,
            success: true,
            result,
            executed_at: new Date().toISOString(),
          });

          logger.info('Action executed successfully', {
            workflowId: workflow.id,
            executionId: execution.id,
            actionId: action.id,
            actionType: action.type,
          });
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          actionsExecuted.push({
            action_id: action.id,
            action_type: action.type,
            success: false,
            error: errorMsg,
            executed_at: new Date().toISOString(),
          });

          logger.error('Action execution failed', error instanceof Error ? error : new Error(String(error)), {
            workflowId: workflow.id,
            executionId: execution.id,
            actionId: action.id,
            actionType: action.type,
          });

          // Stop execution on error
          throw error;
        }
      }

      // Mark as completed
      const executionTime = Date.now() - startTime;
      await this.completeExecution(execution.id, 'completed', null, actionsExecuted, executionTime);

      // Update workflow execution count
      await incrementExecutionCount(workflow.id);

      logger.info('Workflow executed successfully', {
        workflowId: workflow.id,
        executionId: execution.id,
        executionTimeMs: executionTime,
        actionsCount: actionsExecuted.length,
      });

      return execution;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : String(error);
      await this.completeExecution(execution.id, 'failed', errorMsg, [], executionTime);

      logger.error('Workflow execution failed', error instanceof Error ? error : new Error(String(error)), {
        workflowId: workflow.id,
        executionId: execution.id,
      });

      throw error;
    }
  }

  /**
   * Evaluate trigger conditions
   */
  private evaluateConditions(conditions: TriggerCondition[], data: Record<string, any>): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      const conditionMet = this.evaluateCondition(fieldValue, condition.operator, condition.value);

      if (currentLogic === 'AND') {
        result = result && conditionMet;
      } else {
        result = result || conditionMet;
      }

      currentLogic = condition.logic || 'AND';
    }

    return result;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(fieldValue: any, operator: string, compareValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === compareValue;
      case 'not_equals':
        return fieldValue !== compareValue;
      case 'greater_than':
        return Number(fieldValue) > Number(compareValue);
      case 'less_than':
        return Number(fieldValue) < Number(compareValue);
      case 'contains':
        return String(fieldValue).includes(String(compareValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(compareValue));
      case 'starts_with':
        return String(fieldValue).startsWith(String(compareValue));
      case 'ends_with':
        return String(fieldValue).endsWith(String(compareValue));
      default:
        logger.warn('Unknown condition operator', { operator });
        return false;
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(action: WorkflowAction, context: Record<string, any>): Promise<any> {
    switch (action.type) {
      case 'send_email':
        return await this.sendEmail(action.config as EmailActionConfig, context);
      case 'send_sms':
        return await this.sendSMS(action.config as SMSActionConfig, context);
      case 'update_order_status':
        return await this.updateOrderStatus(action.config as StatusChangeActionConfig, context);
      case 'send_notification':
        return await this.sendNotification(action.config, context);
      case 'wait':
        return await this.wait(action.config as WaitActionConfig);
      case 'webhook':
        return await this.callWebhook(action.config as WebhookActionConfig, context);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send email action
   */
  private async sendEmail(config: EmailActionConfig, context: Record<string, any>): Promise<void> {
    const to = this.interpolateTemplate(config.to, context);
    const subject = this.interpolateTemplate(config.subject, context);
    const body = this.interpolateTemplate(config.body, context);

    // Get customer and order details from context
    const customer = context.customer;
    const order = context.order;

    if (!customer?.email && !to.includes('@')) {
      throw new Error('No valid email recipient found');
    }

    // Use existing email service
    if (order) {
      await sendOrderConfirmationEmail({
        to: to || customer.email,
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: customer ? `${customer.first_name} ${customer.last_name}` : 'Customer',
        items: [], // Would need to fetch items
        subtotal: parseFloat(order.subtotal?.toString() || '0'),
        shipping: parseFloat(order.shipping_cost?.toString() || '0'),
        tax: parseFloat(order.tax_amount?.toString() || '0'),
        total: parseFloat(order.total?.toString() || '0'),
        shippingAddress: {
          name: `${order.shipping_first_name} ${order.shipping_last_name}`,
          street: order.shipping_address1,
          city: order.shipping_city || '',
          state: order.shipping_state || '',
          zip: order.shipping_postal_code || '',
          country: order.shipping_country || '',
        },
        shopName: context.shopName || 'Shop',
        shopEmail: context.shopEmail || 'noreply@example.com',
      });
    } else {
      // Generic email sending would go here
      logger.info('Email would be sent', { to, subject });
    }
  }

  /**
   * Send SMS action
   */
  private async sendSMS(config: SMSActionConfig, context: Record<string, any>): Promise<void> {
    const to = this.interpolateTemplate(config.to, context);
    const message = this.interpolateTemplate(config.message, context);

    if (!to) {
      throw new Error('No phone number provided');
    }

    const customer = context.customer;
    const order = context.order;

    if (order) {
      await sendOrderConfirmationSMS(
        to,
        order.order_number,
        parseFloat(order.total?.toString() || '0'),
        context.shopName || 'Shop'
      );
    } else {
      // Generic SMS sending would go here
      logger.info('SMS would be sent', { to, message });
    }
  }

  /**
   * Update order status action
   */
  private async updateOrderStatus(config: StatusChangeActionConfig, context: Record<string, any>): Promise<void> {
    const orderId = context.order?.id || context.orderId;
    if (!orderId) {
      throw new Error('Order ID not found in context');
    }

    const { error } = await supabaseClient
      .from('orders')
      .update({
        status: config.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;

    // Add to status history
    await supabaseClient.from('order_status_history').insert({
      order_id: orderId,
      status: config.status,
      notify_customer: config.notify_customer ?? false,
      comment: 'Status updated by workflow',
    });

    logger.info('Order status updated', { orderId, status: config.status });
  }

  /**
   * Send notification action
   */
  private async sendNotification(config: Record<string, any>, context: Record<string, any>): Promise<void> {
    const userId = context.user?.id || context.userId;
    if (!userId) {
      throw new Error('User ID not found in context');
    }

    const title = this.interpolateTemplate(config.title || 'Notification', context);
    const message = this.interpolateTemplate(config.message, context);
    const link = config.link ? this.interpolateTemplate(config.link, context) : undefined;

    const { error } = await supabaseClient.from('notifications').insert({
      user_id: userId,
      type: config.type || 'order',
      title,
      message,
      link,
      is_read: false,
    });

    if (error) throw error;

    logger.info('Notification sent', { userId, title });
  }

  /**
   * Wait/delay action
   */
  private async wait(config: WaitActionConfig): Promise<void> {
    let ms: number;

    switch (config.unit) {
      case 'minutes':
        ms = config.duration * 60 * 1000;
        break;
      case 'hours':
        ms = config.duration * 60 * 60 * 1000;
        break;
      case 'days':
        ms = config.duration * 24 * 60 * 60 * 1000;
        break;
      default:
        ms = config.duration * 60 * 1000; // Default to minutes
    }

    logger.info('Waiting', { duration: config.duration, unit: config.unit, ms });
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Call webhook action
   */
  private async callWebhook(config: WebhookActionConfig, context: Record<string, any>): Promise<any> {
    const url = this.interpolateTemplate(config.url, context);

    const options: RequestInit = {
      method: config.method,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    };

    if (config.body && (config.method === 'POST' || config.method === 'PUT')) {
      options.body = JSON.stringify(this.interpolateObject(config.body, context));
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}`);
    }

    const result = await response.json();
    logger.info('Webhook called successfully', { url, method: config.method, status: response.status });

    return result;
  }

  /**
   * Template interpolation (replace {{field}} with actual values)
   */
  private interpolateTemplate(template: string, context: Record<string, any>): string {
    if (!template) return '';

    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined && value !== null ? String(value) : match;
    });
  }

  /**
   * Interpolate all string values in an object
   */
  private interpolateObject(obj: Record<string, any>, context: Record<string, any>): Record<string, any> {
    const result: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        result[key] = this.interpolateTemplate(value, context);
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.interpolateObject(value, context);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Get nested value from object (e.g., "customer.email")
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Complete execution (update record)
   */
  private async completeExecution(
    executionId: string,
    status: 'completed' | 'failed' | 'cancelled',
    errorMessage?: string | null,
    actionsExecuted?: Record<string, any>[],
    executionTimeMs?: number
  ): Promise<void> {
    const { error } = await supabaseClient
      .from('workflow_executions')
      .update({
        status,
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTimeMs,
        actions_executed: actionsExecuted,
        error_message: errorMessage,
      })
      .eq('id', executionId);

    if (error) {
      logger.error('Failed to update execution record', error instanceof Error ? error : new Error(String(error)), {
        executionId,
      });
    }
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();

/**
 * Trigger workflows for a specific event
 */
export async function triggerWorkflows(
  shopId: string,
  triggerEvent: string,
  triggerData: Record<string, any>
): Promise<void> {
  try {
    // Get active workflows for this trigger
    const { data: workflows, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('shop_id', shopId)
      .eq('trigger_event', triggerEvent)
      .eq('is_active', true);

    if (error) throw error;

    if (!workflows || workflows.length === 0) {
      logger.info('No active workflows found for trigger', { shopId, triggerEvent });
      return;
    }

    logger.info('Found workflows to execute', {
      shopId,
      triggerEvent,
      workflowCount: workflows.length,
    });

    // Execute workflows in parallel
    const executions = workflows.map((workflow) => workflowEngine.execute(workflow, triggerData));

    await Promise.allSettled(executions);

    logger.info('Workflows triggered', {
      shopId,
      triggerEvent,
      workflowCount: workflows.length,
    });
  } catch (error) {
    logger.error('Failed to trigger workflows', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      triggerEvent,
    });
    // Don't throw - workflow execution should not block the main operation
  }
}
