'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCategories, useProductMutations } from '@/lib/hooks/useProducts';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';
import type { ProductInsert } from '@/lib/types/database';

export default function NewProduct() {
  const router = useRouter();
  const { categories, loading: categoriesLoading } = useCategories();
  const { createProduct, loading: saving, error } = useProductMutations();

  // User/shop state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userLoading, setUserLoading] = useState(true);

  // Form state
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

  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get current user on component mount
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: user } = await supabaseClient.auth.getUser();
        if (user?.user) {
          setCurrentUser(user.user);
        } else {
          // Redirect to login if not authenticated
          router.push('/login');
        }
      } catch (error) {
        logger.error(
          'Error getting current user',
          error instanceof Error ? error : new Error(String(error))
        );
        router.push('/login');
      } finally {
        setUserLoading(false);
      }
    };

    getUser();
  }, [router]);

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

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...images, ...files].slice(0, 3); // Limit to 3 images
    setImages(newImages);

    // Create previews
    const newPreviews = newImages.map((file) => URL.createObjectURL(file));
    setImagePreviews(newPreviews);
  };

  // Remove image
  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setImages(newImages);
    setImagePreviews(newPreviews);
  };

  // Generate slug from name
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.base_price) {
      alert('Please fill in required fields (Name and Price)');
      return;
    }

    try {
      // Create product data
      const productData: ProductInsert = {
        shop_id: currentUser.id, // Use authenticated user's ID as shop_id
        name: formData.name,
        slug: generateSlug(formData.name),
        description: formData.description,
        short_description: formData.short_description,
        category_id: formData.category_id || undefined,
        base_price: formData.base_price,
        inventory_quantity: formData.inventory_quantity,
        track_inventory: formData.track_inventory,
        allow_backorder: formData.allow_backorder,
        weight: formData.weight || undefined,
        weight_unit: formData.weight_unit,
        sku: formData.sku || undefined,
        barcode: formData.barcode || undefined,
        is_active: formData.is_active,
        is_featured: false,
        has_variants: false,
        meta_title: formData.meta_title || undefined,
        meta_description: formData.meta_description || undefined,
      };

      // Create product with images
      const product = await createProduct(productData, images.length > 0 ? images : undefined);

      // Redirect to products list or edit page
      router.push('/products');
    } catch (err) {
      logger.error('Error creating product', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to create product. Please try again.');
    }
  };

  return (
    <div className="grid gap-4">
      <h1 className="text-2xl font-bold">Add Product</h1>

      {userLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="text-gray-500">Loading...</div>
        </div>
      )}

      {!userLoading && !currentUser && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Please log in to create products.
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {!userLoading && currentUser && (
        <form onSubmit={handleSubmit} className="card">
          <div className="card-pad grid gap-4 md:grid-cols-2">
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

              <div>
                <label className="label">Category</label>
                <select
                  className="input"
                  name="category_id"
                  value={formData.category_id}
                  onChange={handleInputChange}
                  disabled={categoriesLoading}
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Weight</label>
                  <input
                    className="input"
                    type="number"
                    step="0.1"
                    name="weight"
                    value={formData.weight}
                    onChange={handleInputChange}
                    placeholder="0.0"
                  />
                </div>
                <div>
                  <label className="label">Weight Unit</label>
                  <select
                    className="input"
                    name="weight_unit"
                    value={formData.weight_unit}
                    onChange={handleInputChange}
                  >
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="lb">lb</option>
                    <option value="oz">oz</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid gap-3">
              <div>
                <label className="label">Product Images</label>
                <div className="grid grid-cols-3 gap-3">
                  {imagePreviews.map((preview, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-xl border border-dashed overflow-hidden"
                    >
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  {imagePreviews.length < 3 && (
                    <div
                      className="aspect-square rounded-xl border border-dashed grid place-items-center text-sm text-gray-500 cursor-pointer hover:bg-gray-50"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <div>
                <label className="label mt-4">Product Status</label>
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

              <button type="submit" className="btn btn-primary mt-4 w-full" disabled={saving}>
                {saving ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
