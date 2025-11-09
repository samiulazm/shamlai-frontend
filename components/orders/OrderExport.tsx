'use client';

import { useState, useEffect, useCallback } from 'react';
import { Download, FileText, X } from 'lucide-react';
import { logger } from '@/lib/utils/logger';

interface ExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  includeFields: string[];
  dateRange?: { start: Date; end: Date };
}

interface OrderExportProps {
  orders: any[];
  onClose?: () => void;
}

export default function OrderExport({ orders, onClose }: OrderExportProps) {
  const [exporting, setExporting] = useState(false);
  const [options, setOptions] = useState<ExportOptions>({
    format: 'csv',
    includeFields: ['order_number', 'date', 'customer', 'status', 'total'],
  });

  const exportToCSV = useCallback(() => {
    const headers = options.includeFields.map((field) => {
      const fieldMap: Record<string, string> = {
        order_number: 'Order Number',
        date: 'Date',
        customer: 'Customer',
        status: 'Status',
        total: 'Total',
        payment_status: 'Payment Status',
        delivery_method: 'Delivery Method',
      };
      return fieldMap[field] || field;
    });

    const rows = orders.map((order) => {
      return options.includeFields.map((field) => {
        switch (field) {
          case 'order_number':
            return order.order_number || `#${order.id.slice(-8)}`;
          case 'date':
            return new Date(order.created_at).toLocaleDateString();
          case 'customer':
            return order.customer_email || '';
          case 'status':
            return order.status;
          case 'total':
            return order.total || 0;
          case 'payment_status':
            return order.payment_status || '';
          case 'delivery_method':
            return (order as any).delivery_method || '';
          default:
            return '';
        }
      });
    });

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [orders, options]);

  const handleExport = async () => {
    try {
      setExporting(true);

      switch (options.format) {
        case 'csv':
          exportToCSV();
          break;
        case 'excel':
          // Excel export would use a library like xlsx
          alert('Excel export coming soon!');
          break;
        case 'pdf':
          // PDF export would use a library like jsPDF
          alert('PDF export coming soon!');
          break;
      }

      if (onClose) {
        setTimeout(() => onClose(), 1000);
      }
    } catch (error) {
      logger.error(
        'Error exporting orders',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error exporting orders');
    } finally {
      setExporting(false);
    }
  };

  const availableFields = [
    { id: 'order_number', label: 'Order Number' },
    { id: 'date', label: 'Date' },
    { id: 'customer', label: 'Customer' },
    { id: 'status', label: 'Status' },
    { id: 'payment_status', label: 'Payment Status' },
    { id: 'total', label: 'Total' },
    { id: 'delivery_method', label: 'Delivery Method' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Orders
          </h2>
          {onClose && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        <div className="p-6 space-y-6">
          {/* Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Export Format</label>
            <div className="grid grid-cols-3 gap-2">
              {(['csv', 'excel', 'pdf'] as const).map((format) => (
                <button
                  key={format}
                  onClick={() => setOptions({ ...options, format })}
                  className={`px-4 py-2 border rounded-lg text-sm font-medium ${
                    options.format === format
                      ? 'bg-brand-indigo text-white border-brand-indigo'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Fields Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Include Fields</label>
            <div className="grid grid-cols-2 gap-2 border rounded-lg p-4">
              {availableFields.map((field) => (
                <label key={field.id} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={options.includeFields.includes(field.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setOptions({
                          ...options,
                          includeFields: [...options.includeFields, field.id],
                        });
                      } else {
                        setOptions({
                          ...options,
                          includeFields: options.includeFields.filter((f) => f !== field.id),
                        });
                      }
                    }}
                    className="rounded"
                  />
                  <span className="text-sm">{field.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600">
              <div className="font-medium mb-1">Export Summary</div>
              <div>
                Format: <span className="font-medium">{options.format.toUpperCase()}</span>
              </div>
              <div>
                Orders: <span className="font-medium">{orders.length}</span>
              </div>
              <div>
                Fields: <span className="font-medium">{options.includeFields.length}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              onClick={handleExport}
              disabled={exporting || options.includeFields.length === 0}
              className="btn btn-primary flex items-center gap-2 flex-1"
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export Orders'}
            </button>
            {onClose && (
              <button onClick={onClose} className="btn btn-outline">
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
