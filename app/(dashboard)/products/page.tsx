'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabaseClient, ProductService } from '@/lib';
import { logger } from '@/lib/utils/logger';
import type { Product } from '@/lib/types/database';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop_id for the current user
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', user.id)
        .single();

      if (shopError || !shop) {
        // If no shop, they can't have products yet (or haven't set up shop)
        setProducts([]);
        return;
      }

      // Fetch products using the service, passing the correct shop_id slug
      const productsData = await ProductService.getProducts(shop.shop_id, {
        page: 1,
        pageSize: 50,
        isActive: undefined, // Show all (active and inactive) for dashboard
      });

      setProducts(productsData.data || []);
    } catch (err: any) {
      logger.error('Error fetching products', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch products');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (isActive: boolean) => {
    return (
      <span
        className={`badge ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
      >
        {isActive ? 'Active' : 'Draft'}
      </span>
    );
  };

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

  if (error) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Products</h1>
          <Link href="/products/new" className="btn btn-primary">
            Add Product
          </Link>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchProducts} className="btn btn-outline">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link href="/products/new" className="btn btn-primary">
          Add Product
        </Link>
      </div>

      <div className="card">
        <div className="card-pad overflow-x-auto">
          {products.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        {/* Product images would be fetched separately from product_images table */}
                        <div>
                          <div className="font-medium">{product.name}</div>
                          {product.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {product.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{product.sku || 'N/A'}</td>
                    <td>৳{product.base_price?.toLocaleString() || '0'}</td>
                    <td>{product.inventory_quantity || 0}</td>
                    <td>{getStatusBadge(product.is_active)}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${product.id}`}
                          className="text-brand-indigo hover:underline"
                        >
                          View
                        </Link>
                        <Link
                          href={`/products/${product.id}?edit=true`}
                          className="text-gray-600 hover:underline"
                        >
                          Edit
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-500 mb-4">
                <svg
                  className="w-16 h-16 mx-auto mb-4 text-gray-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                <p className="text-gray-500 mb-4">Get started by adding your first product</p>
                <Link href="/products/new" className="btn btn-primary">
                  Add Product
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
