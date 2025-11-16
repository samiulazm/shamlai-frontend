'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Truck } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface DeliveryMethod {
  id: string;
  name: string;
  type: 'pathao' | 'steadfast' | 'redx' | 'paperfly' | 'office' | 'other';
  api_key?: string;
  is_active: boolean;
  created_at: string;
}

export default function DeliveryMethods() {
  const [methods, setMethods] = useState<DeliveryMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<DeliveryMethod | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'other' as DeliveryMethod['type'],
    api_key: '',
    is_active: true,
  });
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);
      // Fetch delivery methods for this shop
      const { data, error } = await insforgeClient.database
        .from('delivery_methods')
        .select('*')
        .eq('shop_id', user.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMethods((data || []) as DeliveryMethod[]);
    } catch (error) {
      logger.error(
        'Error fetching delivery methods',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingMethod) {
        // Update method
        const { error } = await insforgeClient.database
          .from('delivery_methods')
          .update({
            name: formData.name,
            type: formData.type,
            api_key: formData.api_key || null,
            is_active: formData.is_active,
          })
          .eq('id', editingMethod.id)
          .eq('shop_id', shopId);

        if (error) {
          throw error;
        }
      } else {
        // Create method
        const { error } = await insforgeClient.database.from('delivery_methods').insert({
          shop_id: shopId,
          name: formData.name,
          type: formData.type,
          api_key: formData.api_key || null,
          is_active: formData.is_active,
        });

        if (error) {
          throw error;
        }
      }

      await fetchMethods();
      setShowForm(false);
      setEditingMethod(null);
      setFormData({ name: '', type: 'other', api_key: '', is_active: true });
    } catch (error) {
      logger.error(
        'Error saving delivery method',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error saving delivery method');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading delivery methods...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Delivery Methods</h1>
          <p className="text-gray-500 text-sm mt-1">Manage delivery service integrations</p>
        </div>
        <button
          onClick={() => {
            setShowForm(true);
            setEditingMethod(null);
            setFormData({ name: '', type: 'other', api_key: '', is_active: true });
          }}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Delivery Method
        </button>
      </div>

      {showForm && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">
              {editingMethod ? 'Edit Delivery Method' : 'Add Delivery Method'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value as DeliveryMethod['type'] })
                  }
                  className="w-full border rounded-lg p-2"
                >
                  <option value="pathao">Pathao</option>
                  <option value="steadfast">Steadfast</option>
                  <option value="redx">RedX</option>
                  <option value="paperfly">Paperfly</option>
                  <option value="office">Office Delivery</option>
                  <option value="other">Other</option>
                </select>
              </div>

              {formData.type !== 'office' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key (Optional)
                  </label>
                  <input
                    type="password"
                    value={formData.api_key}
                    onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                    className="w-full border rounded-lg p-2 font-mono text-sm"
                    placeholder="Enter API key for integration"
                  />
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-5 h-5 rounded"
                />
                <label htmlFor="is_active" className="text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex gap-2 pt-4 border-t">
                <button type="submit" className="btn btn-primary">
                  {editingMethod ? 'Update' : 'Create'} Method
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingMethod(null);
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-pad overflow-x-auto">
          {methods.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Truck className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No delivery methods yet</h3>
              <p className="text-gray-500 mb-4">Add delivery methods to enable shipping options</p>
              <button onClick={() => setShowForm(true)} className="btn btn-primary">
                Add Delivery Method
              </button>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {methods.map((method) => (
                  <tr key={method.id}>
                    <td className="font-medium">{method.name}</td>
                    <td>
                      <span className="badge bg-blue-100 text-blue-800">
                        {method.type.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`badge ${method.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {method.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="text-blue-600 hover:text-blue-700"
                          onClick={() => {
                            setEditingMethod(method);
                            setFormData({
                              name: method.name,
                              type: method.type,
                              api_key: method.api_key || '',
                              is_active: method.is_active,
                            });
                            setShowForm(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-700"
                          onClick={async () => {
                            if (!confirm('Are you sure you want to delete this delivery method?')) {
                              return;
                            }

                            try {
                              const { error } = await insforgeClient.database
                                .from('delivery_methods')
                                .delete()
                                .eq('id', method.id)
                                .eq('shop_id', shopId);

                              if (error) {
                                throw error;
                              }

                              await fetchMethods();
                            } catch (error) {
                              logger.error(
                                'Error deleting delivery method',
                                error instanceof Error ? error : new Error(String(error))
                              );
                              alert('Error deleting delivery method');
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
