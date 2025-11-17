'use client';

import { useState } from 'react';
import Image from 'next/image';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Check, CreditCard, Wallet, Banknote } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cod' | 'bkash' | 'nagad' | 'rocket' | 'card';
  provider?: string;
  logo_url?: string;
  description?: string;
  instructions?: string;
  is_active: boolean;
  provider_config?: {
    enabled?: boolean;
    fees?: number;
    min_amount?: number;
    max_amount?: number;
  };
}

interface Props {
  methods: PaymentMethod[];
  selectedMethod?: string;
  onMethodChange: (methodId: string) => void;
  orderAmount?: number;
  className?: string;
}

export function PaymentMethodSelector({
  methods,
  selectedMethod,
  onMethodChange,
  orderAmount = 0,
  className,
}: Props) {
  const [expandedMethod, setExpandedMethod] = useState<string | null>(null);

  // Filter active methods
  const activeMethods = methods.filter((m) => m.is_active);

  // Categorize payment methods
  const mobileWallets = activeMethods.filter((m) =>
    ['bkash', 'nagad', 'rocket'].includes(m.type)
  );
  const otherMethods = activeMethods.filter(
    (m) => !['bkash', 'nagad', 'rocket'].includes(m.type)
  );

  // Check if method is available based on amount limits
  const isMethodAvailable = (method: PaymentMethod): boolean => {
    if (!method.provider_config) return true;

    const { min_amount, max_amount } = method.provider_config;

    if (min_amount && orderAmount < min_amount) return false;
    if (max_amount && orderAmount > max_amount) return false;

    return true;
  };

  // Get payment method icon
  const getIcon = (type: string) => {
    switch (type) {
      case 'bkash':
      case 'nagad':
      case 'rocket':
        return <Wallet className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'cod':
        return <Banknote className="h-5 w-5" />;
      default:
        return <Wallet className="h-5 w-5" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Mobile Wallets Section */}
      {mobileWallets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-900">
              Mobile Wallets
            </h3>
            <span className="text-xs text-gray-500">Fast & Secure</span>
          </div>

          <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {mobileWallets.map((method) => {
                const isSelected = selectedMethod === method.id;
                const isAvailable = isMethodAvailable(method);
                const isExpanded = expandedMethod === method.id;

                return (
                  <div key={method.id} className="relative">
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      disabled={!isAvailable}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={method.id}
                      onClick={() => {
                        if (isAvailable) {
                          setExpandedMethod(isExpanded ? null : method.id);
                        }
                      }}
                      className={cn(
                        'flex flex-col items-center justify-center rounded-lg border-2 bg-white p-4 transition-all cursor-pointer',
                        'hover:border-blue-300 hover:shadow-sm',
                        isSelected &&
                          'border-blue-600 ring-2 ring-blue-600 ring-opacity-50',
                        !isAvailable &&
                          'opacity-50 cursor-not-allowed border-gray-200',
                        isAvailable && !isSelected && 'border-gray-200'
                      )}
                    >
                      {/* Logo or Icon */}
                      {method.logo_url ? (
                        <div className="relative w-16 h-16 mb-2">
                          <Image
                            src={method.logo_url}
                            alt={method.name}
                            fill
                            className="object-contain"
                          />
                        </div>
                      ) : (
                        <div className="mb-2">{getIcon(method.type)}</div>
                      )}

                      {/* Method Name */}
                      <span className="text-sm font-semibold text-gray-900">
                        {method.name}
                      </span>

                      {/* Transaction Fee */}
                      {method.provider_config?.fees && (
                        <span className="text-xs text-gray-500 mt-1">
                          +{method.provider_config.fees}% fee
                        </span>
                      )}

                      {/* Selected Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      )}

                      {/* Unavailable Badge */}
                      {!isAvailable && (
                        <span className="absolute top-2 left-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                          Unavailable
                        </span>
                      )}
                    </Label>

                    {/* Expanded Details */}
                    {isExpanded && isAvailable && (
                      <Card className="mt-2 border-blue-200">
                        <CardContent className="p-3 text-xs space-y-2">
                          {method.description && (
                            <p className="text-gray-700">{method.description}</p>
                          )}
                          {method.instructions && (
                            <p className="text-gray-600">
                              ℹ️ {method.instructions}
                            </p>
                          )}
                          {method.provider_config?.min_amount && (
                            <p className="text-gray-600">
                              Min: ৳{method.provider_config.min_amount}
                            </p>
                          )}
                          {method.provider_config?.max_amount && (
                            <p className="text-gray-600">
                              Max: ৳{method.provider_config.max_amount.toLocaleString()}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* Other Payment Methods */}
      {otherMethods.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Other Payment Methods
          </h3>

          <RadioGroup value={selectedMethod} onValueChange={onMethodChange}>
            <div className="space-y-2">
              {otherMethods.map((method) => {
                const isSelected = selectedMethod === method.id;
                const isAvailable = isMethodAvailable(method);

                return (
                  <div key={method.id}>
                    <RadioGroupItem
                      value={method.id}
                      id={method.id}
                      disabled={!isAvailable}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={method.id}
                      className={cn(
                        'flex items-center justify-between p-4 rounded-lg border-2 bg-white cursor-pointer transition-all',
                        'hover:border-blue-300 hover:shadow-sm',
                        isSelected &&
                          'border-blue-600 ring-2 ring-blue-600 ring-opacity-50',
                        !isAvailable &&
                          'opacity-50 cursor-not-allowed border-gray-200',
                        isAvailable && !isSelected && 'border-gray-200'
                      )}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {/* Icon */}
                        <div className="text-gray-600">{getIcon(method.type)}</div>

                        {/* Method Details */}
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900">
                            {method.name}
                          </div>
                          {method.description && (
                            <div className="text-xs text-gray-600 mt-0.5">
                              {method.description}
                            </div>
                          )}
                        </div>

                        {/* Logo */}
                        {method.logo_url && (
                          <div className="relative w-12 h-12">
                            <Image
                              src={method.logo_url}
                              alt={method.name}
                              fill
                              className="object-contain"
                            />
                          </div>
                        )}

                        {/* Selected Indicator */}
                        {isSelected && (
                          <div className="w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center ml-2">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </Label>

                    {/* Instructions */}
                    {isSelected && method.instructions && (
                      <Card className="mt-2 border-blue-200">
                        <CardContent className="p-3 text-xs text-gray-700">
                          ℹ️ {method.instructions}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>
      )}

      {/* No Methods Available */}
      {activeMethods.length === 0 && (
        <Card>
          <CardContent className="p-6 text-center text-gray-500">
            <Wallet className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No payment methods are currently available.</p>
            <p className="text-sm mt-1">Please contact support for assistance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
