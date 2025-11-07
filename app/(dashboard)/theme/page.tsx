"use client";

import { useEffect, useState } from "react";
import { insforgeClient } from "@/lib/insforge";
import { getActiveTheme, upsertTheme } from "@/lib/services/shop";
import { logger } from "@/lib/utils/logger";
import type { Theme } from "@/lib/types/database";

export default function ThemeCustomizer() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: 'Custom Theme',
    primary_color: '#4F46E5',
    secondary_color: '#6B7280',
    accent_color: '#10B981',
    background_color: '#FFFFFF',
    text_color: '#111827',
    heading_font: 'Inter',
    body_font: 'Inter',
    header_style: 'standard',
    footer_style: 'standard',
    product_card_style: 'standard',
    custom_css: '',
    custom_js: ''
  });

  useEffect(() => {
    fetchTheme();
  }, []);

  const fetchTheme = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch active theme
      const activeTheme = await getActiveTheme(user.user.id);
      
      if (activeTheme) {
        setTheme(activeTheme);
        setFormData({
          name: activeTheme.name || 'Custom Theme',
          primary_color: activeTheme.primary_color || '#4F46E5',
          secondary_color: activeTheme.secondary_color || '#6B7280',
          accent_color: activeTheme.accent_color || '#10B981',
          background_color: activeTheme.background_color || '#FFFFFF',
          text_color: activeTheme.text_color || '#111827',
          heading_font: activeTheme.heading_font || 'Inter',
          body_font: activeTheme.body_font || 'Inter',
          header_style: activeTheme.header_style || 'standard',
          footer_style: activeTheme.footer_style || 'standard',
          product_card_style: activeTheme.product_card_style || 'standard',
          custom_css: activeTheme.custom_css || '',
          custom_js: activeTheme.custom_js || ''
        });
      }
    } catch (err: any) {
      logger.error('Error fetching theme', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch theme');
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

      // Update theme
      const updatedTheme = await upsertTheme(user.user.id, {
        name: formData.name,
        is_active: true,
        is_custom: true,
        primary_color: formData.primary_color,
        secondary_color: formData.secondary_color,
        accent_color: formData.accent_color,
        background_color: formData.background_color,
        text_color: formData.text_color,
        heading_font: formData.heading_font,
        body_font: formData.body_font,
        header_style: formData.header_style,
        footer_style: formData.footer_style,
        product_card_style: formData.product_card_style,
        custom_css: formData.custom_css,
        custom_js: formData.custom_js
      });
      
      setTheme(updatedTheme);
      setSuccess('Theme saved successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      logger.error('Error saving theme', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to save theme');
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

  const applyPreviewStyles = () => {
    return {
      '--primary-color': formData.primary_color,
      '--secondary-color': formData.secondary_color,
      '--accent-color': formData.accent_color,
      '--background-color': formData.background_color,
      '--text-color': formData.text_color,
      '--heading-font': formData.heading_font,
      '--body-font': formData.body_font
    } as React.CSSProperties;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Theme Customizer</h1>
      
      {error && (
        <div className="card">
          <div className="card-pad">
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
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
      <div className="grid gap-4 md:grid-cols-2">
          {/* Theme Settings */}
          <div className="card">
            <div className="card-pad grid gap-4">
              <h3 className="text-lg font-semibold">Theme Settings</h3>
              
              <div>
                <label className="label">Theme Name</label>
                <input 
                  className="input" 
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="My Custom Theme"
                  disabled={saving}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
          <label className="label">Primary Color</label>
                  <div className="flex gap-2">
                    <input 
                      className="input" 
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      disabled={saving}
                    />
                    <input 
                      className="input" 
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange('primary_color', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Secondary Color</label>
                  <div className="flex gap-2">
                    <input 
                      className="input" 
                      type="color"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      disabled={saving}
                    />
                    <input 
                      className="input" 
                      type="text"
                      value={formData.secondary_color}
                      onChange={(e) => handleInputChange('secondary_color', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Accent Color</label>
                  <div className="flex gap-2">
                    <input 
                      className="input" 
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => handleInputChange('accent_color', e.target.value)}
                      disabled={saving}
                    />
                    <input 
                      className="input" 
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => handleInputChange('accent_color', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>

                <div>
                  <label className="label">Background Color</label>
                  <div className="flex gap-2">
                    <input 
                      className="input" 
                      type="color"
                      value={formData.background_color}
                      onChange={(e) => handleInputChange('background_color', e.target.value)}
                      disabled={saving}
                    />
                    <input 
                      className="input" 
                      type="text"
                      value={formData.background_color}
                      onChange={(e) => handleInputChange('background_color', e.target.value)}
                      disabled={saving}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Heading Font</label>
                  <select 
                    className="input"
                    value={formData.heading_font}
                    onChange={(e) => handleInputChange('heading_font', e.target.value)}
                    disabled={saving}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Manrope">Manrope</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>

                <div>
                  <label className="label">Body Font</label>
                  <select 
                    className="input"
                    value={formData.body_font}
                    onChange={(e) => handleInputChange('body_font', e.target.value)}
                    disabled={saving}
                  >
                    <option value="Inter">Inter</option>
                    <option value="Manrope">Manrope</option>
                    <option value="Poppins">Poppins</option>
                    <option value="Roboto">Roboto</option>
                    <option value="Open Sans">Open Sans</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="label">Header Style</label>
                  <select 
                    className="input"
                    value={formData.header_style}
                    onChange={(e) => handleInputChange('header_style', e.target.value)}
                    disabled={saving}
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>

                <div>
                  <label className="label">Footer Style</label>
                  <select 
                    className="input"
                    value={formData.footer_style}
                    onChange={(e) => handleInputChange('footer_style', e.target.value)}
                    disabled={saving}
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>

                <div>
                  <label className="label">Product Cards</label>
                  <select 
                    className="input"
                    value={formData.product_card_style}
                    onChange={(e) => handleInputChange('product_card_style', e.target.value)}
                    disabled={saving}
                  >
                    <option value="standard">Standard</option>
                    <option value="minimal">Minimal</option>
                    <option value="detailed">Detailed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label">Custom CSS</label>
                <textarea 
                  className="input" 
                  rows={4}
                  value={formData.custom_css}
                  onChange={(e) => handleInputChange('custom_css', e.target.value)}
                  placeholder="/* Add your custom CSS here */"
                  disabled={saving}
                />
              </div>

              <div>
                <label className="label">Custom JavaScript</label>
                <textarea 
                  className="input" 
                  rows={4}
                  value={formData.custom_js}
                  onChange={(e) => handleInputChange('custom_js', e.target.value)}
                  placeholder="// Add your custom JavaScript here"
                  disabled={saving}
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Theme'}
              </button>
            </div>
          </div>

          {/* Live Preview */}
          <div className="card">
            <div className="card-pad">
              <h3 className="text-lg font-semibold mb-4">Live Preview</h3>
              <div 
                className="rounded-xl border p-4 bg-white"
                style={applyPreviewStyles()}
              >
                {/* Header Preview */}
                <div 
                  className="h-12 rounded mb-4 flex items-center px-4"
                  style={{ backgroundColor: formData.primary_color }}
                >
                  <div 
                    className="text-white font-semibold"
                    style={{ fontFamily: formData.heading_font }}
                  >
                    Your Store Header
                  </div>
                </div>

                {/* Product Grid Preview */}
                <div className="grid grid-cols-2 gap-3">
                  {[...Array(4)].map((_, i) => (
                    <div 
                      key={i} 
                      className="rounded-xl border p-3"
                      style={{ 
                        backgroundColor: formData.background_color,
                        color: formData.text_color,
                        fontFamily: formData.body_font
                      }}
                    >
                      <div 
                        className="aspect-square rounded-lg mb-2"
                        style={{ backgroundColor: formData.secondary_color }}
                      />
                      <div 
                        className="h-3 rounded mb-1"
                        style={{ 
                          backgroundColor: formData.accent_color,
                          width: '75%'
                        }}
                      />
                      <div 
                        className="h-2 rounded"
                        style={{ 
                          backgroundColor: formData.secondary_color,
                          width: '50%'
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Footer Preview */}
                <div 
                  className="mt-4 h-8 rounded flex items-center px-4"
                  style={{ backgroundColor: formData.secondary_color }}
                >
                  <div 
                    className="text-white text-sm"
                    style={{ fontFamily: formData.body_font }}
                  >
                    Footer
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
      </form>
    </div>
  );
}