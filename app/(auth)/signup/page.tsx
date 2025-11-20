'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';
import { normalizeSubdomain } from '@/lib/services/shop';

export default function Signup() {
  const router = useRouter();
  const [shopName, setShopName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [subdomainNormalized, setSubdomainNormalized] = useState('');
  const [subdomainStatus, setSubdomainStatus] = useState<
    'idle' | 'checking' | 'available' | 'unavailable'
  >('idle');
  const [subdomainError, setSubdomainError] = useState<string>('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateSubdomain = async (value: string): Promise<boolean> => {
    const normalized = normalizeSubdomain(value);
    setSubdomainNormalized(normalized);
    setSubdomainError('');
    if (!normalized) {
      setSubdomainStatus('idle');
      return false;
    }
    setSubdomainStatus('checking');

    try {
      const response = await fetch(
        `/api/subdomain/check?subdomain=${encodeURIComponent(normalized)}`
      );
      const data = await response.json();

      if (!response.ok || data.error) {
        setSubdomainError(data.error || 'Failed to check subdomain availability');
        setSubdomainStatus('idle');
        return false;
      }

      const available = data.available;
      setSubdomainStatus(available ? 'available' : 'unavailable');
      if (!available) {
        setSubdomainError('This subdomain is taken. Please choose another.');
      }
      return available;
    } catch (error) {
      logger.error(
        'Subdomain validation error',
        error instanceof Error ? error : new Error(String(error))
      );
      setSubdomainError('Failed to check subdomain availability. Please try again.');
      setSubdomainStatus('idle');
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Guard: require subdomain and availability
    const normalized = normalizeSubdomain(subdomain || shopName || email.split('@')[0] || 'shop');
    const available = await validateSubdomain(normalized);
    if (!available) {
      setLoading(false);
      return;
    }

    try {
      // Use API proxy route to avoid mixed content issues (HTTPS -> HTTP)
      const signupResponse = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const signupData = await signupResponse.json();

      if (!signupResponse.ok) {
        setError(signupData.error || 'Failed to create account');
        setLoading(false);
        return;
      }

      // If signup was successful, create shop settings
      if (signupData.user || signupData.data?.user) {
        const user = signupData.user || signupData.data?.user;
        const accessToken = signupData.accessToken || signupData.data?.accessToken;
        console.log('✅ Account created!', user);

        const userId = user.id;

        if (!userId || !accessToken) {
          setError('Account created but missing user ID or access token');
          setLoading(false);
          return;
        }

        // Call centralized shop creation endpoint
        try {
          const shopResponse = await fetch('/api/auth/complete-signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              userId,
              shopName: shopName || 'My Shop',
              subdomain: normalized,
              email,
              accessToken,
            }),
          });

          const shopData = await shopResponse.json();

          if (!shopResponse.ok) {
            setError(shopData.error || 'Failed to create shop settings');
            setLoading(false);
            return;
          }

          console.log('✅ Shop created!', shopData);

          // Redirect to dashboard only after both user and shop are created
          router.push('/dashboard');
        } catch (shopError) {
          logger.error(
            'Shop creation error',
            shopError instanceof Error ? shopError : new Error(String(shopError))
          );
          setError('Failed to create shop. Please contact support.');
          setLoading(false);
          return;
        }
      } else {
        setError('Account created but user data not received');
        setLoading(false);
      }
    } catch (err: any) {
      logger.error('Signup error', err instanceof Error ? err : new Error(String(err)));

      let errorMessage = err.message || 'An error occurred during signup';

      // Provide more specific error messages
      if (
        errorMessage.includes('fetch') ||
        errorMessage.includes('Failed to fetch') ||
        errorMessage.includes('network')
      ) {
        errorMessage =
          'Network error: Cannot connect to backend server. Please check your internet connection and backend configuration.';
      } else if (errorMessage.includes('CORS')) {
        errorMessage = 'CORS error: Backend is not configured to accept requests from this domain.';
      }

      setError(errorMessage);
      setLoading(false);
    }
  };

  const handleOAuthSignup = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const { data, error } = await insforgeClient.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/dashboard',
        skipBrowserRedirect: true,
      });

      if (error) {
        setError(error.message || `Failed to sign up with ${provider}`);
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'OAuth signup failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="card w-full max-w-md shadow-lg">
        <div className="card-pad">
          <h1 className="text-2xl font-bold text-center mb-2">Create your Shamlai account</h1>
          <p className="text-sm text-gray-600 text-center mb-6">Start selling online in minutes</p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label">Shop Name</label>
              <input
                className="input"
                placeholder="e.g., My Awesome Shop"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Subdomain</label>
              <div className="flex items-center gap-2">
                <input
                  className="input flex-1"
                  placeholder="your-shop"
                  value={subdomain}
                  onChange={async (e) => {
                    setSubdomain(e.target.value);
                    await validateSubdomain(e.target.value);
                  }}
                  onBlur={async () => {
                    await validateSubdomain(subdomain || shopName);
                  }}
                  required
                  disabled={loading}
                />
                <span className="text-sm text-gray-600 whitespace-nowrap">
                  .{process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
                </span>
              </div>
              {subdomainNormalized && (
                <p className="text-xs text-gray-500 mt-1">
                  Will be: {subdomainNormalized}.
                  {process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'yourdomain.com'}
                </p>
              )}
              {subdomainStatus === 'checking' && (
                <p className="text-xs text-gray-500 mt-1">Checking availability...</p>
              )}
              {subdomainStatus === 'available' && (
                <p className="text-xs text-green-600 mt-1">Available</p>
              )}
              {subdomainStatus === 'unavailable' && (
                <p className="text-xs text-red-600 mt-1">{subdomainError}</p>
              )}
            </div>
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                disabled={loading}
              />
              <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or sign up with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthSignup('google')}
              disabled={loading}
              className="btn border border-gray-300 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>
            <button
              type="button"
              onClick={() => handleOAuthSignup('github')}
              disabled={loading}
              className="btn border border-gray-300 bg-white hover:bg-gray-50"
            >
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              GitHub
            </button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link className="text-indigo-600 font-semibold hover:underline" href="/login">
                Log in
              </Link>
            </p>
          </div>

          <div className="mt-4 text-xs text-gray-500 text-center">
            By signing up, you agree to our Terms of Service and Privacy Policy
          </div>
        </div>
      </div>
    </div>
  );
}
