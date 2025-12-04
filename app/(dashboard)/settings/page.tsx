'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
import * as ShopService from '@/lib/services/shop';
import { logger } from '@/lib/utils/logger';
import type { ShopSettings } from '@/lib/types/database';

export default function Settings() {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    timezone: 'Asia/Dhaka',
    currency: 'BDT',
    language: 'en',
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      const shopSettings = await ShopService.getShopSettings(user.id);

      if (shopSettings) {
        setSettings(shopSettings);
        setFormData({
          timezone: shopSettings.timezone || 'Asia/Dhaka',
          currency: shopSettings.currency || 'BDT',
          language: shopSettings.language || 'en',
        });
      }
    } catch (err: any) {
      logger.error('Error fetching settings', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Update shop settings
      const updatedSettings = await ShopService.upsertShopSettings(user.id, {
        timezone: formData.timezone,
        currency: formData.currency,
        language: formData.language,
      });

      setSettings(updatedSettings);
      setSuccess('Settings saved successfully!');

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      logger.error('Error saving settings', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Settings</h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-pad grid gap-3">
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="label">Timezone</label>
                <select
                  className="input"
                  value={formData.timezone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, timezone: e.target.value }))}
                  disabled={saving}
                >
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>
              <div>
                <label className="label">Currency</label>
                <select
                  className="input"
                  value={formData.currency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, currency: e.target.value }))}
                  disabled={saving}
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>
              <div>
                <label className="label">Language</label>
                <select
                  className="input"
                  value={formData.language}
                  onChange={(e) => setFormData((prev) => ({ ...prev, language: e.target.value }))}
                  disabled={saving}
                >
                  <option value="en">English</option>
                  <option value="bn">Bangla</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
