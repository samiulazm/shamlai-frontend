'use client';

import { useEffect, useState } from 'react';
import { supabaseClient, ProductService } from '@/lib';
import { logger } from '@/lib/utils/logger';
import type { Category } from '@/lib/types/database';

interface CategoryWithStats extends Category {
  productCount: number;
}

export default function Categories() {
  const [categories, setCategories] = useState<CategoryWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [shopId, setShopId] = useState<string>('');
  const [addingCategory, setAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const { data: user } = await supabaseClient.auth.getUser();
      if (!user?.user?.id) {
        setError('User not authenticated');
        return;
      }

      // Fetch shop_id for the current user
      const { data: shop, error: shopError } = await supabaseClient
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', user.user.id)
        .single();

      if (shop) {
        setShopId(shop.shop_id);
      } else {
        // If user has no shop, logging error.
        logger.warn('No shop found for user', new Error('User has no associated shop_id'));
        // We might want to stop here if shop_id is strictly required for fetching categories too?
        // Yes, technically categories also have RLS on shop_id.
        // But the SELECT query below doesn't filter by shop_id explicitly in the client code?
        // Wait, the RLS policy filters rows based on auth.uid() -> shop_settings -> shop_id.
        // So the SELECT * will return empty if no policy matches.
        // BUT when we insert, we must provide shop_id.
      }


      // Fetch categories from the database
      // RLS will automatically filter by the user's shop_id logic
      const { data: categoriesData, error: categoriesError } = await supabaseClient
        .from('categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) {
        setError(categoriesError.message);
        return;
      }

      // Fetch products to calculate category stats
      const { data: productsData, error: productsError } = await supabaseClient
        .from('products')
        .select('category_id')
        .eq('is_active', true);

      if (productsError) {
        logger.warn(
          'Error fetching products for category stats',
          productsError instanceof Error ? productsError : new Error(String(productsError))
        );
      }

      // Calculate product count for each category
      const categoriesWithStats = (categoriesData || []).map((category) => {
        const productCount =
          productsData?.filter((product) => product.category_id === category.id).length || 0;
        return {
          ...category,
          productCount,
        };
      });

      setCategories(categoriesWithStats);
    } catch (err: any) {
      logger.error(
        'Error fetching categories',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    if (!shopId) {
      setError('Shop ID missing. Cannot create category.');
      return;
    }

    try {
      setAddingCategory(true);

      // Get current user (Double check, or just rely on session?)
      // We already have shopId from state.

      // Create new category
      const { data, error } = await supabaseClient
        .from('categories')
        .insert([
          {
            shop_id: shopId, // Inject shop_id
            name: newCategoryName.trim(),
            description: newCategoryDescription.trim() || null,
            slug: newCategoryName
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, '-')
              .replace(/(^-|-$)/g, ''),
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        setError(error.message);
        return;
      }

      // Reset form and refresh categories
      setNewCategoryName('');
      setNewCategoryDescription('');
      setShowAddForm(false);
      await fetchCategories();
    } catch (err: any) {
      logger.error('Error adding category', err instanceof Error ? err : new Error(String(err)), {
        categoryName: newCategoryName,
      });
      setError(err.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading categories...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Categories</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchCategories} className="btn btn-outline">
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
        <h1 className="text-2xl font-bold">Categories</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn btn-primary">
          {showAddForm ? 'Cancel' : '+ Add Category'}
        </button>
      </div>

      {showAddForm && (
        <div className="card">
          <div className="card-pad">
            <h3 className="text-lg font-semibold mb-4">Add New Category</h3>
            <form onSubmit={handleAddCategory} className="grid gap-4">
              <div>
                <label className="label">Category Name</label>
                <input
                  className="input"
                  type="text"
                  placeholder="e.g., Electronics, Clothing"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  required
                  disabled={addingCategory}
                />
              </div>
              <div>
                <label className="label">Description (Optional)</label>
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Brief description of this category"
                  value={newCategoryDescription}
                  onChange={(e) => setNewCategoryDescription(e.target.value)}
                  disabled={addingCategory}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={addingCategory || !newCategoryName.trim()}
                >
                  {addingCategory ? 'Adding...' : 'Add Category'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="btn btn-outline"
                  disabled={addingCategory}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-pad">
          {categories.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="rounded-xl border p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <span className="badge bg-blue-100 text-blue-800">
                      {category.productCount} products
                    </span>
                  </div>
                  {category.description && (
                    <p className="text-gray-600 text-sm mb-3">{category.description}</p>
                  )}
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Slug: {category.slug}</span>
                    <span
                      className={`badge ${category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
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
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No categories yet</h3>
                <p className="text-gray-500 mb-4">Create categories to organize your products</p>
                <button onClick={() => setShowAddForm(true)} className="btn btn-primary">
                  Add Your First Category
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
