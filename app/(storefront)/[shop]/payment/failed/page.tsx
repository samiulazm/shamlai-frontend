'use client';

import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';

export default function PaymentFailed() {
  const params = useParams();
  const searchParams = useSearchParams();
  const shopId = params.shop as string;
  const orderId = searchParams.get('order_id');
  const error = searchParams.get('error');

  const getErrorMessage = () => {
    switch (error) {
      case 'verification_failed':
        return 'Payment verification failed. Please try again or contact support.';
      case 'missing_parameters':
        return 'Required payment information is missing.';
      case 'internal_error':
        return 'An internal error occurred during payment processing.';
      default:
        return 'Your payment could not be processed at this time.';
    }
  };

  return (
    <div className="container-responsive py-10">
      <div className="max-w-2xl mx-auto">
        {/* Error Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-4">
            <svg
              className="w-12 h-12 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-gray-600">{getErrorMessage()}</p>
        </div>

        {/* Error Details Card */}
        <div className="card mb-6 border-red-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-red-900">What Went Wrong?</h2>
            <p className="text-gray-600 mb-4">
              Your payment could not be completed. Common reasons include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
              <li>Insufficient funds in your account</li>
              <li>Payment gateway connection issues</li>
              <li>Invalid or expired payment details</li>
              <li>Bank declined the transaction</li>
              <li>Technical issues during processing</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-900">No charges were made</p>
                  <p className="text-sm text-red-700 mt-1">
                    Your account was not charged. You can safely try again or use a different
                    payment method.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="card mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">What Can You Do?</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    1
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium">Try Again</p>
                  <p className="text-sm text-gray-600">
                    Return to checkout and attempt the payment again
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    2
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium">Use Different Payment Method</p>
                  <p className="text-sm text-gray-600">
                    Try using a different payment method or account
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    3
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium">Check Your Account</p>
                  <p className="text-sm text-gray-600">
                    Verify you have sufficient funds and your payment details are correct
                  </p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-8 w-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                    4
                  </div>
                </div>
                <div className="ml-4">
                  <p className="font-medium">Contact Support</p>
                  <p className="text-sm text-gray-600">
                    If the problem persists, reach out to our support team for assistance
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order Information */}
        {orderId && (
          <div className="card mb-6 bg-gray-50">
            <div className="p-6">
              <h3 className="font-semibold mb-2">Order Reference</h3>
              <p className="text-sm text-gray-600">
                Order ID: <span className="font-mono font-medium">{orderId}</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Keep this reference number for support inquiries
              </p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/${shopId}/checkout`}
            className="btn btn-primary flex-1 text-center"
          >
            Try Payment Again
          </Link>
          <Link href={`/${shopId}/cart`} className="btn btn-outline flex-1 text-center">
            Review Cart
          </Link>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm mb-2">Still having issues?</p>
          <Link href="#" className="text-blue-600 hover:underline font-medium">
            Contact Customer Support
          </Link>
        </div>
      </div>
    </div>
  );
}
