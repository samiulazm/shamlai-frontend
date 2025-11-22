import { z } from 'zod';

// ============================================================================
// Workflow Validation Schemas
// ============================================================================

export const TriggerEventSchema = z.enum([
  'order_created',
  'order_status_changed',
  'payment_received',
  'customer_created',
  'product_low_stock',
  'custom',
]);

export const ConditionOperatorSchema = z.enum([
  'equals',
  'not_equals',
  'greater_than',
  'less_than',
  'contains',
  'not_contains',
  'starts_with',
  'ends_with',
]);

export const LogicOperatorSchema = z.enum(['AND', 'OR']);

export const TriggerConditionSchema = z.object({
  id: z.string().uuid(),
  field: z.string().min(1, 'Field is required'),
  operator: ConditionOperatorSchema,
  value: z.any(),
  logic: LogicOperatorSchema.optional(),
});

export const ActionTypeSchema = z.enum([
  'send_email',
  'send_sms',
  'update_order_status',
  'send_notification',
  'create_task',
  'wait',
  'conditional',
  'webhook',
]);

// Action config schemas
export const EmailActionConfigSchema = z.object({
  to: z.string().min(1, 'Recipient email is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
  cc: z.string().optional(),
  bcc: z.string().optional(),
});

export const SMSActionConfigSchema = z.object({
  to: z.string().min(1, 'Phone number is required'),
  message: z.string().min(1, 'Message is required').max(500, 'Message too long'),
});

export const StatusChangeActionConfigSchema = z.object({
  status: z.enum([
    'pending',
    'rts',
    'processing',
    'shipped',
    'delivered',
    'pending_return',
    'returned',
    'partial',
    'cancelled',
    'pending_cancel',
    'preorder',
    'lost',
    'refunded',
  ]),
  notify_customer: z.boolean().optional(),
});

export const WaitActionConfigSchema = z.object({
  duration: z.number().min(1, 'Duration must be at least 1'),
  unit: z.enum(['minutes', 'hours', 'days']),
});

export const WebhookActionConfigSchema = z.object({
  url: z.string().url('Invalid URL'),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE']),
  headers: z.record(z.string()).optional(),
  body: z.record(z.any()).optional(),
});

export const WorkflowActionSchema = z.object({
  id: z.string().uuid(),
  type: ActionTypeSchema,
  config: z.record(z.any()),
  order: z.number().int().min(0),
});

export const WorkflowInsertSchema = z.object({
  shop_id: z.string().uuid('Invalid shop ID'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  trigger_event: TriggerEventSchema,
  trigger_conditions: z.array(TriggerConditionSchema).optional(),
  actions: z
    .array(WorkflowActionSchema)
    .min(1, 'At least one action is required')
    .max(20, 'Maximum 20 actions allowed'),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
});

export const WorkflowUpdateSchema = WorkflowInsertSchema.partial().omit({
  shop_id: true,
  created_by: true,
});

export const WorkflowTemplateInsertSchema = z.object({
  template_name: z.string().min(1, 'Template name is required').max(255, 'Name too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  category: z.enum(['orders', 'marketing', 'inventory', 'customer', 'other']),
  trigger_event: TriggerEventSchema,
  trigger_conditions: z.array(TriggerConditionSchema).optional(),
  actions: z.array(WorkflowActionSchema).min(1, 'At least one action is required'),
  is_system_template: z.boolean().default(false),
  created_by: z.string().uuid().optional(),
});

// Validation helper functions
export function validateWorkflowInsert(data: unknown) {
  return WorkflowInsertSchema.safeParse(data);
}

export function validateWorkflowUpdate(data: unknown) {
  return WorkflowUpdateSchema.safeParse(data);
}

export function validateTriggerCondition(data: unknown) {
  return TriggerConditionSchema.safeParse(data);
}

export function validateWorkflowAction(data: unknown) {
  return WorkflowActionSchema.safeParse(data);
}

// Validate action config based on action type
export function validateActionConfig(type: string, config: unknown) {
  switch (type) {
    case 'send_email':
      return EmailActionConfigSchema.safeParse(config);
    case 'send_sms':
      return SMSActionConfigSchema.safeParse(config);
    case 'update_order_status':
      return StatusChangeActionConfigSchema.safeParse(config);
    case 'wait':
      return WaitActionConfigSchema.safeParse(config);
    case 'webhook':
      return WebhookActionConfigSchema.safeParse(config);
    default:
      return { success: true, data: config };
  }
}
