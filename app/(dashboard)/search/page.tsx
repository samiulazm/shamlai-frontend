'use client';

import { useState } from 'react';
import { Search, Package, ShoppingBag, Users } from 'lucide-react';
import Link from 'next/link';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'products' | 'orders' | 'customers'>('all');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    // TODO: Implement global search
    setTimeout(() => {
      setLoading(false);
      setResults([]);
    }, 1000);
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
          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                {result.title}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
