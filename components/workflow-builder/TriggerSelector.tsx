'use client';

import { Zap, ShoppingCart, CreditCard, User, Package, Settings } from 'lucide-react';
import type { TriggerEvent } from '@/lib/types/database';

interface TriggerSelectorProps {
  triggerEvent: TriggerEvent | '';
  setTriggerEvent: (event: TriggerEvent) => void;
}

const TRIGGERS = [
  {
    value: 'order_created' as TriggerEvent,
    label: 'Order Created',
    description: 'When a new order is placed',
    icon: ShoppingCart,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    value: 'order_status_changed' as TriggerEvent,
    label: 'Order Status Changed',
    description: 'When an order status is updated',
    icon: Settings,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    value: 'payment_received' as TriggerEvent,
    label: 'Payment Received',
    description: 'When payment is confirmed',
    icon: CreditCard,
    color: 'bg-green-100 text-green-600',
  },
  {
    value: 'customer_created' as TriggerEvent,
    label: 'Customer Created',
    description: 'When a new customer registers',
    icon: User,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    value: 'product_low_stock' as TriggerEvent,
    label: 'Low Stock Alert',
    description: 'When product inventory is low',
    icon: Package,
    color: 'bg-red-100 text-red-600',
  },
  {
    value: 'custom' as TriggerEvent,
    label: 'Custom Event',
    description: 'Trigger from API or webhook',
    icon: Zap,
    color: 'bg-gray-100 text-gray-600',
  },
];

export function TriggerSelector({ triggerEvent, setTriggerEvent }: TriggerSelectorProps) {
  return (
    <div className="bg-white rounded-lg border p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Zap className="h-5 w-5 text-indigo-600" />
          Trigger Event
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Choose what event will trigger this workflow
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {TRIGGERS.map((trigger) => {
          const Icon = trigger.icon;
          const isSelected = triggerEvent === trigger.value;

          return (
            <button
              key={trigger.value}
              onClick={() => setTriggerEvent(trigger.value)}
              className={`
                p-4 rounded-lg border-2 text-left transition-all
                ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }
              `}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${trigger.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900">{trigger.label}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{trigger.description}</div>
                </div>
                {isSelected && (
                  <div className="flex-shrink-0">
                    <div className="h-5 w-5 bg-indigo-600 rounded-full flex items-center justify-center">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {!triggerEvent && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ Please select a trigger event to continue
          </p>
        </div>
      )}
    </div>
  );
}
