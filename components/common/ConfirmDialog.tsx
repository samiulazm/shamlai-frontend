'use client';

import { useState } from 'react';
import { AlertTriangle, X, CheckCircle } from 'lucide-react';

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'info',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const typeStyles = {
    danger: {
      icon: AlertTriangle,
      iconColor: 'text-red-500',
      confirmButton: 'bg-red-600 hover:bg-red-700 text-white',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-yellow-500',
      confirmButton: 'bg-yellow-600 hover:bg-yellow-700 text-white',
    },
    info: {
      icon: CheckCircle,
      iconColor: 'text-blue-500',
      confirmButton: 'bg-blue-600 hover:bg-blue-700 text-white',
    },
  };

  const styles = typeStyles[type];
  const Icon = styles.icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <Icon className={`h-6 w-6 ${styles.iconColor} flex-shrink-0 mt-0.5`} />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
              <p className="text-sm text-gray-600">{message}</p>
            </div>
            <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex gap-2 mt-6 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useConfirmDialog() {
  const [dialog, setDialog] = useState<Omit<ConfirmDialogProps, 'onConfirm' | 'onCancel'> | null>(
    null
  );

  const showDialog = (
    title: string,
    message: string,
    options?: {
      confirmText?: string;
      cancelText?: string;
      type?: 'danger' | 'warning' | 'info';
    }
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        confirmText: options?.confirmText,
        cancelText: options?.cancelText,
        type: options?.type,
        onConfirm: () => {
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          setDialog(null);
          resolve(false);
        },
      } as any);
    });
  };

  const DialogComponent = dialog ? (
    <ConfirmDialog
      {...dialog}
      onConfirm={() => {
        (dialog as any).onConfirm();
      }}
      onCancel={() => {
        (dialog as any).onCancel();
      }}
    />
  ) : null;

  return {
    showDialog,
    DialogComponent,
  };
}
