'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { insforgeClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface Wishlist {
  id: string;
  customer_id: string;
  product_id: string;
  created_at: string;
  customer?: {
    full_name: string;
    email: string;
  };
  product?: {
    name: string;
    base_price: number;
    inventory_quantity: number;
  };
}

export default function Wishlists() {
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchWishlists();
  }, []);

  const fetchWishlists = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await insforgeClient.auth.getCurrentUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch wishlists with customer and product information
      const { data: wishlistsData, error: wishlistsError } = await insforgeClient.database
        .from('wishlists')
        .select(`
          *,
          customer:customers(full_name, email),
          product:products(name, base_price, inventory_quantity)
        `)
        .eq('shop_id', user.user.id)
        .order('created_at', { ascending: false });

      if (wishlistsError) {
        setError(wishlistsError.message);
        return;
      }

      setWishlists(wishlistsData || []);
    } catch (err: any) {
      logger.error('Error fetching wishlists', err instanceof Error ? err : new Error(String(err)));
      setError(err.message || 'Failed to fetch wishlists');
    } finally {
      setLoading(false);
    }
  };

  const filteredWishlists = wishlists.filter((wishlist) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (wishlist.customer as any)?.full_name?.toLowerCase().includes(searchLower) ||
      (wishlist.customer as any)?.email?.toLowerCase().includes(searchLower) ||
      (wishlist.product as any)?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading wishlists...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Customer Wishlists</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchWishlists} className="btn btn-outline">
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
        <h1 className="text-2xl font-bold">Customer Wishlists</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by customer or product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 border rounded-lg"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Total Wishlists</div>
            <div className="text-2xl font-bold mt-1">{wishlists.length}</div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Unique Customers</div>
            <div className="text-2xl font-bold mt-1">
              {new Set(wishlists.map((w) => w.customer_id)).size}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-sm text-gray-600">Unique Products</div>
            <div className="text-2xl font-bold mt-1">
              {new Set(wishlists.map((w) => w.product_id)).size}
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-pad overflow-x-auto">
          {filteredWishlists.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Added Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredWishlists.map((wishlist) => (
                  <tr key={wishlist.id}>
                    <td>
                      <div>
                        <div className="font-medium">
                          {(wishlist.customer as any)?.full_name || 'Unknown'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {(wishlist.customer as any)?.email || 'N/A'}
                        </div>
                      </div>
                    </td>
                    <td>
                      <Link
                        href={`/products/${wishlist.product_id}`}
                        className="text-brand-indigo hover:underline"
                      >
                        {(wishlist.product as any)?.name || 'Product'}
                      </Link>
                    </td>
                    <td>৳{(wishlist.product as any)?.base_price?.toLocaleString() || '0'}</td>
                    <td>
                      <span
                        className={`${
                          (wishlist.product as any)?.inventory_quantity > 0
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {(wishlist.product as any)?.inventory_quantity || 0}
                      </span>
                    </td>
                    <td>{new Date(wishlist.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex gap-2">
                        <Link
                          href={`/products/${wishlist.product_id}`}
                          className="text-brand-indigo hover:underline text-sm"
                        >
                          View Product
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
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
                <p className="text-lg font-medium">
                  {searchTerm ? 'No wishlists found' : 'No wishlists yet'}
                </p>
                <p className="text-sm mt-2">
                  {searchTerm
                    ? 'Try adjusting your search'
                    : 'Customer wishlists will appear here when they save products'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
