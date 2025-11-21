'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

interface BlockedItem {
  id: string;
  type: 'ip' | 'phone';
  value: string;
  reason?: string;
  created_at: string;
}

export default function BlockList() {
  const [blockedItems, setBlockedItems] = useState<BlockedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    type: 'ip' as 'ip' | 'phone',
    value: '',
    reason: '',
  });
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchBlockList();
  }, []);

  const fetchBlockList = async () => {
    try {
      setLoading(true);
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) return;

      setShopId(user.id);

      // Fetch blocked items (this would come from a block_list table)
      // For now, we'll simulate with empty array
      // In production, this would be:
      // const { data } = await supabaseClient
      //   .from('block_list')
      //   .select('*')
      //   .eq('shop_id', user.user.id);

      setBlockedItems([]);
    } catch (error) {
      logger.error(
        'Error fetching block list',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const addBlockedItem = async () => {
    if (!newItem.value.trim()) {
      alert('Please enter a value to block');
      return;
    }

    try {
      // Add to block list
      // In production:
      // await supabaseClient
      //   .from('block_list')
      //   .insert([{
      //     shop_id: shopId,
      //     type: newItem.type,
      //     value: newItem.value,
      //     reason: newItem.reason
      //   }]);

      const item: BlockedItem = {
        id: Date.now().toString(),
        type: newItem.type,
        value: newItem.value,
        reason: newItem.reason,
        created_at: new Date().toISOString(),
      };

      setBlockedItems([...blockedItems, item]);
      setNewItem({ type: 'ip', value: '', reason: '' });
      setShowAddForm(false);
    } catch (error) {
      logger.error(
        'Error adding blocked item',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error adding blocked item');
    }
  };

  const removeBlockedItem = async (id: string) => {
    if (!confirm('Are you sure you want to remove this block?')) return;

    try {
      // Remove from block list
      // In production:
      // await supabaseClient
      //   .from('block_list')
      //   .delete()
      //   .eq('id', id);

      setBlockedItems(blockedItems.filter((item) => item.id !== id));
    } catch (error) {
      logger.error(
        'Error removing blocked item',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error removing blocked item');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading block list...</p>
        </div>
      </div>
    );
  }

  const ipBlocks = blockedItems.filter((item) => item.type === 'ip');
  const phoneBlocks = blockedItems.filter((item) => item.type === 'phone');

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">IP & Mobile Block</h1>
          <p className="text-gray-500 text-sm mt-1">
            Block fraudulent customers by IP address or phone number
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="btn btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Block
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="card">
          <div className="card-pad">
            <h2 className="text-lg font-semibold mb-4">Add Blocked Item</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Block Type</label>
                <select
                  value={newItem.type}
                  onChange={(e) =>
                    setNewItem({ ...newItem, type: e.target.value as 'ip' | 'phone' })
                  }
                  className="w-full border rounded-lg p-2"
                >
                  <option value="ip">IP Address</option>
                  <option value="phone">Phone Number</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {newItem.type === 'ip' ? 'IP Address' : 'Phone Number'}{' '}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type={newItem.type === 'ip' ? 'text' : 'tel'}
                  value={newItem.value}
                  onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
                  placeholder={newItem.type === 'ip' ? '192.168.1.1' : '01912345678'}
                  className="w-full border rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason (Optional)
                </label>
                <textarea
                  value={newItem.reason}
                  onChange={(e) => setNewItem({ ...newItem, reason: e.target.value })}
                  placeholder="Why is this being blocked?"
                  rows={3}
                  className="w-full border rounded-lg p-2"
                />
              </div>

              <div className="flex gap-2">
                <button onClick={addBlockedItem} className="btn btn-primary">
                  Add Block
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewItem({ type: 'ip', value: '', reason: '' });
                  }}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* IP Blocks */}
      <div className="card">
        <div className="card-pad">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blocked IP Addresses ({ipBlocks.length})
            </h2>
          </div>

          {ipBlocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No IP addresses blocked</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>Reason</th>
                  <th>Blocked Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {ipBlocks.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.value}</td>
                    <td>{item.reason || <span className="text-gray-400">No reason</span>}</td>
                    <td className="text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => removeBlockedItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Phone Blocks */}
      <div className="card">
        <div className="card-pad">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Blocked Phone Numbers ({phoneBlocks.length})
            </h2>
          </div>

          {phoneBlocks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No phone numbers blocked</p>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Phone Number</th>
                  <th>Reason</th>
                  <th>Blocked Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {phoneBlocks.map((item) => (
                  <tr key={item.id}>
                    <td className="font-mono">{item.value}</td>
                    <td>{item.reason || <span className="text-gray-400">No reason</span>}</td>
                    <td className="text-sm text-gray-600">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        onClick={() => removeBlockedItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Info Card */}
      <div className="card bg-blue-50 border-blue-200">
        <div className="card-pad">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-blue-600 mt-0.5" />
            <div>
              <div className="font-medium text-blue-900 mb-1">How Blocking Works</div>
              <ul className="text-sm text-blue-700 space-y-1 list-disc list-inside">
                <li>Blocked IP addresses prevent orders from that IP</li>
                <li>Blocked phone numbers prevent orders with that phone</li>
                <li>Blocks are checked when orders are created</li>
                <li>You can add a reason for tracking purposes</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
