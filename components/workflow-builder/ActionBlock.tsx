'use client';

import { GripVertical, Edit, Trash2, Mail, MessageSquare, RefreshCw, Bell, Clock, Webhook as WebhookIcon } from 'lucide-react';
import { useState } from 'react';
import { EmailConfig } from './ActionConfig/EmailConfig';
import { SMSConfig } from './ActionConfig/SMSConfig';
import { StatusChangeConfig } from './ActionConfig/StatusChangeConfig';
import Modal from '@/components/common/Modal';
import type { WorkflowAction } from '@/lib/types/database';

interface ActionBlockProps {
  action: WorkflowAction;
  index: number;
  totalActions: number;
  onEdit: (id: string, config: Record<string, any>) => void;
  onDelete: (id: string) => void;
}

const ACTION_ICONS: Record<string, any> = {
  send_email: Mail,
  send_sms: MessageSquare,
  update_order_status: RefreshCw,
  send_notification: Bell,
  wait: Clock,
  webhook: WebhookIcon,
};

const ACTION_LABELS: Record<string, string> = {
  send_email: 'Send Email',
  send_sms: 'Send SMS',
  update_order_status: 'Update Order Status',
  send_notification: 'Send Notification',
  wait: 'Wait',
  webhook: 'Call Webhook',
};

const ACTION_COLORS: Record<string, string> = {
  send_email: 'bg-blue-100 text-blue-600',
  send_sms: 'bg-green-100 text-green-600',
  update_order_status: 'bg-purple-100 text-purple-600',
  send_notification: 'bg-yellow-100 text-yellow-600',
  wait: 'bg-gray-100 text-gray-600',
  webhook: 'bg-orange-100 text-orange-600',
};

export function ActionBlock({ action, index, totalActions, onEdit, onDelete }: ActionBlockProps) {
  const [showConfig, setShowConfig] = useState(false);
  const Icon = ACTION_ICONS[action.type] || Bell;
  const color = ACTION_COLORS[action.type] || 'bg-gray-100 text-gray-600';

  const getActionSummary = () => {
    const config = action.config;

    switch (action.type) {
      case 'send_email':
        return config.subject || 'Not configured';
      case 'send_sms':
        return config.message ? `${config.message.substring(0, 50)}...` : 'Not configured';
      case 'update_order_status':
        return config.status || 'Not configured';
      case 'send_notification':
        return config.title || 'Not configured';
      case 'wait':
        return config.duration ? `${config.duration} ${config.unit || 'minutes'}` : 'Not configured';
      case 'webhook':
        return config.url || 'Not configured';
      default:
        return 'Configure this action';
    }
  };

  const isConfigured = () => {
    const config = action.config;
    if (!config || Object.keys(config).length === 0) return false;

    switch (action.type) {
      case 'send_email':
        return !!config.subject && !!config.body;
      case 'send_sms':
        return !!config.message;
      case 'update_order_status':
        return !!config.status;
      case 'send_notification':
        return !!config.message;
      case 'wait':
        return !!config.duration;
      case 'webhook':
        return !!config.url;
      default:
        return true;
    }
  };

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
            onCancel={() => setShowConfig(false)}
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
            onCancel={() => setShowConfig(false)}
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
            onCancel={() => setShowConfig(false)}
          />
        );
      default:
        return (
          <div>
            <p className="text-sm text-gray-600 mb-4">Configuration for {ACTION_LABELS[action.type]} coming soon...</p>
            <button
              onClick={() => setShowConfig(false)}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        );
    }
  };

  const configured = isConfigured();

  return (
    <>
      <div className="bg-white border rounded-lg p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-all group">
        <div className="flex items-center gap-3">
          {/* Drag Handle */}
          <div className="flex-shrink-0">
            <GripVertical className="h-5 w-5 text-gray-400 group-hover:text-gray-600" />
          </div>

          {/* Step Number */}
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
              {index + 1}
            </div>
          </div>

          {/* Icon */}
          <div className={`p-2 rounded-lg ${color} flex-shrink-0`}>
            <Icon className="h-5 w-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900">{ACTION_LABELS[action.type]}</div>
            <div className="text-sm text-gray-600 truncate">{getActionSummary()}</div>
          </div>

          {/* Status Badge */}
          {!configured && (
            <div className="flex-shrink-0">
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded">
                Not Configured
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowConfig(true)}
              className="p-2 hover:bg-gray-100 rounded transition-colors"
              title="Configure"
            >
              <Edit className="h-4 w-4 text-gray-600" />
            </button>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to delete this action?')) {
                  onDelete(action.id);
                }
              }}
              className="p-2 hover:bg-red-50 rounded transition-colors"
              title="Delete"
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
