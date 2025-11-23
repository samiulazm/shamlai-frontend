'use client';

import { useState } from 'react';
import { Search, Package, ShoppingBag, Users } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'orders' | 'customers'>('all');

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim() || query.trim().length < 2) return;

    try {
      setLoading(true);

      // Get user/shop ID
      const { supabaseClient } = await import('@/lib/supabase');
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();
      if (!user?.id) {
        throw new Error('User not authenticated');
      }

      // Import search service dynamically
      const { globalSearch } = await import('@/lib/services/search');

      // Determine search types based on active tab
      const types =
        activeTab === 'all'
          ? undefined
          : activeTab === 'products'
            ? ['product' as const]
            : activeTab === 'orders'
              ? ['order' as const]
              : ['customer' as const];

      // Perform search
      const { results: searchResults, error } = await globalSearch(query, {
        shopId: user.id,
        types,
        limit: 50,
      });

      if (error) {
        throw error;
      }

      setResults(searchResults);
    } catch (err) {
      console.error('Search error:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Search className="h-6 w-6" />
          Search
        </h1>
        <p className="text-sm text-gray-600 mt-1">Search across products, orders, and customers</p>
      </div>

      <div className="bg-white rounded-lg border p-6 max-w-3xl">
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, orders, customers..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </div>
        </form>

        <div className="flex gap-2 mb-4 border-b">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-4 py-2 text-sm font-medium ${
              activeTab === 'all'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'products'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Package className="h-4 w-4" />
            Products
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Orders
          </button>
          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 text-sm font-medium flex items-center gap-2 ${
              activeTab === 'customers'
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="h-4 w-4" />
            Customers
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-500">Searching...</div>
          </div>
        ) : results.length === 0 && query ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No results found for "{query}"</p>
          </div>
        ) : !query ? (
          <div className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Enter a search query to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {results.map((result) => (
              <Link
                key={result.id}
                href={result.url}
                className="block p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-indigo-300 transition-colors"
              >
                <div className="flex items-start gap-3">
                  {result.imageUrl && (
                    <img
                      src={result.imageUrl}
                      alt={result.title}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {result.type === 'product' && <Package className="h-4 w-4 text-blue-500" />}
                      {result.type === 'order' && (
                        <ShoppingBag className="h-4 w-4 text-green-500" />
                      )}
                      {result.type === 'customer' && <Users className="h-4 w-4 text-purple-500" />}
                      <h3 className="font-medium text-gray-900 truncate">{result.title}</h3>
                      <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        {result.type}
                      </span>
                    </div>
                    {result.subtitle && (
                      <p className="text-sm text-gray-600 mb-1">{result.subtitle}</p>
                    )}
                    {result.description && (
                      <p className="text-sm text-gray-500 truncate">{result.description}</p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
