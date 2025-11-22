# Workflow Builder Implementation Research & Strategy

**Date**: 2025-11-22
**Project**: Shamlai Frontend
**Research Objective**: Comprehensive analysis and implementation strategy for building a visual workflow builder

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current Codebase Analysis](#current-codebase-analysis)
3. [Technology Stack Assessment](#technology-stack-assessment)
4. [Workflow Builder Library Research](#workflow-builder-library-research)
5. [Implementation Strategy](#implementation-strategy)
6. [Database Schema & Type Definitions](#database-schema--type-definitions)
7. [Component Architecture](#component-architecture)
8. [Service Layer Implementation](#service-layer-implementation)
9. [API Routes Design](#api-routes-design)
10. [UI/UX Recommendations](#uiux-recommendations)
11. [Implementation Phases](#implementation-phases)
12. [Code Examples](#code-examples)
13. [Testing Strategy](#testing-strategy)
14. [Performance Considerations](#performance-considerations)
15. [References](#references)

---

## Executive Summary

### Key Findings

✅ **Strong Foundation**: The codebase already has comprehensive workflow infrastructure:
- Database schema for workflows, templates, and executions exists (`/scripts/database-schemas/workflows.sql`)
- Production-ready workflow execution logic (`/lib/services/order-workflows.ts`)
- Stub UI pages ready for implementation (`/app/(dashboard)/automation/`)

✅ **Modern Tech Stack**:
- Next.js 14 with App Router and TypeScript
- Tailwind CSS for styling (no heavy component libraries)
- Framer Motion for animations (already installed)
- Custom-built components following consistent patterns

⚠️ **What's Missing**:
- TypeScript types for workflow entities
- Workflow CRUD service layer
- Visual builder UI components
- React hooks for workflow data fetching
- API routes for workflow operations

### Recommended Approach

**Phase 1 (MVP)**: Simple list-based workflow builder using Framer Motion's Reorder component
- Quick to implement (matches existing patterns)
- Low complexity, maintainable
- Sufficient for most automation needs

**Phase 2 (Advanced)**: Node-based visual builder using React Flow
- More powerful and visual
- Better for complex conditional workflows
- Requires additional library (@xyflow/react)

**Timeline Estimate**:
- Phase 1: 2-3 weeks
- Phase 2: 4-6 weeks (if needed)

---

## Current Codebase Analysis

### Project Structure

```
shamlai-frontend/
├── app/                          # Next.js 14 App Router
│   ├── (dashboard)/              # Merchant dashboard
│   │   ├── automation/           # 🎯 Workflow pages (stubs)
│   │   │   ├── page.tsx         # Workflows list
│   │   │   ├── builder/page.tsx # Workflow builder
│   │   │   └── templates/page.tsx # Templates
│   │   ├── products/
│   │   ├── orders/
│   │   └── customers/
│   └── api/                      # API routes
├── components/
│   ├── common/                   # Reusable components
│   │   ├── Modal.tsx            # ✅ Can use for action config
│   │   ├── FormComponents.tsx   # ✅ Input, Select, Textarea
│   │   └── ConfirmDialog.tsx    # ✅ Can use for confirmations
│   └── dashboard/                # Dashboard-specific
├── lib/
│   ├── services/                 # Business logic
│   │   └── order-workflows.ts   # 🎯 Existing workflow logic
│   ├── hooks/                    # Custom hooks
│   ├── types/                    # TypeScript types
│   │   └── database.ts          # 🎯 Need workflow types here
│   └── context/                  # React contexts
└── scripts/
    └── database-schemas/
        ├── workflows.sql         # ✅ Already exists!
        ├── workflow_executions.sql
        └── workflow_templates.sql
```

### Existing Workflow Infrastructure

#### 1. Database Schema (Already Implemented)

**File**: `/scripts/database-schemas/workflows.sql`

**workflows** table:
- `id`: UUID (primary key)
- `shop_id`: UUID (foreign key to users)
- `name`: TEXT (workflow name)
- `description`: TEXT (optional)
- `trigger_event`: TEXT (event that triggers the workflow)
- `trigger_conditions`: JSONB (conditions to check before triggering)
- `actions`: JSONB (array of actions to execute)
- `is_active`: BOOLEAN (whether workflow is enabled)
- `execution_count`: INTEGER (number of times executed)
- `last_executed_at`: TIMESTAMP
- `created_by`: UUID
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

**workflow_templates** table:
- Pre-built workflow templates
- Categories: orders, marketing, inventory, customer
- System templates and user-created templates

**workflow_executions** table:
- Execution logs
- Status tracking (running, completed, failed, cancelled)
- Error details and performance metrics

#### 2. Existing Workflow Logic

**File**: `/lib/services/order-workflows.ts`

This file contains production-ready workflow implementations:

**Key Functions**:
1. `processNewOrder()` - Complete order creation workflow
   - Creates order with inventory deduction
   - Creates payment record
   - Sends email confirmation
   - Sends SMS confirmation

2. `updateOrderWithWorkflow()` - Status change workflows
   - Updates order status
   - Handles status-specific logic (shipped, delivered, cancelled, refunded)
   - Sends appropriate notifications

3. `cancelOrderWithWorkflow()` - Cancellation workflow
   - Restores inventory
   - Processes refunds
   - Sends notifications

4. `autoTransitionOrders()` - Automated transitions
   - Auto-marks paid orders as processing
   - Auto-cancels old pending orders (3+ days)

**Supported Trigger Events**:
- `order_created`
- `order_status_changed`
- `payment_received`
- `customer_created`
- `product_low_stock`
- `custom`

**Workflow Actions** (already implemented):
- Send email
- Send SMS
- Update order status
- Create notifications
- Inventory management
- Payment processing

#### 3. UI Pages (Stubs)

**File**: `/app/(dashboard)/automation/builder/page.tsx`

Current state:
```tsx
- Basic form with name, description, trigger event dropdown
- Empty actions section (placeholder)
- TODO: Implement actual workflow builder
```

What needs to be built:
- Visual action builder
- Condition builder
- Action configuration modals
- Workflow preview/testing
- Save/load functionality

### Component Patterns

The codebase uses **custom-built components** with Tailwind CSS (no heavy component libraries like Material-UI or Ant Design).

**Existing Components** we can leverage:

1. **Modal.tsx** (`/components/common/Modal.tsx`)
   - Full-featured modal with size variants (sm, md, lg, xl, full)
   - Perfect for action configuration dialogs
   ```tsx
   <Modal isOpen={isOpen} onClose={onClose} title="Configure Action" size="lg">
     {/* Action config form */}
   </Modal>
   ```

2. **FormComponents.tsx** (`/components/common/FormComponents.tsx`)
   - `Input` - Text input with label, error, helper text
   - `Textarea` - Multi-line input
   - `Select` - Dropdown with options
   - All use forwardRef for form library integration

3. **Other Utilities**:
   - ConfirmDialog - For confirmations
   - Toast - For notifications
   - Skeleton - For loading states

**Styling System**:
- Tailwind CSS with custom utility classes
- CSS variables for theming (`/app/globals.css`)
- Custom component classes: `.btn`, `.card`, `.badge`, `.alert`, `.table`, `.input`
- Mobile-optimized with proper touch targets (min 44-48px)
- Accessibility-first with focus states and ARIA support

### State Management

**No Redux/Zustand** - Uses **Context + Custom Hooks** pattern

**Existing Contexts**:
1. `AuthContext` - User authentication state
2. `ThemeContext` - Theme customization

**Hook Pattern** (Example from codebase):
```typescript
// Data fetching hook
export function useOrders(shopId: string, filters?: QueryFilters) {
  const [orders, setOrders] = useState<PaginatedResponse<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch data
  }, [shopId, filters]);

  return { orders, loading, error };
}

// Mutation hook
export function useOrderMutations() {
  // Create, update, delete functions
  return { createOrder, updateOrderStatus, loading, error };
}
```

We'll follow this pattern for workflow hooks.

---

## Technology Stack Assessment

### Current Stack

| Technology | Version | Purpose | Notes |
|------------|---------|---------|-------|
| **Next.js** | 14.2.33 | Framework | App Router with TypeScript |
| **React** | 18.3.1 | UI Library | Functional components with hooks |
| **TypeScript** | 5.6 | Type Safety | Strict mode enabled |
| **Tailwind CSS** | 3.4.13 | Styling | Custom utility classes |
| **Framer Motion** | 11.3.31 | Animation | ✅ Can use for drag & drop |
| **Supabase** | 2.39.0 | Database & Auth | PostgreSQL with RLS |
| **Zod** | 4.1.12 | Validation | Schema validation |
| **Lucide React** | 0.468.0 | Icons | Modern icon library |
| **Recharts** | 2.12.7 | Charts | Data visualization |

### Libraries for Workflow Builder

#### Option A: Simple List-Based Builder (Recommended for MVP)

**Use Framer Motion** (already installed) ✅

**Pros**:
- Already installed (zero new dependencies)
- Lightweight and performant
- Simple API: `Reorder.Group` and `Reorder.Item`
- Perfect for vertical list of actions
- Matches existing animation patterns
- Quick to implement

**Cons**:
- Limited to list-based reordering
- Not suitable for complex branching workflows
- No built-in conditional/branching UI

**Use Case**: Perfect for linear workflows where actions execute sequentially.

**Example**:
```tsx
import { Reorder } from "framer-motion";

<Reorder.Group values={actions} onReorder={setActions}>
  {actions.map((action) => (
    <Reorder.Item key={action.id} value={action}>
      <ActionBlock action={action} />
    </Reorder.Item>
  ))}
</Reorder.Group>
```

#### Option B: Node-Based Visual Builder (Advanced)

**Use React Flow (@xyflow/react)** 🆕

**Pros**:
- Professional node-based UI
- Perfect for complex workflows with branching
- Built-in zoom, pan, minimap
- Extensive customization options
- Active development and community
- MIT license (free)
- Excellent documentation
- Used by major companies (Stripe, Databricks, etc.)

**Cons**:
- Additional dependency (~200KB gzipped)
- Steeper learning curve
- More complex setup
- Might be overkill for simple linear workflows

**Use Case**: Best for complex workflows with conditions, branches, parallel execution, and decision trees.

**Installation**:
```bash
npm install @xyflow/react
```

**Basic Example**:
```tsx
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodes = [
  { id: '1', type: 'trigger', position: { x: 0, y: 0 }, data: { label: 'Order Created' } },
  { id: '2', type: 'action', position: { x: 0, y: 100 }, data: { label: 'Send Email' } },
];

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
];

<ReactFlow nodes={nodes} edges={edges}>
  <Background />
  <Controls />
</ReactFlow>
```

#### Option C: Hybrid Approach (Recommended)

**Start with Framer Motion (Phase 1)**, then **add React Flow for advanced features (Phase 2)**

This approach:
- Delivers value quickly
- Validates UX before heavy investment
- Allows time to understand user needs
- Can coexist (simple workflows use list, complex use nodes)

---

## Workflow Builder Library Research

### React Flow (@xyflow/react) - Deep Dive

**Official Site**: https://reactflow.dev
**NPM**: https://www.npmjs.com/package/@xyflow/react
**GitHub**: https://github.com/xyflow/xyflow

#### Key Features

1. **Node-Based UI**
   - Custom node types (trigger, action, condition, delay)
   - Drag and drop nodes
   - Connect nodes with edges
   - Node groups and sub-flows

2. **Built-in Controls**
   - Zoom and pan
   - Minimap for navigation
   - Background patterns (dots, lines, cross)
   - Node selection (single and multi)

3. **Customization**
   - Custom node components
   - Custom edge types
   - Styling with Tailwind
   - Event handlers for all interactions

4. **Performance**
   - Optimized for large graphs (1000+ nodes)
   - Virtual rendering
   - Lazy loading support

5. **Developer Experience**
   - TypeScript support
   - React 18 compatible
   - Extensive documentation
   - CodeSandbox examples
   - Active community

#### Official Examples

- **Workflow Editor Template**: https://reactflow.dev/ui/templates/workflow-editor (Pro template)
- **Drag and Drop**: https://reactflow.dev/examples/interaction/drag-and-drop
- **Workflow Builder Starter**: https://reactflow.dev/examples/layout/workflow-builder-starter
- **Quick Start Guide**: https://reactflow.dev/learn

#### Integration with Existing Stack

React Flow works well with:
- ✅ Next.js 14 (use 'use client' directive)
- ✅ TypeScript (full type support)
- ✅ Tailwind CSS (style nodes with Tailwind classes)
- ✅ Framer Motion (can combine for extra animations)

### Framer Motion Reorder - Deep Dive

**Official Docs**: https://www.framer.com/motion/reorder/
**Tutorial**: https://egghead.io/blog/drag-to-reorder-list-items-with-framer-motion
**Examples**: https://codesandbox.io/s/framer-motion-5-drag-to-reorder-lists-uonye

#### Key Features

1. **Simple API**
   - `Reorder.Group` - Wraps the list
   - `Reorder.Item` - Individual draggable items
   - Automatic layout animations

2. **Built-in Animations**
   - Smooth reordering transitions
   - Drag gestures out of the box
   - No extra configuration needed

3. **Limitations**
   - Single-dimensional reordering (vertical or horizontal)
   - No multi-column drag & drop
   - No nested drag & drop
   - Not ideal for complex layouts

4. **When to Use**
   - Simple todo-list style interfaces
   - Priority ordering
   - Linear workflows
   - Quick implementation needed

#### Basic Implementation

```tsx
import { Reorder } from "framer-motion";
import { useState } from "react";

export function WorkflowActions() {
  const [items, setItems] = useState([
    { id: "1", type: "email", title: "Send confirmation email" },
    { id: "2", type: "sms", title: "Send SMS notification" },
    { id: "3", type: "status", title: "Update order status" },
  ]);

  return (
    <Reorder.Group axis="y" values={items} onReorder={setItems}>
      {items.map((item) => (
        <Reorder.Item key={item.id} value={item}>
          <div className="p-4 bg-white border rounded mb-2 cursor-grab active:cursor-grabbing">
            {item.title}
          </div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}
```

### Alternative Libraries Considered

#### dnd-kit
**Pros**: Modern, accessible, actively maintained
**Cons**: More complex API than Framer Motion
**Decision**: Not needed since we have Framer Motion

#### react-beautiful-dnd
**Pros**: Popular, mature
**Cons**: No longer actively maintained
**Decision**: Avoid (deprecated)

#### pragmatic-drag-and-drop
**Pros**: New and modern
**Cons**: Less mature documentation
**Decision**: Too new, stick with proven solutions

---

## Implementation Strategy

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  UI Components                                               │
│  ├── WorkflowCanvas (drag & drop)                           │
│  ├── TriggerSelector                                         │
│  ├── ConditionBuilder                                        │
│  ├── ActionBlocks                                            │
│  └── ActionConfig Modals                                     │
├─────────────────────────────────────────────────────────────┤
│  Custom Hooks                                                │
│  ├── useWorkflows()                                          │
│  ├── useWorkflow(id)                                         │
│  ├── useWorkflowMutations()                                  │
│  └── useWorkflowTemplates()                                  │
├─────────────────────────────────────────────────────────────┤
│  API Routes (Next.js)                                        │
│  ├── /api/workflows (GET, POST)                             │
│  ├── /api/workflows/[id] (GET, PUT, DELETE)                 │
│  ├── /api/workflows/[id]/execute (POST)                     │
│  └── /api/workflow-templates (GET)                          │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                               │
│  ├── workflows.ts (CRUD operations)                         │
│  ├── workflow-engine.ts (Execution logic)                   │
│  └── workflow-templates.ts (Template management)            │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase/PostgreSQL)                             │
│  ├── workflows                                               │
│  ├── workflow_templates                                      │
│  ├── workflow_executions                                     │
│  └── Related tables (orders, customers, products, etc.)     │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

#### 1. Workflow Creation Flow
```
User creates workflow in UI
    ↓
WorkflowCanvas collects trigger + actions
    ↓
useWorkflowMutations.createWorkflow()
    ↓
POST /api/workflows
    ↓
workflows.createWorkflow(data)
    ↓
Validate with Zod schema
    ↓
Insert into workflows table
    ↓
Return workflow object
    ↓
Update UI with new workflow
```

#### 2. Workflow Execution Flow
```
Trigger event occurs (e.g., order created)
    ↓
Check for active workflows with matching trigger
    ↓
Evaluate trigger conditions
    ↓
If conditions match:
    ↓
Create workflow_execution record
    ↓
Execute actions sequentially
    ↓
Log each action result
    ↓
Update execution status (completed/failed)
    ↓
Send notifications if configured
```

### Component Hierarchy

```
/app/(dashboard)/automation/builder/page.tsx
└── WorkflowBuilderPage
    ├── WorkflowHeader (name, description, save button)
    ├── TriggerSection
    │   ├── TriggerSelector (dropdown)
    │   └── ConditionBuilder (optional filters)
    │       ├── ConditionRow
    │       └── AddConditionButton
    └── ActionsSection
        ├── ActionList (Framer Motion Reorder.Group)
        │   └── ActionBlock (Reorder.Item)
        │       ├── ActionIcon
        │       ├── ActionSummary
        │       ├── EditButton → Opens ActionConfigModal
        │       └── DeleteButton
        └── AddActionButton → Opens ActionTypeSelector

Modals:
├── ActionTypeSelector (Modal)
│   └── Grid of available action types
├── EmailActionConfig (Modal)
│   └── Email template form
├── SMSActionConfig (Modal)
│   └── SMS template form
├── StatusChangeActionConfig (Modal)
│   └── Status selection
└── ConditionActionConfig (Modal)
    └── Conditional branching setup
```

---

## Database Schema & Type Definitions

### TypeScript Types (to add to `/lib/types/database.ts`)

```typescript
// ============================================================================
// Workflow Types
// ============================================================================

export type TriggerEvent =
  | 'order_created'
  | 'order_status_changed'
  | 'payment_received'
  | 'customer_created'
  | 'product_low_stock'
  | 'custom';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'greater_than'
  | 'less_than'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with';

export type LogicOperator = 'AND' | 'OR';

export interface TriggerCondition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: any;
  logic?: LogicOperator;
}

export type ActionType =
  | 'send_email'
  | 'send_sms'
  | 'update_order_status'
  | 'send_notification'
  | 'create_task'
  | 'wait'
  | 'conditional'
  | 'webhook';

export interface WorkflowAction {
  id: string;
  type: ActionType;
  config: Record<string, any>;
  order: number;
}

// Email action config
export interface EmailActionConfig {
  to: string; // Can be template variable like {{customer.email}}
  subject: string;
  body: string; // HTML or template
  cc?: string;
  bcc?: string;
}

// SMS action config
export interface SMSActionConfig {
  to: string; // Can be template variable like {{customer.phone}}
  message: string; // Template with variables
}

// Status change action config
export interface StatusChangeActionConfig {
  status: OrderStatus;
  notify_customer?: boolean;
}

// Wait action config
export interface WaitActionConfig {
  duration: number; // in minutes
  unit: 'minutes' | 'hours' | 'days';
}

// Conditional action config
export interface ConditionalActionConfig {
  conditions: TriggerCondition[];
  if_true_actions: WorkflowAction[];
  if_false_actions?: WorkflowAction[];
}

// Webhook action config
export interface WebhookActionConfig {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: Record<string, any>;
}

export interface Workflow {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  trigger_event: TriggerEvent;
  trigger_conditions?: TriggerCondition[];
  actions: WorkflowAction[];
  is_active: boolean;
  execution_count: number;
  last_executed_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkflowInsert {
  shop_id: string;
  name: string;
  description?: string;
  trigger_event: TriggerEvent;
  trigger_conditions?: TriggerCondition[];
  actions: WorkflowAction[];
  is_active?: boolean;
  created_by?: string;
}

export interface WorkflowUpdate {
  name?: string;
  description?: string;
  trigger_event?: TriggerEvent;
  trigger_conditions?: TriggerCondition[];
  actions?: WorkflowAction[];
  is_active?: boolean;
}

export type WorkflowExecutionStatus =
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface WorkflowExecution {
  id: string;
  workflow_id: string;
  shop_id: string;
  trigger_event: string;
  trigger_data?: Record<string, any>;
  status: WorkflowExecutionStatus;
  started_at: string;
  completed_at?: string;
  execution_time_ms?: number;
  actions_executed?: Record<string, any>[];
  error_message?: string;
  error_details?: Record<string, any>;
}

export type WorkflowCategory =
  | 'orders'
  | 'marketing'
  | 'inventory'
  | 'customer'
  | 'other';

export interface WorkflowTemplate {
  id: string;
  template_name: string;
  description?: string;
  category: WorkflowCategory;
  trigger_event: TriggerEvent;
  trigger_conditions?: TriggerCondition[];
  actions: WorkflowAction[];
  is_system_template: boolean;
  usage_count: number;
  created_by?: string;
  created_at: string;
}
```

### Zod Validation Schemas (new file: `/lib/schemas/workflow.ts`)

```typescript
import { z } from 'zod';

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

export const TriggerConditionSchema = z.object({
  id: z.string().uuid(),
  field: z.string().min(1),
  operator: ConditionOperatorSchema,
  value: z.any(),
  logic: z.enum(['AND', 'OR']).optional(),
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

export const WorkflowActionSchema = z.object({
  id: z.string().uuid(),
  type: ActionTypeSchema,
  config: z.record(z.any()),
  order: z.number().int().min(0),
});

export const WorkflowInsertSchema = z.object({
  shop_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  trigger_event: TriggerEventSchema,
  trigger_conditions: z.array(TriggerConditionSchema).optional(),
  actions: z.array(WorkflowActionSchema).min(1),
  is_active: z.boolean().default(true),
  created_by: z.string().uuid().optional(),
});

export const WorkflowUpdateSchema = WorkflowInsertSchema.partial().omit({
  shop_id: true,
  created_by: true,
});
```

---

## Component Architecture

### File Structure

```
components/workflow-builder/
├── index.ts                          # Barrel exports
├── WorkflowCanvas.tsx                # Main canvas wrapper
├── WorkflowHeader.tsx                # Name, description, save
├── TriggerSection/
│   ├── TriggerSelector.tsx          # Event dropdown
│   ├── ConditionBuilder.tsx         # Condition list
│   └── ConditionRow.tsx             # Single condition
├── ActionsSection/
│   ├── ActionList.tsx               # Reorder.Group wrapper
│   ├── ActionBlock.tsx              # Reorder.Item (single action)
│   └── ActionTypeSelector.tsx       # Modal to select action type
├── ActionConfig/
│   ├── EmailConfig.tsx              # Email action form
│   ├── SMSConfig.tsx                # SMS action form
│   ├── StatusChangeConfig.tsx       # Status change form
│   ├── WaitConfig.tsx               # Wait/delay form
│   ├── ConditionalConfig.tsx        # Conditional branching
│   └── WebhookConfig.tsx            # Webhook configuration
└── WorkflowPreview.tsx               # Preview/test workflow

lib/hooks/
└── useWorkflows.ts                   # Workflow hooks

lib/services/
├── workflows.ts                      # CRUD operations
├── workflow-engine.ts                # Execution engine
└── workflow-templates.ts             # Template management

lib/schemas/
└── workflow.ts                       # Zod schemas
```

### Key Components

#### 1. WorkflowCanvas.tsx (Main Container)

```tsx
'use client';

import { useState } from 'react';
import { WorkflowHeader } from './WorkflowHeader';
import { TriggerSection } from './TriggerSection';
import { ActionsSection } from './ActionsSection';
import { useWorkflowMutations } from '@/lib/hooks/useWorkflows';
import type { Workflow, TriggerEvent, WorkflowAction } from '@/lib/types/database';

interface WorkflowCanvasProps {
  initialWorkflow?: Workflow;
  mode: 'create' | 'edit';
  shopId: string;
}

export function WorkflowCanvas({ initialWorkflow, mode, shopId }: WorkflowCanvasProps) {
  const [name, setName] = useState(initialWorkflow?.name || '');
  const [description, setDescription] = useState(initialWorkflow?.description || '');
  const [triggerEvent, setTriggerEvent] = useState<TriggerEvent | ''>('');
  const [triggerConditions, setTriggerConditions] = useState(initialWorkflow?.trigger_conditions || []);
  const [actions, setActions] = useState<WorkflowAction[]>(initialWorkflow?.actions || []);

  const { createWorkflow, updateWorkflow, loading } = useWorkflowMutations();

  const handleSave = async () => {
    const workflowData = {
      shop_id: shopId,
      name,
      description,
      trigger_event: triggerEvent,
      trigger_conditions: triggerConditions,
      actions,
    };

    if (mode === 'create') {
      await createWorkflow(workflowData);
    } else {
      await updateWorkflow(initialWorkflow!.id, workflowData);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <WorkflowHeader
        name={name}
        setName={setName}
        description={description}
        setDescription={setDescription}
        onSave={handleSave}
        loading={loading}
      />

      <TriggerSection
        triggerEvent={triggerEvent}
        setTriggerEvent={setTriggerEvent}
        conditions={triggerConditions}
        setConditions={setTriggerConditions}
      />

      <ActionsSection
        actions={actions}
        setActions={setActions}
      />
    </div>
  );
}
```

#### 2. ActionList.tsx (Framer Motion Reorder)

```tsx
'use client';

import { Reorder } from 'framer-motion';
import { Plus } from 'lucide-react';
import { ActionBlock } from './ActionBlock';
import { ActionTypeSelector } from './ActionTypeSelector';
import { useState } from 'react';
import type { WorkflowAction } from '@/lib/types/database';

interface ActionListProps {
  actions: WorkflowAction[];
  setActions: (actions: WorkflowAction[]) => void;
}

export function ActionList({ actions, setActions }: ActionListProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);

  const handleReorder = (newActions: WorkflowAction[]) => {
    // Update order numbers
    const reordered = newActions.map((action, index) => ({
      ...action,
      order: index,
    }));
    setActions(reordered);
  };

  const handleAddAction = (type: ActionType) => {
    const newAction: WorkflowAction = {
      id: crypto.randomUUID(),
      type,
      config: {},
      order: actions.length,
    };
    setActions([...actions, newAction]);
    setShowTypeSelector(false);
  };

  const handleEditAction = (id: string, config: Record<string, any>) => {
    setActions(
      actions.map((action) =>
        action.id === id ? { ...action, config } : action
      )
    );
  };

  const handleDeleteAction = (id: string) => {
    setActions(actions.filter((action) => action.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Actions</h3>
        <button
          onClick={() => setShowTypeSelector(true)}
          className="btn btn-secondary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Action
        </button>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed">
          <p className="text-gray-500">No actions yet. Click "Add Action" to get started.</p>
        </div>
      ) : (
        <Reorder.Group axis="y" values={actions} onReorder={handleReorder}>
          {actions.map((action, index) => (
            <Reorder.Item key={action.id} value={action}>
              <ActionBlock
                action={action}
                index={index}
                onEdit={handleEditAction}
                onDelete={handleDeleteAction}
              />
            </Reorder.Item>
          ))}
        </Reorder.Group>
      )}

      <ActionTypeSelector
        isOpen={showTypeSelector}
        onClose={() => setShowTypeSelector(false)}
        onSelect={handleAddAction}
      />
    </div>
  );
}
```

#### 3. ActionBlock.tsx (Draggable Action Card)

```tsx
'use client';

import { GripVertical, Edit, Trash2, Mail, MessageSquare, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { EmailConfig } from '../ActionConfig/EmailConfig';
import { SMSConfig } from '../ActionConfig/SMSConfig';
import { StatusChangeConfig } from '../ActionConfig/StatusChangeConfig';
import Modal from '@/components/common/Modal';
import type { WorkflowAction } from '@/lib/types/database';

interface ActionBlockProps {
  action: WorkflowAction;
  index: number;
  onEdit: (id: string, config: Record<string, any>) => void;
  onDelete: (id: string) => void;
}

const ACTION_ICONS = {
  send_email: Mail,
  send_sms: MessageSquare,
  update_order_status: RefreshCw,
  // ... more icons
};

const ACTION_LABELS = {
  send_email: 'Send Email',
  send_sms: 'Send SMS',
  update_order_status: 'Update Order Status',
  // ... more labels
};

export function ActionBlock({ action, index, onEdit, onDelete }: ActionBlockProps) {
  const [showConfig, setShowConfig] = useState(false);
  const Icon = ACTION_ICONS[action.type];

  const renderConfig = () => {
    switch (action.type) {
      case 'send_email':
        return (
          <EmailConfig
            config={action.config}
            onSave={(config) => {
              onEdit(action.id, config);
              setShowConfig(false);
            }}
          />
        );
      case 'send_sms':
        return (
          <SMSConfig
            config={action.config}
            onSave={(config) => {
              onEdit(action.id, config);
              setShowConfig(false);
            }}
          />
        );
      case 'update_order_status':
        return (
          <StatusChangeConfig
            config={action.config}
            onSave={(config) => {
              onEdit(action.id, config);
              setShowConfig(false);
            }}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="bg-white border rounded-lg p-4 mb-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow">
        <div className="flex items-center gap-3">
          <GripVertical className="h-5 w-5 text-gray-400" />

          <div className="flex items-center gap-2 flex-1">
            <div className="p-2 bg-indigo-100 rounded">
              <Icon className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <div className="font-medium">{ACTION_LABELS[action.type]}</div>
              <div className="text-sm text-gray-500">
                {action.config.subject || action.config.message || 'Not configured'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => onDelete(action.id)}
              className="p-2 hover:bg-red-50 rounded"
            >
              <Trash2 className="h-4 w-4 text-red-600" />
            </button>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        title={`Configure ${ACTION_LABELS[action.type]}`}
        size="lg"
      >
        {renderConfig()}
      </Modal>
    </>
  );
}
```

---

## Service Layer Implementation

### 1. Workflow CRUD Service (`/lib/services/workflows.ts`)

```typescript
import { supabaseClient } from '../supabase';
import { logger } from '../utils/logger';
import type { Workflow, WorkflowInsert, WorkflowUpdate } from '../types/database';
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
    logger.error('Failed to fetch workflows', error);
    throw error;
  }
}

/**
 * Get a single workflow by ID
 */
export async function getWorkflowById(id: string): Promise<Workflow> {
  try {
    const { data, error } = await supabaseClient
      .from('workflows')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Workflow not found');

    return data;
  } catch (error) {
    logger.error('Failed to fetch workflow', error, { id });
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

    logger.info('Workflow created', { workflowId: workflow.id });
    return workflow;
  } catch (error) {
    logger.error('Failed to create workflow', error);
    throw error;
  }
}

/**
 * Update an existing workflow
 */
export async function updateWorkflow(
  id: string,
  data: WorkflowUpdate
): Promise<Workflow> {
  try {
    // Validate input
    const validated = WorkflowUpdateSchema.parse(data);

    const { data: workflow, error } = await supabaseClient
      .from('workflows')
      .update({
        ...validated,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Workflow updated', { workflowId: id });
    return workflow;
  } catch (error) {
    logger.error('Failed to update workflow', error, { id });
    throw error;
  }
}

/**
 * Delete a workflow
 */
export async function deleteWorkflow(id: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('workflows')
      .delete()
      .eq('id', id);

    if (error) throw error;

    logger.info('Workflow deleted', { workflowId: id });
  } catch (error) {
    logger.error('Failed to delete workflow', error, { id });
    throw error;
  }
}

/**
 * Toggle workflow active status
 */
export async function toggleWorkflow(
  id: string,
  active: boolean
): Promise<Workflow> {
  try {
    const { data: workflow, error } = await supabaseClient
      .from('workflows')
      .update({
        is_active: active,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    logger.info('Workflow toggled', { workflowId: id, active });
    return workflow;
  } catch (error) {
    logger.error('Failed to toggle workflow', error, { id });
    throw error;
  }
}

/**
 * Get active workflows for a specific trigger event
 */
export async function getActiveWorkflowsByTrigger(
  shopId: string,
  triggerEvent: string
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
    logger.error('Failed to fetch active workflows', error);
    throw error;
  }
}
```

### 2. Workflow Execution Engine (`/lib/services/workflow-engine.ts`)

```typescript
import { supabaseClient } from '../supabase';
import { logger } from '../utils/logger';
import { sendOrderConfirmationEmail } from './email';
import { sendOrderConfirmationSMS } from './sms';
import type {
  Workflow,
  WorkflowAction,
  WorkflowExecution,
  TriggerCondition
} from '../types/database';

export class WorkflowEngine {
  /**
   * Execute a workflow
   */
  async execute(
    workflow: Workflow,
    triggerData: Record<string, any>
  ): Promise<WorkflowExecution> {
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
      logger.error('Failed to create execution record', executionError);
      throw executionError;
    }

    try {
      // Check trigger conditions
      if (workflow.trigger_conditions?.length) {
        const conditionsMet = this.evaluateConditions(
          workflow.trigger_conditions,
          triggerData
        );

        if (!conditionsMet) {
          await this.completeExecution(execution.id, 'completed', 'Conditions not met');
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
          });
        } catch (error) {
          actionsExecuted.push({
            action_id: action.id,
            action_type: action.type,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });

          // Stop execution on error
          throw error;
        }
      }

      // Mark as completed
      const executionTime = Date.now() - startTime;
      await this.completeExecution(
        execution.id,
        'completed',
        null,
        actionsExecuted,
        executionTime
      );

      // Update workflow execution count
      await supabaseClient
        .from('workflows')
        .update({
          execution_count: workflow.execution_count + 1,
          last_executed_at: new Date().toISOString(),
        })
        .eq('id', workflow.id);

      logger.info('Workflow executed successfully', {
        workflowId: workflow.id,
        executionId: execution.id,
        executionTimeMs: executionTime,
      });

      return execution;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      await this.completeExecution(
        execution.id,
        'failed',
        error instanceof Error ? error.message : String(error),
        [],
        executionTime
      );

      logger.error('Workflow execution failed', error, {
        workflowId: workflow.id,
        executionId: execution.id,
      });

      throw error;
    }
  }

  /**
   * Evaluate trigger conditions
   */
  private evaluateConditions(
    conditions: TriggerCondition[],
    data: Record<string, any>
  ): boolean {
    if (conditions.length === 0) return true;

    let result = true;
    let currentLogic: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const fieldValue = this.getNestedValue(data, condition.field);
      const conditionMet = this.evaluateCondition(
        fieldValue,
        condition.operator,
        condition.value
      );

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
  private evaluateCondition(
    fieldValue: any,
    operator: string,
    compareValue: any
  ): boolean {
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
        return false;
    }
  }

  /**
   * Execute a single action
   */
  private async executeAction(
    action: WorkflowAction,
    context: Record<string, any>
  ): Promise<any> {
    switch (action.type) {
      case 'send_email':
        return await this.sendEmail(action.config, context);
      case 'send_sms':
        return await this.sendSMS(action.config, context);
      case 'update_order_status':
        return await this.updateOrderStatus(action.config, context);
      case 'wait':
        return await this.wait(action.config);
      default:
        throw new Error(`Unknown action type: ${action.type}`);
    }
  }

  /**
   * Send email action
   */
  private async sendEmail(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<void> {
    const to = this.interpolateTemplate(config.to, context);
    const subject = this.interpolateTemplate(config.subject, context);
    const body = this.interpolateTemplate(config.body, context);

    await sendOrderConfirmationEmail({
      to,
      subject,
      body,
      // ... other email params
    } as any);
  }

  /**
   * Send SMS action
   */
  private async sendSMS(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<void> {
    const to = this.interpolateTemplate(config.to, context);
    const message = this.interpolateTemplate(config.message, context);

    await sendOrderConfirmationSMS(to, message, '', '');
  }

  /**
   * Update order status action
   */
  private async updateOrderStatus(
    config: Record<string, any>,
    context: Record<string, any>
  ): Promise<void> {
    const orderId = context.order?.id || context.orderId;
    if (!orderId) throw new Error('Order ID not found in context');

    await supabaseClient
      .from('orders')
      .update({ status: config.status })
      .eq('id', orderId);
  }

  /**
   * Wait/delay action
   */
  private async wait(config: Record<string, any>): Promise<void> {
    const ms = config.duration * 60 * 1000; // Convert minutes to ms
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Template interpolation (replace {{field}} with actual values)
   */
  private interpolateTemplate(template: string, context: Record<string, any>): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(context, path.trim());
      return value !== undefined ? String(value) : match;
    });
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
    await supabaseClient
      .from('workflow_executions')
      .update({
        status,
        completed_at: new Date().toISOString(),
        execution_time_ms: executionTimeMs,
        actions_executed: actionsExecuted,
        error_message: errorMessage,
      })
      .eq('id', executionId);
  }
}

// Singleton instance
export const workflowEngine = new WorkflowEngine();
```

---

## API Routes Design

### 1. GET /api/workflows (List workflows)

**File**: `/app/api/workflows/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getWorkflows } from '@/lib/services/workflows';
import { supabaseClient } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await getWorkflows(user.id);

    return NextResponse.json({ workflows });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflows' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    const workflow = await createWorkflow({
      ...body,
      shop_id: user.id,
      created_by: user.id,
    });

    return NextResponse.json({ workflow }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
```

### 2. GET/PUT/DELETE /api/workflows/[id]

**File**: `/app/api/workflows/[id]/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import {
  getWorkflowById,
  updateWorkflow,
  deleteWorkflow
} from '@/lib/services/workflows';
import { supabaseClient } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await getWorkflowById(params.id);

    // Check ownership
    if (workflow.shop_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch workflow' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const workflow = await updateWorkflow(params.id, body);

    return NextResponse.json({ workflow });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await deleteWorkflow(params.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
```

---

## UI/UX Recommendations

### Design Principles

1. **Progressive Disclosure**: Start simple, reveal complexity as needed
2. **Visual Feedback**: Clear indication of drag state, validation errors
3. **Template Variables**: Make it easy to insert dynamic data ({{customer.name}})
4. **Preview/Test**: Allow users to test workflows before activating
5. **Error Handling**: Clear error messages, validation at each step

### User Flow

```
1. Workflows List Page
   ↓ Click "Create Workflow"

2. Choose Template or Start from Scratch
   ↓ Select template (optional)

3. Workflow Builder
   ├── Name & Description
   ├── Select Trigger Event
   ├── Add Conditions (optional)
   └── Add Actions (drag to reorder)
       ├── Click "Add Action"
       ├── Select action type
       ├── Configure action (modal)
       └── Save

4. Preview & Test
   ↓ Test with sample data

5. Save & Activate
   ↓ Workflow is now active
```

### Accessibility

- ✅ Keyboard navigation for all actions
- ✅ ARIA labels for drag & drop
- ✅ Screen reader support
- ✅ High contrast mode support
- ✅ Focus management in modals

### Mobile Considerations

- Use bottom sheets instead of modals on mobile
- Larger touch targets (min 48px)
- Simplified drag & drop (long press to activate)
- Collapsible sections to save space

---

## Implementation Phases

### Phase 1: Foundation (Week 1)

**Goal**: Set up types, service layer, and basic API routes

**Tasks**:
- [ ] Add TypeScript types to `/lib/types/database.ts`
- [ ] Create Zod schemas in `/lib/schemas/workflow.ts`
- [ ] Implement CRUD service in `/lib/services/workflows.ts`
- [ ] Create API routes:
  - `/api/workflows` (GET, POST)
  - `/api/workflows/[id]` (GET, PUT, DELETE)
- [ ] Create custom hooks in `/lib/hooks/useWorkflows.ts`
- [ ] Write unit tests for service layer

**Deliverable**: Backend ready to create/read/update/delete workflows

### Phase 2: Basic UI (Week 2)

**Goal**: Build list-based workflow builder with Framer Motion

**Tasks**:
- [ ] Create workflow list page (`/automation/page.tsx`)
- [ ] Build `WorkflowCanvas` component
- [ ] Implement `TriggerSelector` component
- [ ] Create `ActionList` with Framer Motion Reorder
- [ ] Build `ActionBlock` component (drag handle, edit, delete)
- [ ] Implement `ActionTypeSelector` modal
- [ ] Create basic action config modals:
  - Email config
  - SMS config
  - Status change config

**Deliverable**: Functional workflow builder (list-based)

### Phase 3: Advanced Features (Week 3)

**Goal**: Add conditions, templates, and execution

**Tasks**:
- [ ] Implement `ConditionBuilder` component
- [ ] Create workflow templates service
- [ ] Build templates page
- [ ] Implement workflow execution engine
- [ ] Add "Test Workflow" functionality
- [ ] Create execution logs page
- [ ] Add more action types:
  - Wait/delay
  - Conditional branching
  - Webhook

**Deliverable**: Complete workflow system with templates and execution

### Phase 4: Polish & Testing (Week 4)

**Goal**: Refinement, testing, and documentation

**Tasks**:
- [ ] Add loading states and error handling
- [ ] Implement toast notifications
- [ ] Add confirmation dialogs for destructive actions
- [ ] Write integration tests
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] User documentation
- [ ] Video tutorial (optional)

**Deliverable**: Production-ready workflow builder

### Phase 5 (Optional): Advanced Node-Based Builder

**Goal**: Upgrade to React Flow for complex workflows

**Tasks**:
- [ ] Install @xyflow/react
- [ ] Create node-based canvas
- [ ] Implement custom node types
- [ ] Add branching and parallel execution
- [ ] Migrate existing workflows to new format
- [ ] A/B test with users

**Deliverable**: Advanced visual workflow builder

---

## Code Examples

### Complete Custom Hook Implementation

**File**: `/lib/hooks/useWorkflows.ts`

```typescript
import { useState, useEffect } from 'react';
import type { Workflow, WorkflowInsert, WorkflowUpdate } from '../types/database';

export function useWorkflows(shopId: string) {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/workflows?shop_id=${shopId}`);

        if (!response.ok) throw new Error('Failed to fetch workflows');

        const data = await response.json();
        setWorkflows(data.workflows);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchWorkflows();
    }
  }, [shopId]);

  return { workflows, loading, error, refetch: () => setLoading(true) };
}

export function useWorkflow(id: string) {
  const [workflow, setWorkflow] = useState<Workflow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchWorkflow = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/workflows/${id}`);

        if (!response.ok) throw new Error('Failed to fetch workflow');

        const data = await response.json();
        setWorkflow(data.workflow);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchWorkflow();
    }
  }, [id]);

  return { workflow, loading, error };
}

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

      if (!response.ok) throw new Error('Failed to create workflow');

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

  const updateWorkflow = async (
    id: string,
    data: WorkflowUpdate
  ): Promise<Workflow> => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/workflows/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) throw new Error('Failed to update workflow');

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

      if (!response.ok) throw new Error('Failed to delete workflow');
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
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: active }),
      });

      if (!response.ok) throw new Error('Failed to toggle workflow');

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

  return {
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflow,
    loading,
    error,
  };
}
```

---

## Testing Strategy

### Unit Tests

**Test files**:
- `/lib/services/__tests__/workflows.test.ts`
- `/lib/services/__tests__/workflow-engine.test.ts`
- `/components/workflow-builder/__tests__/ActionList.test.tsx`

**Tools**: Jest, React Testing Library

**Example test**:
```typescript
describe('WorkflowEngine', () => {
  it('should execute workflow successfully', async () => {
    const workflow = {
      id: 'test-id',
      trigger_event: 'order_created',
      actions: [
        { id: '1', type: 'send_email', config: { to: '{{customer.email}}' }, order: 0 },
      ],
    };

    const triggerData = {
      order: { id: 'order-1' },
      customer: { email: 'test@example.com' },
    };

    const result = await workflowEngine.execute(workflow, triggerData);
    expect(result.status).toBe('completed');
  });
});
```

### Integration Tests

Test complete workflows end-to-end:
- Create workflow via API
- Trigger workflow
- Verify execution logs
- Check side effects (emails sent, status updated)

### E2E Tests (Optional)

Use Playwright or Cypress:
- Test drag & drop functionality
- Test workflow creation flow
- Test template usage

---

## Performance Considerations

### Optimization Strategies

1. **Database Indexing**
   - Index on `shop_id`, `trigger_event`, `is_active`
   - Composite index on (`shop_id`, `trigger_event`, `is_active`)

2. **Caching**
   - Cache active workflows in Redis
   - Invalidate on workflow update
   - TTL: 5 minutes

3. **Lazy Loading**
   - Load action config modals on demand
   - Code splitting for React Flow (if used)

4. **Debouncing**
   - Debounce auto-save in builder
   - Debounce search/filter in workflow list

5. **Execution Optimization**
   - Async action execution where possible
   - Batch database operations
   - Use database transactions

### Performance Metrics to Track

- Workflow execution time
- Page load time for builder
- Time to interactive
- Bundle size

---

## References

### Official Documentation
- [React Flow Official Docs](https://reactflow.dev)
- [Framer Motion Reorder Docs](https://www.framer.com/motion/reorder/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)

### Tutorials & Guides
- [React Flow Quick Start](https://reactflow.dev/learn)
- [Drag-to-Reorder with Framer Motion](https://egghead.io/blog/drag-to-reorder-list-items-with-framer-motion)
- [Build Node-Based Workflow Builder](https://gitnation.com/contents/build-and-customize-a-node-based-workflow-builder-with-react)

### Examples
- [React Flow Workflow Editor Template](https://reactflow.dev/ui/templates/workflow-editor)
- [Framer Motion Reorder CodeSandbox](https://codesandbox.io/s/framer-motion-5-drag-to-reorder-lists-uonye)

### UI/UX Best Practices
- [Workflow Builder UI/UX](https://www.workflowbuilder.io/)
- [UX Workflow Guide](https://www.uxpin.com/studio/blog/ux-workflow-guide/)

---

## Conclusion

This research document provides a comprehensive implementation strategy for building a workflow builder in the Shamlai Frontend codebase. The recommended approach is to:

1. **Start with a simple list-based builder** using Framer Motion (Phase 1-2)
2. **Add advanced features** like conditions and templates (Phase 3-4)
3. **Optionally upgrade to React Flow** for complex node-based workflows (Phase 5)

The codebase already has strong foundations with database schemas and workflow execution logic in place. The main work involves building the UI components, service layer, and API routes.

**Next Steps**:
1. Review and approve this implementation plan
2. Begin Phase 1: Foundation (types, services, API routes)
3. Iterate on UI based on user feedback
4. Consider React Flow for advanced use cases

For questions or clarifications, please refer to the specific sections above or consult the referenced documentation.

---

**Document Version**: 1.0
**Last Updated**: 2025-11-22
**Author**: Claude AI Research Agent
