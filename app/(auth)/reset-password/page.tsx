'use client';

import Link from 'next/link';
import { useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

export default function ResetPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const { error: resetError } = await supabaseClient.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email');
        setLoading(false);
        return;
      }

      setSuccess(true);
      setLoading(false);
    } catch (err: any) {
      logger.error('Password reset error', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="card w-full max-w-md shadow-lg">
        <div className="card-pad">
          <h1 className="text-2xl font-bold text-center mb-2">Reset Password</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter your email to receive a password reset link
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">
                Password reset email sent! Check your inbox for the reset link.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading || success}
              />
            </div>
            <button className="btn btn-primary w-full" type="submit" disabled={loading || success}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Remember your password?{' '}
              <Link className="text-indigo-600 font-semibold hover:underline" href="/login">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
