'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { insforgeClient } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";

export default function UpdatePassword() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    const checkToken = async () => {
      const { data } = await insforgeClient.auth.getCurrentUser();
      if (data) {
        setValidToken(true);
      } else {
        setError('Invalid or expired reset link');
      }
    };
    checkToken();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await insforgeClient.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message || 'Failed to update password');
        setLoading(false);
        return;
      }

      // Redirect to login
      router.push('/login?message=Password updated successfully');
    } catch (err: any) {
      logger.error('Password update error', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  if (!validToken && !error) {
    return (
      <div className="min-h-screen grid place-items-center bg-gray-50">
        <div className="card w-full max-w-md shadow-lg">
          <div className="card-pad text-center">
            <p className="text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="card w-full max-w-md shadow-lg">
        <div className="card-pad">
          <h1 className="text-2xl font-bold text-center mb-2">Update Password</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter your new password
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {validToken && (
            <form onSubmit={handleSubmit} className="grid gap-4">
              <div>
                <label className="label">New Password</label>
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
              <div>
                <label className="label">Confirm Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                  disabled={loading}
                />
              </div>
              <button
                className="btn btn-primary w-full"
                type="submit"
                disabled={loading}
              >
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
