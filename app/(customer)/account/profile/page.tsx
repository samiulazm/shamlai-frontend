'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useState, useEffect } from 'react';
import { User, Mail, Phone, Save, Check } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface CustomerProfile {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  accepts_marketing: boolean;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CustomerProfile>({
    first_name: '',
    last_name: '',
    email: user?.email || '',
    phone: '',
    accepts_marketing: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      loadProfile();
    }
  }, [user]);

  const loadProfile = async () => {
    try {
      setLoading(true);

      const { data: customer } = await insforgeClient.database
        .from('customers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (customer) {
        setProfile({
          first_name: customer.first_name || '',
          last_name: customer.last_name || '',
          email: customer.email || user?.email || '',
          phone: customer.phone || '',
          accepts_marketing: customer.accepts_marketing || false,
        });
      }

      setLoading(false);
    } catch (err) {
      logger.error('Failed to load profile', err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      // Get customer record
      const { data: customer } = await insforgeClient.database
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) {
        setError('Customer profile not found');
        setSaving(false);
        return;
      }

      // Update customer profile
      const { error: updateError } = await insforgeClient.database
        .from('customers')
        .update({
          first_name: profile.first_name,
          last_name: profile.last_name,
          phone: profile.phone,
          accepts_marketing: profile.accepts_marketing,
          updated_at: new Date().toISOString(),
        })
        .eq('id', customer.id);

      if (updateError) throw updateError;

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      setSaving(false);

      logger.info('Profile updated successfully');
    } catch (err) {
      logger.error('Failed to update profile', err instanceof Error ? err : new Error(String(err)));
      setError('Failed to update profile. Please try again.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p className="text-gray-600 mt-1">Manage your personal information</p>
      </div>

      {/* Profile Form */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {saved && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-600">Profile updated successfully!</p>
            </div>
          )}

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                First Name
              </label>
              <input
                type="text"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="inline w-4 h-4 mr-2" />
                Last Name
              </label>
              <input
                type="text"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Mail className="inline w-4 h-4 mr-2" />
              Email Address
            </label>
            <input
              type="email"
              value={profile.email}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 cursor-not-allowed"
              disabled
            />
            <p className="text-xs text-gray-500 mt-1">
              Email address cannot be changed. Contact support if you need to update it.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="inline w-4 h-4 mr-2" />
              Phone Number
            </label>
            <input
              type="tel"
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>

          {/* Marketing Preferences */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Email Preferences</h3>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={profile.accepts_marketing}
                onChange={(e) =>
                  setProfile({ ...profile, accepts_marketing: e.target.checked })
                }
                className="mt-1 w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <div>
                <p className="font-medium text-gray-900">
                  Receive marketing emails
                </p>
                <p className="text-sm text-gray-600">
                  Get updates about new products, special offers, and exclusive deals.
                </p>
              </div>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-2">Account Information</h3>
        <div className="text-sm text-gray-600 space-y-1">
          <p>User ID: {user?.id}</p>
          <p>Account created: {user ? 'Recently' : 'N/A'}</p>
        </div>
      </div>
    </div>
  );
}
