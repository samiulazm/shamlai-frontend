'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PaymentMethodSelector, PaymentMethod } from './PaymentMethodSelector';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  orderId: string;
  orderAmount: number;
  paymentMethods: PaymentMethod[];
  onSuccess?: (transactionId: string) => void;
  onError?: (error: string) => void;
}

export function PaymentForm({
  orderId,
  orderAmount,
  paymentMethods,
  onSuccess,
  onError,
}: Props) {
  const router = useRouter();
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    setIsProcessing(true);

    try {
      const selectedPaymentMethod = paymentMethods.find(
        (m) => m.id === selectedMethod
      );

      if (!selectedPaymentMethod) {
        throw new Error('Invalid payment method');
      }

      // If Cash on Delivery, just confirm the order
      if (selectedPaymentMethod.type === 'cod') {
        // Call API to confirm COD order
        const response = await fetch('/api/orders/confirm-cod', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        if (!response.ok) {
          throw new Error('Failed to confirm order');
        }

        toast.success('Order confirmed! Pay when you receive your items.');
        router.push(`/orders/${orderId}/success`);
        return;
      }

      // For mobile wallets/cards, initiate payment gateway
      const response = await fetch('/api/payments/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          paymentMethodId: selectedMethod,
          paymentMethod: selectedPaymentMethod.type,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Payment initiation failed');
      }

      if (!data.gatewayUrl) {
        throw new Error('Invalid payment gateway response');
      }

      // Redirect to payment gateway
      toast.success('Redirecting to payment gateway...');

      if (onSuccess) {
        onSuccess(data.transactionId);
      }

      // Redirect to gateway
      window.location.href = data.gatewayUrl;
    } catch (error) {
      console.error('Payment error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Payment failed';

      toast.error(errorMessage);

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethodSelector
            methods={paymentMethods}
            selectedMethod={selectedMethod}
            onMethodChange={setSelectedMethod}
            orderAmount={orderAmount}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => router.back()}
          disabled={isProcessing}
          className="flex-1"
        >
          Back
        </Button>
        <Button
          size="lg"
          onClick={handlePayment}
          disabled={!selectedMethod || isProcessing}
          className="flex-1"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            `Pay ৳${orderAmount.toLocaleString('en-BD')}`
          )}
        </Button>
      </div>

      {/* Security Badge */}
      <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
        <span>Your payment information is secure and encrypted</span>
      </div>
    </div>
  );
}
