"use client";

import { useEffect, useState } from "react";
import { insforgeClient, ShopService } from "@/lib";
import { logger } from "@/lib/utils/logger";
import type { ShopSettings } from "@/lib/types/database";

export default function ShopDetails(){
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    shop_name: '',
    shop_email: '',
    shop_phone: '',
    shop_description: '',
    currency: 'BDT',
    timezone: 'Asia/Dhaka',
    weight_unit: 'kg',
    enable_reviews: true,
    enable_wishlists: true,
    enable_guest_checkout: true,
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    tiktok_url: '',
    address1: '',
    address2: '',
    city: '',
    state: '',
    postal_code: '',
    country: ''
  });

  useEffect(() => {
    fetchShopSettings();
  }, []);

  const fetchShopSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop settings
      const shopSettings = await ShopService.getShopSettings(user.user.id);
      
      if (shopSettings) {
        setSettings(shopSettings);
        setFormData({
          shop_name: shopSettings.shop_name || '',
          shop_email: shopSettings.shop_email || '',
          shop_phone: shopSettings.shop_phone || '',
          shop_description: shopSettings.shop_description || '',
          currency: shopSettings.currency || 'BDT',
          timezone: shopSettings.timezone || 'Asia/Dhaka',
          weight_unit: shopSettings.weight_unit || 'kg',
          enable_reviews: shopSettings.enable_reviews ?? true,
          enable_wishlists: shopSettings.enable_wishlists ?? true,
          enable_guest_checkout: shopSettings.enable_guest_checkout ?? true,
          facebook_url: shopSettings.facebook_url || '',
          instagram_url: shopSettings.instagram_url || '',
          twitter_url: shopSettings.twitter_url || '',
          youtube_url: shopSettings.youtube_url || '',
          tiktok_url: shopSettings.tiktok_url || '',
          address1: shopSettings.address1 || '',
          address2: shopSettings.address2 || '',
          city: shopSettings.city || '',
          state: shopSettings.state || '',
          postal_code: shopSettings.postal_code || '',
          country: shopSettings.country || ''
        });
      }
    } catch (err: any) {
      logger.error('Error fetching shop settings', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch shop settings');
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

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Update shop settings
      const updatedSettings = await ShopService.upsertShopSettings(user.user.id, formData);
      
      setSettings(updatedSettings);
      setSuccess('Shop settings saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      logger.error('Error saving shop settings', err instanceof Error ? err : new Error(String(err)));
      
      // Handle specific error cases
      if (err.message?.includes('duplicate key value violates unique constraint')) {
        setError('Shop settings already exist. Please refresh the page and try again.');
      } else if (err.message?.includes('permission denied')) {
        setError('You do not have permission to update shop settings.');
      } else {
        setError(err.message || 'Failed to save shop settings');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading shop settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Shop Details</h1>
      
      {error && (
        <div className="card">
          <div className="card-pad">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              {error.includes('duplicate key value violates unique constraint') && (
                <button 
                  onClick={fetchShopSettings}
                  className="text-sm text-red-700 underline hover:no-underline"
                >
                  Refresh page to load existing settings
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="card">
          <div className="card-pad">
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-600">{success}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave}>
        <div className="card">
          <div className="card-pad grid gap-4 md:grid-cols-2">
            <div className="grid gap-3">
              <div>
                <label className="label">Shop Name</label>
                <input 
                  className="input" 
                  type="text"
                  value={formData.shop_name}
                  onChange={(e) => handleInputChange('shop_name', e.target.value)}
                  placeholder="Your shop name"
                  required
                  disabled={saving}
                />
              </div>
              
              <div>
                <label className="label">Address Line 1</label>
                <input 
                  className="input" 
                  type="text"
                  value={formData.address1}
                  onChange={(e) => handleInputChange('address1', e.target.value)}
                  placeholder="Street address"
                  disabled={saving}
                />
              </div>
              
              <div>
                <label className="label">Contact Email</label>
                <input 
                  className="input" 
                  type="email"
                  value={formData.shop_email}
                  onChange={(e) => handleInputChange('shop_email', e.target.value)}
                  placeholder="hello@yourshop.com"
                  required
                  disabled={saving}
                />
              </div>
              
              <div>
                <label className="label">Phone</label>
                <input 
                  className="input" 
                  type="tel"
                  value={formData.shop_phone}
                  onChange={(e) => handleInputChange('shop_phone', e.target.value)}
                  placeholder="+8801XXXXXXXXX"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea 
                  className="input" 
                  rows={3}
                  value={formData.shop_description}
                  onChange={(e) => handleInputChange('shop_description', e.target.value)}
                  placeholder="Brief description of your shop"
                  disabled={saving}
                />
              </div>
            </div>
            
            <div className="grid gap-3">
              <div>
                <label className="label">Currency</label>
                <select 
                  className="input"
                  value={formData.currency}
                  onChange={(e) => handleInputChange('currency', e.target.value)}
                  disabled={saving}
                >
                  <option value="BDT">BDT (৳)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                </select>
              </div>

              <div>
                <label className="label">Timezone</label>
                <select 
                  className="input"
                  value={formData.timezone}
                  onChange={(e) => handleInputChange('timezone', e.target.value)}
                  disabled={saving}
                >
                  <option value="Asia/Dhaka">Asia/Dhaka</option>
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">America/New_York</option>
                  <option value="Europe/London">Europe/London</option>
                </select>
              </div>

              <div>
                <label className="label">Weight Unit</label>
                <select 
                  className="input"
                  value={formData.weight_unit}
                  onChange={(e) => handleInputChange('weight_unit', e.target.value)}
                  disabled={saving}
                >
                  <option value="kg">Kilograms (kg)</option>
                  <option value="lb">Pounds (lb)</option>
                  <option value="g">Grams (g)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="label">Features</label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={formData.enable_reviews}
                      onChange={(e) => handleInputChange('enable_reviews', e.target.checked)}
                      disabled={saving}
                      className="rounded"
                    />
                    <span className="text-sm">Enable product reviews</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={formData.enable_wishlists}
                      onChange={(e) => handleInputChange('enable_wishlists', e.target.checked)}
                      disabled={saving}
                      className="rounded"
                    />
                    <span className="text-sm">Enable wishlists</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input 
                      type="checkbox"
                      checked={formData.enable_guest_checkout}
                      onChange={(e) => handleInputChange('enable_guest_checkout', e.target.checked)}
                      disabled={saving}
                      className="rounded"
                    />
                    <span className="text-sm">Enable guest checkout</span>
                  </label>
                </div>
              </div>

              <div className="space-y-3">
                <label className="label">Social Links</label>
                <input 
                  className="input" 
                  type="url"
                  value={formData.facebook_url}
                  onChange={(e) => handleInputChange('facebook_url', e.target.value)}
                  placeholder="Facebook Page URL"
                  disabled={saving}
                />
                <input 
                  className="input" 
                  type="url"
                  value={formData.instagram_url}
                  onChange={(e) => handleInputChange('instagram_url', e.target.value)}
                  placeholder="Instagram URL"
                  disabled={saving}
                />
                <input 
                  className="input" 
                  type="url"
                  value={formData.twitter_url}
                  onChange={(e) => handleInputChange('twitter_url', e.target.value)}
                  placeholder="Twitter URL"
                  disabled={saving}
                />
                <input 
                  className="input" 
                  type="url"
                  value={formData.youtube_url}
                  onChange={(e) => handleInputChange('youtube_url', e.target.value)}
                  placeholder="YouTube URL"
                  disabled={saving}
                />
                <input 
                  className="input" 
                  type="url"
                  value={formData.tiktok_url}
                  onChange={(e) => handleInputChange('tiktok_url', e.target.value)}
                  placeholder="TikTok URL"
                  disabled={saving}
                />
              </div>

              <div className="space-y-3">
                <label className="label">Address</label>
                <input 
                  className="input" 
                  type="text"
                  value={formData.address2}
                  onChange={(e) => handleInputChange('address2', e.target.value)}
                  placeholder="Address Line 2"
                  disabled={saving}
                />
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="input" 
                    type="text"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    placeholder="City"
                    disabled={saving}
                  />
                  <input 
                    className="input" 
                    type="text"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    placeholder="State"
                    disabled={saving}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    className="input" 
                    type="text"
                    value={formData.postal_code}
                    onChange={(e) => handleInputChange('postal_code', e.target.value)}
                    placeholder="Postal Code"
                    disabled={saving}
                  />
                  <input 
                    className="input" 
                    type="text"
                    value={formData.country}
                    onChange={(e) => handleInputChange('country', e.target.value)}
                    placeholder="Country"
                    disabled={saving}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-4">
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
}
