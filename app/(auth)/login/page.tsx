'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use API proxy route to avoid mixed content issues (HTTPS -> HTTP)
      const signinResponse = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const signinData = await signinResponse.json();

      if (!signinResponse.ok) {
        setError(signinData.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      // If signin was successful via API, check if we have user data
      const user = signinData.user || signinData.data?.user;
      const accessToken = signinData.accessToken || signinData.session?.access_token;

      if (user) {
        console.log('✅ API login successful!', user);

        // CRITICAL: Also authenticate the client-side SDK so it has the session
        // This is needed because the dashboard checks getCurrentUser() which requires SDK session
        try {
          console.log('🔐 Authenticating client SDK...');
          const { data: sdkData, error: sdkError } = await insforgeClient.auth.signInWithPassword({
            email,
            password,
          });

          if (sdkError) {
            console.warn('⚠️ Client SDK auth failed:', sdkError.message);
            // If SDK auth fails (mixed content), try to manually set the token
            if (accessToken) {
              // Store token in localStorage as fallback
              try {
                localStorage.setItem('insforge_access_token', accessToken);
                console.log('✅ Stored access token in localStorage as fallback');
              } catch (storageErr) {
                console.warn('⚠️ Could not store token:', storageErr);
              }
            }
            // Continue anyway - API auth worked
          } else {
            console.log('✅ Client SDK authenticated successfully!', sdkData?.user);
          }
        } catch (sdkErr: any) {
          console.warn('⚠️ Client SDK auth error (but API auth succeeded):', sdkErr?.message);
          // Try to store token as fallback
          if (accessToken) {
            try {
              localStorage.setItem('insforge_access_token', accessToken);
              console.log('✅ Stored access token in localStorage as fallback');
            } catch (storageErr) {
              // Ignore storage errors
            }
          }
        }

        setLoading(false);

        // Small delay to ensure session is set before redirect
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Redirect to dashboard
        router.push('/dashboard');
      } else {
        setError('Login successful but user data not received');
        setLoading(false);
      }
    } catch (err: any) {
      logger.error('Login error', err instanceof Error ? err : new Error(String(err)));

      let errorMessage = err.message || 'An error occurred during login';

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

  const handleOAuthLogin = async (provider: 'google' | 'github') => {
    try {
      setLoading(true);
      const { data, error } = await insforgeClient.auth.signInWithOAuth({
        provider,
        redirectTo: window.location.origin + '/dashboard',
        skipBrowserRedirect: true,
      });

      if (error) {
        setError(error.message || `Failed to login with ${provider}`);
        setLoading(false);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (err: any) {
      setError(err.message || 'OAuth login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="card w-full max-w-md shadow-lg">
        <div className="card-pad">
          <h1 className="text-2xl font-bold text-center mb-2">Login to Shamlai</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Welcome back! Please enter your details.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="test@shamlai.com"
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
                disabled={loading}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleOAuthLogin('google')}
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
              onClick={() => handleOAuthLogin('github')}
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
              Don't have an account?{' '}
              <Link className="text-indigo-600 font-semibold hover:underline" href="/signup">
                Sign up
              </Link>
            </p>
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-xs text-blue-800 font-semibold mb-1">Test Credentials:</p>
            <p className="text-xs text-blue-700">Email: test@shamlai.com</p>
            <p className="text-xs text-blue-700">Password: Test123456!</p>
            <div className="mt-2 pt-2 border-t border-blue-300">
              <Link href="/demo" className="text-xs text-blue-600 font-semibold hover:underline">
                🚀 Or click here for instant demo access
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
