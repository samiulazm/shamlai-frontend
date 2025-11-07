"use client";

import { useEffect, useState } from "react";
import { insforgeClient, ShopService } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";
import type { ShopSettings } from "@/lib/types/database";

export default function SeoMarketing(){
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    meta_title: '',
    meta_description: '',
    facebook_pixel_id: '',
    google_analytics_id: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      const shopSettings = await ShopService.getShopSettings(user.user.id);
      
      if (shopSettings) {
        setSettings(shopSettings);
        setFormData({
          meta_title: shopSettings.meta_title || '',
          meta_description: shopSettings.meta_description || '',
          facebook_pixel_id: shopSettings.facebook_pixel_id || '',
          google_analytics_id: shopSettings.google_analytics_id || ''
        });
      }
    } catch (err: any) {
      logger.error('Error fetching SEO settings', err instanceof Error ? err : new Error(String(err)));
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

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Update shop settings with SEO fields
      const updatedSettings = await ShopService.upsertShopSettings(user.user.id, {
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
        facebook_pixel_id: formData.facebook_pixel_id || undefined,
        google_analytics_id: formData.google_analytics_id || undefined
      });
      
      setSettings(updatedSettings);
      setSuccess('SEO & Marketing settings saved successfully!');
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      logger.error('Error saving SEO settings', err instanceof Error ? err : new Error(String(err)));
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
          <p className="mt-4 text-gray-600">Loading SEO settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">SEO & Marketing</h1>
      
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
            <div>
              <label className="label">Meta Title</label>
              <input 
                className="input" 
                placeholder="Eterni Tees — Premium Streetwear"
                value={formData.meta_title}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_title: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div>
              <label className="label">Meta Description</label>
              <textarea 
                className="input h-24" 
                placeholder="Shop premium urban tees inspired by Dhaka's culture."
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                disabled={saving}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <label className="label">Facebook Pixel ID</label>
                <input 
                  className="input" 
                  placeholder="e.g., 1234567890"
                  value={formData.facebook_pixel_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, facebook_pixel_id: e.target.value }))}
                  disabled={saving}
                />
              </div>
              <div>
                <label className="label">Google Analytics ID</label>
                <input 
                  className="input" 
                  placeholder="e.g., G-XXXXXXX"
                  value={formData.google_analytics_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, google_analytics_id: e.target.value }))}
                  disabled={saving}
                />
              </div>
            </div>
            <button 
              type="submit"
              className="btn btn-primary w-full md:w-auto"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
