'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useProduct, useProductMutations } from '@/lib/hooks/useProducts';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { ProductInsert } from '@/lib/types/database';

export default function ProductDetail() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const productId = params.id as string;

  const { product, loading: productLoading, error: productError } = useProduct(productId);
  const {
    updateProduct,
    deleteProduct,
    loading: mutationLoading,
    error: mutationError,
  } = useProductMutations();

  // Form state for editing
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    short_description: '',
    base_price: 0,
    inventory_quantity: 0,
    category_id: '',
    is_active: true,
    track_inventory: true,
    allow_backorder: false,
    weight: 0,
    weight_unit: 'kg',
    sku: '',
    barcode: '',
    meta_title: '',
    meta_description: '',
  });

  // Update form data when product loads and check for edit mode
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        short_description: product.short_description || '',
        base_price: product.base_price || 0,
        inventory_quantity: product.inventory_quantity || 0,
        category_id: product.category_id || '',
        is_active: product.is_active,
        track_inventory: product.track_inventory,
        allow_backorder: product.allow_backorder,
        weight: product.weight || 0,
        weight_unit: product.weight_unit || 'kg',
        sku: product.sku || '',
        barcode: product.barcode || '',
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
      });
    }

    // Check if edit mode is requested via URL parameter
    const editParam = searchParams.get('edit');
    if (editParam === 'true') {
      setIsEditing(true);
    }
  }, [product, searchParams]);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData((prev) => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.base_price) {
      alert('Please fill in required fields (Name and Price)');
      return;
    }

    try {
      await updateProduct(productId, {
        name: formData.name,
        description: formData.description,
        short_description: formData.short_description,
        base_price: formData.base_price,
        inventory_quantity: formData.inventory_quantity,
        category_id: formData.category_id || undefined,
        track_inventory: formData.track_inventory,
        allow_backorder: formData.allow_backorder,
        weight: formData.weight || undefined,
        weight_unit: formData.weight_unit,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        is_active: formData.is_active,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
      });

      setIsEditing(false);
      alert('Product updated successfully!');
    } catch (err) {
      logger.error('Error updating product', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to update product. Please try again.');
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteProduct(productId);
      alert('Product deleted successfully!');
      router.push('/products');
    } catch (err) {
      logger.error('Error deleting product', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to delete product. Please try again.');
    }
  };

  if (productLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (productError || !product) {
    return (
      <div className="grid gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Product Not Found</h1>
          <Link href="/products" className="btn btn-outline">
            Back to Products
          </Link>
        </div>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{productError || 'Product not found'}</p>
              <Link href="/products" className="btn btn-primary">
                Back to Products
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/products" className="btn btn-outline">
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">{isEditing ? 'Edit Product' : 'Product Details'}</h1>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button onClick={() => setIsEditing(true)} className="btn btn-outline">
                Edit
              </button>
              <button onClick={handleDelete} className="btn btn-danger" disabled={mutationLoading}>
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {mutationError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {mutationError}
        </div>
      )}

      <div className="card">
        <div className="card-pad">
          {isEditing ? (
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-3">
                <div>
                  <label className="label">Product Name *</label>
                  <input
                    className="input"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Product name"
                    required
                  />
                </div>

                <div>
                  <label className="label">Short Description</label>
                  <textarea
                    className="input h-20"
                    name="short_description"
                    value={formData.short_description}
                    onChange={handleInputChange}
                    placeholder="Brief description for product cards..."
                  />
                </div>

                <div>
                  <label className="label">Full Description</label>
                  <textarea
                    className="input h-28"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Detailed product description..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Price *</label>
                    <input
                      className="input"
                      type="number"
                      step="0.01"
                      name="base_price"
                      value={formData.base_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <div>
                    <label className="label">Stock Quantity</label>
                    <input
                      className="input"
                      type="number"
                      name="inventory_quantity"
                      value={formData.inventory_quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">SKU</label>
                    <input
                      className="input"
                      name="sku"
                      value={formData.sku}
                      onChange={handleInputChange}
                      placeholder="Product SKU"
                    />
                  </div>
                  <div>
                    <label className="label">Barcode</label>
                    <input
                      className="input"
                      name="barcode"
                      value={formData.barcode}
                      onChange={handleInputChange}
                      placeholder="Product barcode"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <div>
                  <label className="label">Product Status</label>
                  <div className="flex gap-3">
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={() => setFormData((prev) => ({ ...prev, is_active: true }))}
                      />
                      Active
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input
                        type="radio"
                        name="is_active"
                        checked={!formData.is_active}
                        onChange={() => setFormData((prev) => ({ ...prev, is_active: false }))}
                      />
                      Draft
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="track_inventory"
                      checked={formData.track_inventory}
                      onChange={handleInputChange}
                    />
                    Track inventory
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="allow_backorder"
                      checked={formData.allow_backorder}
                      onChange={handleInputChange}
                    />
                    Allow backorder
                  </label>
                </div>

                <div>
                  <label className="label">SEO Title</label>
                  <input
                    className="input"
                    name="meta_title"
                    value={formData.meta_title}
                    onChange={handleInputChange}
                    placeholder="SEO meta title"
                  />
                </div>

                <div>
                  <label className="label">SEO Description</label>
                  <textarea
                    className="input h-20"
                    name="meta_description"
                    value={formData.meta_description}
                    onChange={handleInputChange}
                    placeholder="SEO meta description"
                  />
                </div>

                <div className="flex gap-2">
                  <button type="submit" className="btn btn-primary" disabled={mutationLoading}>
                    {mutationLoading ? 'Saving...' : 'Save Changes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-outline"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  {product.short_description && (
                    <p className="text-gray-600 mb-4">{product.short_description}</p>
                  )}
                  {product.description && (
                    <div className="prose max-w-none">
                      <p className="text-gray-700">{product.description}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Price</label>
                    <p className="text-lg font-semibold">
                      ৳{product.base_price?.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Stock</label>
                    <p className="text-lg font-semibold">{product.inventory_quantity || 0}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">SKU</label>
                    <p className="text-lg font-semibold">{product.sku || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <span
                      className={`badge ${product.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {product.is_active ? 'Active' : 'Draft'}
                    </span>
                  </div>
                </div>

                {product.category && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Category</label>
                    <p className="text-lg font-semibold">{product.category.name}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Product Images</label>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    {product.images && product.images.length > 0 ? (
                      product.images.map((image: any, index: number) => (
                        <img
                          key={index}
                          src={image.image_url}
                          alt={image.alt_text || `Product image ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg border"
                        />
                      ))
                    ) : (
                      <div className="col-span-2 h-32 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
                        No images
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Track Inventory:</span>
                    <span className={product.track_inventory ? 'text-green-600' : 'text-gray-500'}>
                      {product.track_inventory ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">Allow Backorder:</span>
                    <span className={product.allow_backorder ? 'text-green-600' : 'text-gray-500'}>
                      {product.allow_backorder ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                {product.weight && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Weight</label>
                    <p className="text-lg font-semibold">
                      {product.weight} {product.weight_unit}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
