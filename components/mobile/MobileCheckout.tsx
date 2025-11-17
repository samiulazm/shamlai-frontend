'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronRight, Wallet, MapPin, Package, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

type Step = 'address' | 'payment' | 'review';

interface StepConfig {
  id: Step;
  label: string;
  icon: typeof MapPin;
}

interface MobileCheckoutProps {
  initialStep?: Step;
  onStepChange?: (step: Step) => void;
  onComplete?: () => void;
  children: React.ReactNode;
}

export function MobileCheckout({
  initialStep = 'address',
  onStepChange,
  onComplete,
  children,
}: MobileCheckoutProps) {
  const [currentStep, setCurrentStep] = useState<Step>(initialStep);

  const steps: StepConfig[] = [
    { id: 'address', label: 'Address', icon: MapPin },
    { id: 'payment', label: 'Payment', icon: Wallet },
    { id: 'review', label: 'Review', icon: Package },
  ];

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);

  const goToStep = (step: Step) => {
    setCurrentStep(step);
    onStepChange?.(step);
  };

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      goToStep(steps[nextIndex].id);
    } else {
      onComplete?.();
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(steps[prevIndex].id);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Mobile-optimized progress indicator - Sticky */}
      <div className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-4 py-4">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = step.id === currentStep;
            const isCompleted = index < currentStepIndex;

            return (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  {/* Step Circle */}
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                      'touch-target',
                      isActive && 'border-blue-600 bg-blue-50',
                      isCompleted && 'border-green-600 bg-green-50',
                      !isActive && !isCompleted && 'border-gray-300 bg-white'
                    )}
                  >
                    {isCompleted ? (
                      <Check
                        className={cn('h-5 w-5 text-green-600')}
                      />
                    ) : (
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          isActive && 'text-blue-600',
                          !isActive && !isCompleted && 'text-gray-400'
                        )}
                      />
                    )}
                  </div>

                  {/* Step Label */}
                  <span
                    className={cn(
                      'text-xs mt-1 font-medium',
                      isActive && 'text-blue-600',
                      isCompleted && 'text-green-600',
                      !isActive && !isCompleted && 'text-gray-500'
                    )}
                  >
                    {step.label}
                  </span>
                </div>

                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'h-0.5 w-full -mx-2 mt-[-20px]',
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content area */}
      <div className="container mx-auto px-4 py-4">
        {children}
      </div>

      {/* Fixed bottom CTA - Thumb zone optimized */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t shadow-lg safe-area-bottom">
        <div className="flex gap-3">
          {currentStepIndex > 0 && (
            <Button
              variant="outline"
              size="lg"
              onClick={goToPreviousStep}
              className="flex-1 h-14"
            >
              Back
            </Button>
          )}
          <Button
            size="lg"
            onClick={goToNextStep}
            className="flex-1 h-14 text-lg font-semibold"
          >
            {currentStepIndex === steps.length - 1
              ? 'Place Order'
              : 'Continue'}
            <ChevronRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Checkout Step Content Wrapper
 */
interface CheckoutStepProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function CheckoutStep({ title, description, children }: CheckoutStepProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{title}</h2>
          {description && (
            <p className="text-sm text-gray-600 mt-1">{description}</p>
          )}
        </div>
        <div>{children}</div>
      </CardContent>
    </Card>
  );
}
