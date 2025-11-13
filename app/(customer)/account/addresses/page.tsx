'use client';

import { useAuth } from '@/lib/context/AuthContext';
import { useState, useEffect } from 'react';
import { MapPin, Plus, Edit, Trash2, Check, X } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface Address {
  id: string;
  customer_id: string;
  address_type: 'shipping' | 'billing';
  is_default: boolean;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  phone?: string;
}

const emptyAddress: Omit<Address, 'id' | 'customer_id'> = {
  address_type: 'shipping',
  is_default: false,
  first_name: '',
  last_name: '',
  street: '',
  city: '',
  state: '',
  zip: '',
  country: 'US',
  phone: '',
};

export default function AddressesPage() {
  const { user } = useAuth();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(emptyAddress);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadAddresses();
    }
  }, [user]);

  const loadAddresses = async () => {
    try {
      setLoading(true);

      // Get customer
      const { data: customer } = await insforgeClient.database
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) {
        setLoading(false);
        return;
      }

      // Get addresses
      const { data: addressesData } = await insforgeClient.database
        .from('addresses')
        .select('*')
        .eq('customer_id', customer.id)
        .order('is_default', { ascending: false });

      setAddresses(addressesData || []);
      setLoading(false);
    } catch (err) {
      logger.error('Failed to load addresses', err instanceof Error ? err : new Error(String(err)));
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Get customer
      const { data: customer } = await insforgeClient.database
        .from('customers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!customer) {
        setSaving(false);
        return;
      }

      if (editingId) {
        // Update existing address
        const { error } = await insforgeClient.database
          .from('addresses')
          .update({
            ...formData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId);

        if (error) throw error;
      } else {
        // Create new address
        const { error } = await insforgeClient.database.from('addresses').insert({
          ...formData,
          customer_id: customer.id,
        });

        if (error) throw error;
      }

      // If set as default, unset other defaults
      if (formData.is_default) {
        await insforgeClient.database
          .from('addresses')
          .update({ is_default: false })
          .eq('customer_id', customer.id)
          .neq('id', editingId || '');
      }

      await loadAddresses();
      setShowForm(false);
      setEditingId(null);
      setFormData(emptyAddress);
      setSaving(false);
    } catch (err) {
      logger.error('Failed to save address', err instanceof Error ? err : new Error(String(err)));
      setSaving(false);
    }
  };

  const handleEdit = (address: Address) => {
    setFormData(address);
    setEditingId(address.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    try {
      const { error } = await insforgeClient.database
        .from('addresses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadAddresses();
    } catch (err) {
      logger.error('Failed to delete address', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData(emptyAddress);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading addresses...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">My Addresses</h2>
            <p className="text-gray-600 mt-1">Manage your shipping and billing addresses</p>
          </div>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition"
            >
              <Plus className="w-5 h-5" />
              Add Address
            </button>
          )}
        </div>
      </div>

      {/* Address Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingId ? 'Edit Address' : 'Add New Address'}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Type
              </label>
              <select
                value={formData.address_type}
                onChange={(e) =>
                  setFormData({ ...formData, address_type: e.target.value as 'shipping' | 'billing' })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="shipping">Shipping</option>
                <option value="billing">Billing</option>
              </select>
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Street */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Street Address
              </label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                required
              />
            </div>

            {/* City, State, ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">State</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ZIP Code</label>
                <input
                  type="text"
                  value={formData.zip}
                  onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            {/* Country & Phone */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="US">United States</option>
                  <option value="BD">Bangladesh</option>
                  <option value="CA">Canada</option>
                  <option value="GB">United Kingdom</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone (Optional)
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Default Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_default}
                onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
                className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">Set as default address</span>
            </label>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <Check className="w-5 h-5" />
                {saving ? 'Saving...' : editingId ? 'Update' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition"
              >
                <X className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Addresses List */}
      {addresses.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No addresses saved yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`bg-white rounded-lg shadow-sm p-6 relative ${
                address.is_default ? 'ring-2 ring-indigo-600' : ''
              }`}
            >
              {address.is_default && (
                <div className="absolute top-4 right-4">
                  <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                    Default
                  </span>
                </div>
              )}

              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">
                    {address.first_name} {address.last_name}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {address.street}<br />
                    {address.city}, {address.state} {address.zip}<br />
                    {address.country}
                  </p>
                  {address.phone && (
                    <p className="text-sm text-gray-600 mt-2">{address.phone}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-2 uppercase">
                    {address.address_type}
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleEdit(address)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-indigo-600 hover:bg-indigo-50 rounded transition"
                >
                  <Edit className="w-4 h-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(address.id)}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded transition"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
