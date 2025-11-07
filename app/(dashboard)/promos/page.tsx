"use client";

import { useEffect, useState } from "react";
import { insforgeClient, MarketingService } from "@/lib/insforge";
import { logger } from "@/lib/utils/logger";
import type { DiscountCode } from "@/lib/types/database";

export default function Promos(){
  const [discountCodes, setDiscountCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    code: '',
    discount_type: 'percentage' as 'percentage' | 'fixed_amount' | 'free_shipping',
    discount_value: 0,
    description: '',
    minimum_purchase: 0,
    usage_limit: 0,
    starts_at: '',
    expires_at: ''
  });

  useEffect(() => {
    fetchDiscountCodes();
  }, []);

  const fetchDiscountCodes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      const response = await MarketingService.getDiscountCodes(user.user.id, {
        page: 1,
        pageSize: 50
      });

      setDiscountCodes(response.data || []);
    } catch (err: any) {
      logger.error('Error fetching discount codes', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch discount codes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code || formData.discount_value <= 0) {
      setError('Please fill in code and discount value');
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      await MarketingService.createDiscountCode({
        shop_id: user.user.id,
        code: formData.code.toUpperCase(),
        discount_type: formData.discount_type,
        discount_value: formData.discount_value,
        description: formData.description || undefined,
        minimum_purchase: formData.minimum_purchase || undefined,
        usage_limit: formData.usage_limit || undefined,
        usage_limit_per_customer: undefined,
        starts_at: formData.starts_at || undefined,
        expires_at: formData.expires_at || undefined,
        is_active: true,
        applies_to: 'all' // Default to apply to all products
      });

      // Reset form and refresh
      setFormData({
        code: '',
        discount_type: 'percentage',
        discount_value: 0,
        description: '',
        minimum_purchase: 0,
        usage_limit: 0,
        starts_at: '',
        expires_at: ''
      });
      setShowForm(false);
      await fetchDiscountCodes();
    } catch (err: any) {
      logger.error('Error creating discount code', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to create discount code');
    } finally {
      setCreating(false);
    }
  };

  const toggleActive = async (codeId: string, currentStatus: boolean) => {
    try {
      await MarketingService.updateDiscountCode(codeId, {
        is_active: !currentStatus
      });
      await fetchDiscountCodes();
    } catch (err: any) {
      logger.error('Error updating discount code', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to update discount code');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading promo codes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promo Codes</h1>
        <button 
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ Create Promo Code'}
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card">
          <div className="card-pad">
            <h3 className="text-lg font-semibold mb-4">Create New Promo Code</h3>
            <form onSubmit={handleCreate} className="grid gap-4">
              <div className="grid md:grid-cols-4 gap-3">
                <div>
                  <label className="label">Code *</label>
                  <input 
                    className="input" 
                    placeholder="FEST20"
                    value={formData.code}
                    onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    required
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="label">Type *</label>
                  <select 
                    className="input"
                    value={formData.discount_type}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_type: e.target.value as any }))}
                    disabled={creating}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed_amount">Flat Amount</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value *</label>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="20"
                    value={formData.discount_value}
                    onChange={(e) => setFormData(prev => ({ ...prev, discount_value: parseFloat(e.target.value) || 0 }))}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="flex items-end">
                  <button 
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={creating}
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <label className="label">Description</label>
                  <input 
                    className="input" 
                    placeholder="Holiday special discount"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="label">Minimum Purchase</label>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="0"
                    value={formData.minimum_purchase}
                    onChange={(e) => setFormData(prev => ({ ...prev, minimum_purchase: parseFloat(e.target.value) || 0 }))}
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="label">Usage Limit</label>
                  <input 
                    className="input" 
                    type="number"
                    placeholder="Unlimited"
                    value={formData.usage_limit}
                    onChange={(e) => setFormData(prev => ({ ...prev, usage_limit: parseInt(e.target.value) || 0 }))}
                    disabled={creating}
                  />
                </div>
                <div>
                  <label className="label">Expires At</label>
                  <input 
                    className="input" 
                    type="datetime-local"
                    value={formData.expires_at}
                    onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    disabled={creating}
                  />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-pad">
          {discountCodes.length > 0 ? (
            <div className="space-y-3">
              {discountCodes.map((code) => (
                <div key={code.id} className="flex items-center justify-between rounded-xl border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="font-semibold text-lg">{code.code}</div>
                      <span className={`badge ${code.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {code.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {code.discount_type === 'percentage' 
                        ? `${code.discount_value}% off`
                        : code.discount_type === 'fixed_amount'
                        ? `৳${code.discount_value} off`
                        : 'Free Shipping'}
                      {code.description && ` - ${code.description}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Used {code.usage_count} times
                      {code.usage_limit && ` / ${code.usage_limit} limit`}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(code.id, code.is_active)}
                    className={`btn btn-sm ${code.is_active ? 'btn-outline' : 'btn-primary'}`}
                  >
                    {code.is_active ? 'Deactivate' : 'Activate'}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border p-4 text-sm text-gray-600 text-center py-8">
              No promo codes yet. Create your first discount code to get started!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
