'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function PaymentCancel() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.shop as string;
  const orderId = searchParams.get('order_id');

  return (
    <div className="container-responsive py-10">
      <div className="max-w-2xl mx-auto">
        {/* Cancel Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-yellow-100 mb-4">
            <svg
              className="w-12 h-12 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Cancelled</h1>
          <p className="text-gray-600">
            You have cancelled the payment process. Your order has not been confirmed.
          </p>
        </div>

        {/* Information Card */}
        <div className="card mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">What Happened?</h2>
            <p className="text-gray-600 mb-4">
              The payment process was cancelled before completion. This could be because:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
              <li>You clicked the cancel or back button</li>
              <li>You closed the payment window</li>
              <li>You chose not to complete the payment</li>
            </ul>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-900">Your order is still pending</p>
                  <p className="text-sm text-blue-700 mt-1">
                    If you want to complete your order, you can try the payment again by going back
                    to the checkout page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">What Would You Like to Do?</h2>
            <div className="space-y-3">
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <p className="font-medium">Try Payment Again</p>
                  <p className="text-sm text-gray-600">
                    Go back to the checkout page and complete your payment
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <p className="font-medium">Review Your Cart</p>
                  <p className="text-sm text-gray-600">
                    Make changes to your cart before proceeding to checkout
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <svg
                  className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
                <div>
                  <p className="font-medium">Continue Shopping</p>
                  <p className="text-sm text-gray-600">
                    Browse more products and add them to your cart
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${shopId}/checkout`}
            className="btn btn-primary flex-1 text-center"
          >
            Try Payment Again
          </Link>
          <Link href={`/${shopId}/cart`} className="btn btn-outline flex-1 text-center">
            View Cart
          </Link>
          <Link href={`/${shopId}`} className="btn btn-outline flex-1 text-center">
            Continue Shopping
          </Link>
        </div>

        {/* Need Help */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>
            Need help?{' '}
            <Link href="#" className="text-blue-600 hover:underline">
              Contact Support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
