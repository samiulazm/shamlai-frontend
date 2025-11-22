'use client';

import { Mail, MessageSquare, RefreshCw, Bell, Clock, Webhook as WebhookIcon } from 'lucide-react';
import Modal from '@/components/common/Modal';
import type { ActionType } from '@/lib/types/database';

interface ActionTypeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: ActionType) => void;
}

const ACTION_TYPES = [
  {
    type: 'send_email' as ActionType,
    label: 'Send Email',
    description: 'Send an email to customer or team',
    icon: Mail,
    color: 'bg-blue-100 text-blue-600',
  },
  {
    type: 'send_sms' as ActionType,
    label: 'Send SMS',
    description: 'Send SMS notification to customer',
    icon: MessageSquare,
    color: 'bg-green-100 text-green-600',
  },
  {
    type: 'update_order_status' as ActionType,
    label: 'Update Order Status',
    description: 'Change the status of an order',
    icon: RefreshCw,
    color: 'bg-purple-100 text-purple-600',
  },
  {
    type: 'send_notification' as ActionType,
    label: 'Send Notification',
    description: 'Create in-app notification',
    icon: Bell,
    color: 'bg-yellow-100 text-yellow-600',
  },
  {
    type: 'wait' as ActionType,
    label: 'Wait / Delay',
    description: 'Pause before next action',
    icon: Clock,
    color: 'bg-gray-100 text-gray-600',
  },
  {
    type: 'webhook' as ActionType,
    label: 'Call Webhook',
    description: 'Send data to external API',
    icon: WebhookIcon,
    color: 'bg-orange-100 text-orange-600',
  },
];

export function ActionTypeSelector({ isOpen, onClose, onSelect }: ActionTypeSelectorProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Choose Action Type" size="lg">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {ACTION_TYPES.map((actionType) => {
          const Icon = actionType.icon;

          return (
            <button
              key={actionType.type}
              onClick={() => onSelect(actionType.type)}
              className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-600 hover:bg-indigo-50 text-left transition-all group"
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${actionType.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900 group-hover:text-indigo-600">
                    {actionType.label}
                  </div>
                  <div className="text-sm text-gray-600 mt-0.5">{actionType.description}</div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
