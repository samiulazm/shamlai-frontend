'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

export default function DemoPage() {
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const loginWithDemoAccount = async () => {
      try {
        setStatus('loading');
        
        // Always log out first to ensure we're using the demo account
        console.log('🔓 Logging out current session...');
        await insforgeClient.auth.signOut();

        // Auto-login with demo credentials
        console.log('🔐 Logging in with demo account...');
        const { data, error: authError } = await insforgeClient.auth.signInWithPassword({
          email: 'test@shamlai.com',
          password: 'Test123456!'
        });

        if (authError) {
          logger.error('Demo login failed', authError instanceof Error ? authError : new Error(String(authError)));
          setError(authError.message || 'Failed to login with demo account');
          setStatus('error');
          return;
        }

        if (data?.user) {
          console.log('✅ Demo login successful!', data.user);
          setStatus('success');
          
          // Redirect to demo shop storefront after a brief delay
          const shopId = data.user.id;
          setTimeout(() => {
            router.push(`/${shopId}`);
          }, 800);
        }
      } catch (err: any) {
        logger.error('Unexpected error during demo login', err instanceof Error ? err : new Error(String(err)));
        setError(err.message || 'An unexpected error occurred');
        setStatus('error');
      }
    };

    loginWithDemoAccount();
  }, [router]);

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="card w-full max-w-md shadow-xl">
        <div className="card-pad text-center">
          {status === 'loading' && (
            <>
              <div className="mb-6">
                <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-600"></div>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Loading Demo...
              </h1>
              <p className="text-gray-600">
                Logging you in with the demo account
              </p>
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium">Demo Credentials</p>
                <p className="text-xs text-blue-700 mt-1">Email: test@shamlai.com</p>
                <p className="text-xs text-blue-700">Password: Test123456!</p>
              </div>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mb-6">
                <svg 
                  className="inline-block h-16 w-16 text-green-500" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Success!
              </h1>
              <p className="text-gray-600 mb-4">
                Redirecting to demo shop...
              </p>
              <div className="animate-pulse">
                <div className="h-2 bg-indigo-600 rounded-full w-3/4 mx-auto"></div>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mb-6">
                <svg 
                  className="inline-block h-16 w-16 text-red-500" 
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
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Demo Login Failed
              </h1>
              <p className="text-red-600 mb-6">
                {error}
              </p>
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  The demo account may not exist yet. Please create it first:
                </p>
                
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-left">
                  <p className="text-xs font-mono text-gray-800 mb-2">
                    npx tsx scripts/create-test-user.ts
                  </p>
                  <p className="text-xs text-gray-600">
                    Or visit the signup page to create the account manually.
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <Link 
                    href="/signup" 
                    className="btn btn-primary flex-1"
                  >
                    Create Account
                  </Link>
                  <Link 
                    href="/login" 
                    className="btn border border-gray-300 bg-white hover:bg-gray-50 flex-1"
                  >
                    Manual Login
                  </Link>
                </div>
              </div>
            </>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This demo account is for testing purposes only
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

