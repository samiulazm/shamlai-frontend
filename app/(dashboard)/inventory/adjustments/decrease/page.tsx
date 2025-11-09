'use client';

import { useState, useEffect } from 'react';
import { Save, Search, Package } from 'lucide-react';
import { insforgeClient } from '@/lib/insforge';
import type { Product } from '@/lib/types/database';
import { logger } from '@/lib/utils/logger';
import Link from 'next/link';

export default function DecreaseStock() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [shopId, setShopId] = useState<string>('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) return;

      setShopId(user.user.id);

      const { data: productsData } = await insforgeClient.database
        .from('products')
        .select('*')
        .eq('shop_id', user.user.id)
        .eq('is_active', true)
        .order('name');

      setProducts(productsData || []);
    } catch (error) {
      logger.error(
        'Error fetching products',
        error instanceof Error ? error : new Error(String(error))
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || quantity <= 0) {
      alert('Please select a product and enter a valid quantity');
      return;
    }

    const selectedProductData = products.find((p) => p.id === selectedProduct);
    if (!selectedProductData) return;

    if (quantity > (selectedProductData.inventory_quantity || 0)) {
      alert(
        `Cannot decrease more than available stock (${selectedProductData.inventory_quantity || 0})`
      );
      return;
    }

    try {
      setSaving(true);

      // Update inventory
      const newQuantity = Math.max(0, (selectedProductData.inventory_quantity || 0) - quantity);

      await insforgeClient.database
        .from('products')
        .update({
          inventory_quantity: newQuantity,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedProduct);

      // Create adjustment record (would go to stock_adjustments table)
      // await insforgeClient.database
      //   .from('stock_adjustments')
      //   .insert([{
      //     shop_id: shopId,
      //     product_id: selectedProduct,
      //     quantity,
      //     type: 'decrease',
      //     reason,
      //     notes,
      //     created_by: user.user.id
      //   }]);

      alert('Stock decreased successfully!');

      // Reset form
      setSelectedProduct('');
      setQuantity(1);
      setReason('');
      setNotes('');
      setSearchQuery('');

      // Refresh products
      await fetchProducts();
    } catch (error) {
      logger.error(
        'Error decreasing stock',
        error instanceof Error ? error : new Error(String(error))
      );
      alert('Error decreasing stock');
    } finally {
      setSaving(false);
    }
  };

  const selectedProductData = products.find((p) => p.id === selectedProduct);
  const maxQuantity = selectedProductData ? selectedProductData.inventory_quantity || 0 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Decrease Stock</h1>
        <p className="text-gray-500 text-sm mt-1">
          Remove inventory from products (damage, returns, etc.)
        </p>
      </div>

      <form onSubmit={handleSubmit} className="card">
        <div className="card-pad space-y-6">
          {/* Product Search & Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Product <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or SKU..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-indigo"
              />
            </div>

            {searchQuery && (
              <div className="mt-2 border rounded-lg max-h-60 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No products found</div>
                ) : (
                  filteredProducts.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => {
                        setSelectedProduct(product.id);
                        setSearchQuery(product.name);
                      }}
                      className={`w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 ${
                        selectedProduct === product.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="font-medium">{product.name}</div>
                      <div className="text-sm text-gray-500">
                        SKU: {product.sku || 'N/A'} • Current Stock:{' '}
                        {product.inventory_quantity || 0}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {selectedProductData && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedProductData.name}</div>
                    <div className="text-sm text-gray-600 mt-1">
                      Current Stock:{' '}
                      <span className="font-semibold">
                        {selectedProductData.inventory_quantity || 0}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProduct('');
                      setSearchQuery('');
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Remove <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              min="1"
              max={maxQuantity}
              required
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />
            {selectedProductData && (
              <p className="text-sm text-gray-500 mt-1">
                New stock will be:{' '}
                {Math.max(0, (selectedProductData.inventory_quantity || 0) - quantity)}
                {quantity > maxQuantity && (
                  <span className="text-red-600 ml-2">Cannot exceed available stock!</span>
                )}
              </p>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            >
              <option value="">Select reason</option>
              <option value="damage">Damage/Defect</option>
              <option value="return">Customer Return</option>
              <option value="sample">Sample/Free Product</option>
              <option value="wastage">Wastage/Expired</option>
              <option value="theft">Theft/Loss</option>
              <option value="correction">Inventory Correction</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Additional notes about this stock decrease..."
              className="w-full border rounded-lg p-2 focus:outline-none focus:ring-2 focus:ring-brand-indigo"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 pt-4 border-t">
            <button
              type="submit"
              disabled={saving || !selectedProduct || quantity > maxQuantity}
              className="btn btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Decrease Stock'}
            </button>
            <Link href="/inventory/adjustments" className="btn btn-outline">
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
