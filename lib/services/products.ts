// Product Service - Comprehensive product management functions
import { supabaseClient, STORAGE_BUCKETS, uploadFileWithRetry, deleteFile } from '../supabase';
import { logger } from '../utils/logger';
import { cacheAside, getCached, setCached, invalidateCache, CACHE_TTL, REDIS_KEYS } from '../redis';
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductImage,
  ProductVariant,
  InventoryLog,
  Category,
  DatabaseResponse,
  PaginatedResponse,
  QueryFilters,
} from '../types/database';

// ============================================================================
// Product CRUD Operations
// ============================================================================

/**
 * Get all products with optional filtering and pagination
 * Cached for 3 minutes per page
 */
export async function getProducts(
  shopId: string,
  filters?: QueryFilters & {
    categoryId?: string;
    isActive?: boolean;
    isFeatured?: boolean;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<PaginatedResponse<Product>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    // Only cache simple queries (no complex filters)
    const canCache = !filters?.search && !filters?.minPrice && !filters?.maxPrice;
    const cacheKey = REDIS_KEYS.PRODUCT_LIST(shopId, page);

    if (canCache) {
      return await cacheAside(
        cacheKey,
        async () => await fetchProducts(shopId, filters, page, pageSize),
        CACHE_TTL.PRODUCT_LIST
      );
    }

    // Complex queries - no cache
    return await fetchProducts(shopId, filters, page, pageSize);
  } catch (error: any) {
    logger.error(
      'Error fetching products',
      error instanceof Error ? error : new Error(String(error)),
      {
        shopId,
        filters,
      }
    );
    throw error;
  }
}

/**
 * Internal function to fetch products from database
 */
async function fetchProducts(
  shopId: string,
  filters: any,
  page: number,
  pageSize: number
): Promise<PaginatedResponse<Product>> {
  const offset = (page - 1) * pageSize;

  let query = supabaseClient.from('products').select('*', { count: 'exact' }).eq('shop_id', shopId);

  // Apply filters
  if (filters?.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters?.isActive !== undefined) {
    query = query.eq('is_active', filters.isActive);
  }
  if (filters?.isFeatured !== undefined) {
    query = query.eq('is_featured', filters.isFeatured);
  }
  if (filters?.minPrice) {
    query = query.gte('base_price', filters.minPrice);
  }
  if (filters?.maxPrice) {
    query = query.lte('base_price', filters.maxPrice);
  }
  if (filters?.search) {
    query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
  }

  // Sorting
  const sortBy = filters?.sortBy || 'created_at';
  const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
  query = query.order(sortBy, sortOrder);

  // Pagination
  query = query.range(offset, offset + pageSize - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    data: data || [],
    total: count || 0,
    page,
    pageSize,
    hasMore: (count || 0) > offset + pageSize,
  };
}

/**
 * Get a single product by ID with images and variants
 * Cached for 5 minutes
 */
export async function getProductById(productId: string): Promise<
  Product & {
    images?: ProductImage[];
    variants?: ProductVariant[];
    category?: Category;
  }
> {
  try {
    const cacheKey = REDIS_KEYS.PRODUCT(productId);

    return await cacheAside(
      cacheKey,
      async () => {
        const { data: product, error } = await supabaseClient
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();

        if (error) throw error;
        if (!product) throw new Error('Product not found');

        // Fetch related data in parallel
        const [imagesResult, variantsResult, categoryResult] = await Promise.all([
          supabaseClient
            .from('product_images')
            .select('*')
            .eq('product_id', productId)
            .order('sort_order', { ascending: true }),

          supabaseClient
            .from('product_variants')
            .select('*')
            .eq('product_id', productId)
            .eq('is_active', true),

          product.category_id
            ? supabaseClient.from('categories').select('*').eq('id', product.category_id).single()
            : Promise.resolve({ data: null, error: null }),
        ]);

        return {
          ...product,
          images: imagesResult.data || [],
          variants: variantsResult.data || [],
          category: categoryResult.data || undefined,
        };
      },
      CACHE_TTL.PRODUCT
    );
  } catch (error: any) {
    logger.error(
      'Error fetching product',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
      }
    );
    throw error;
  }
}

/**
 * Get product by slug (for storefront)
 */
export async function getProductBySlug(slug: string, shopId?: string) {
  try {
    let query = supabaseClient.from('products').select('*').eq('slug', slug).eq('is_active', true);

    if (shopId) {
      query = query.eq('shop_id', shopId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    if (!data) throw new Error('Product not found');

    // Fetch related data
    return await getProductById(data.id);
  } catch (error: any) {
    logger.error(
      'Error fetching product by slug',
      error instanceof Error ? error : new Error(String(error)),
      {
        slug,
        shopId,
      }
    );
    throw error;
  }
}

/**
 * Create a new product
 */
export async function createProduct(productData: ProductInsert, images?: File[]): Promise<Product> {
  try {
    // Create product
    const { data: product, error: productError } = await supabaseClient
      .from('products')
      .insert([productData])
      .select()
      .single();

    if (productError) throw productError;

    // Upload and link images if provided
    if (images && images.length > 0) {
      await addProductImages(product.id, images);
    }

    // Invalidate product list cache for this shop
    await invalidateCache.productList(productData.shop_id);

    return product;
  } catch (error: any) {
    logger.error(
      'Error creating product',
      error instanceof Error ? error : new Error(String(error)),
      {
        productData: productData.name,
      }
    );
    throw error;
  }
}

/**
 * Update an existing product
 */
export async function updateProduct(productId: string, updates: ProductUpdate): Promise<Product> {
  try {
    const { data, error } = await supabaseClient
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;

    // Invalidate caches
    await Promise.all([
      invalidateCache.product(productId),
      invalidateCache.productList(data.shop_id),
    ]);

    return data;
  } catch (error: any) {
    logger.error(
      'Error updating product',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
      }
    );
    throw error;
  }
}

/**
 * Delete a product (soft delete by setting is_active to false)
 */
export async function deleteProduct(productId: string): Promise<void> {
  try {
    // Get product info first to invalidate shop cache
    const { data: product } = await supabaseClient
      .from('products')
      .select('shop_id')
      .eq('id', productId)
      .single();

    const { error } = await supabaseClient
      .from('products')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', productId);

    if (error) throw error;

    // Invalidate caches
    if (product?.shop_id) {
      await Promise.all([
        invalidateCache.product(productId),
        invalidateCache.productList(product.shop_id),
      ]);
    }
  } catch (error: any) {
    logger.error(
      'Error deleting product',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Product Images
// ============================================================================

/**
 * Add images to a product
 */
export async function addProductImages(productId: string, images: File[]): Promise<ProductImage[]> {
  try {
    const uploadPromises = images.map(async (file, index) => {
      const fileName = `product-${productId}-${Date.now()}-${index}.${file.name.split('.').pop()}`;

      // Use the new uploadFileWithRetry helper for better reliability
      const { data: uploadData, error: uploadError } = await uploadFileWithRetry(
        STORAGE_BUCKETS.PRODUCT_IMAGES,
        fileName,
        file
      );

      if (uploadError || !uploadData) throw uploadError || new Error('Upload failed');

      return {
        product_id: productId,
        image_url: uploadData.fullPath || '',
        image_key: uploadData.path || fileName,
        sort_order: index,
        is_primary: index === 0,
      };
    });

    const imageRecords = await Promise.all(uploadPromises);

    const { data, error } = await supabaseClient
      .from('product_images')
      .insert(imageRecords)
      .select();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error adding product images',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
        imageCount: images.length,
      }
    );
    throw error;
  }
}

/**
 * Delete a product image
 */
export async function deleteProductImage(imageId: string): Promise<void> {
  try {
    // Get image details first to delete from storage
    const { data: image, error: fetchError } = await supabaseClient
      .from('product_images')
      .select('*')
      .eq('id', imageId)
      .single();

    if (fetchError) throw fetchError;

    // Delete from storage using the new deleteFile helper
    if (image?.image_key) {
      await deleteFile(STORAGE_BUCKETS.PRODUCT_IMAGES, image.image_key);
    }

    // Delete from database
    const { error } = await supabaseClient.from('product_images').delete().eq('id', imageId);

    if (error) throw error;
  } catch (error: any) {
    logger.error(
      'Error deleting product image',
      error instanceof Error ? error : new Error(String(error)),
      {
        imageId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Product Variants
// ============================================================================

/**
 * Create product variant
 */
export async function createProductVariant(
  variantData: Omit<ProductVariant, 'id' | 'created_at' | 'updated_at'>
): Promise<ProductVariant> {
  try {
    const { data, error } = await supabaseClient
      .from('product_variants')
      .insert([variantData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error creating product variant',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId: variantData.product_id,
      }
    );
    throw error;
  }
}

/**
 * Update product variant
 */
export async function updateProductVariant(
  variantId: string,
  updates: Partial<ProductVariant>
): Promise<ProductVariant> {
  try {
    const { data, error } = await supabaseClient
      .from('product_variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', variantId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating product variant',
      error instanceof Error ? error : new Error(String(error)),
      {
        variantId,
      }
    );
    throw error;
  }
}

/**
 * Delete product variant
 */
export async function deleteProductVariant(variantId: string): Promise<void> {
  try {
    const { error } = await supabaseClient
      .from('product_variants')
      .update({ is_active: false })
      .eq('id', variantId);

    if (error) throw error;
  } catch (error: any) {
    logger.error(
      'Error deleting product variant',
      error instanceof Error ? error : new Error(String(error)),
      {
        variantId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Inventory Management
// ============================================================================

/**
 * Update inventory quantity
 */
export async function updateInventory(
  productId: string,
  quantityChange: number,
  variantId?: string,
  reason?: string,
  changeType: 'sale' | 'restock' | 'adjustment' | 'return' = 'adjustment',
  referenceId?: string,
  userId?: string
): Promise<void> {
  try {
    // Get current quantity
    let currentQuantity: number;

    if (variantId) {
      const { data: variant } = await supabaseClient
        .from('product_variants')
        .select('inventory_quantity')
        .eq('id', variantId)
        .single();
      currentQuantity = variant?.inventory_quantity || 0;
    } else {
      const { data: product } = await supabaseClient
        .from('products')
        .select('inventory_quantity')
        .eq('id', productId)
        .single();
      currentQuantity = product?.inventory_quantity || 0;
    }

    const newQuantity = currentQuantity + quantityChange;

    // Update quantity
    if (variantId) {
      await supabaseClient
        .from('product_variants')
        .update({ inventory_quantity: newQuantity })
        .eq('id', variantId);
    } else {
      await supabaseClient
        .from('products')
        .update({ inventory_quantity: newQuantity })
        .eq('id', productId);
    }

    // Log the change
    await supabaseClient.from('inventory_logs').insert([
      {
        product_id: productId,
        variant_id: variantId,
        change_type: changeType,
        quantity_change: quantityChange,
        quantity_after: newQuantity,
        reason,
        reference_id: referenceId,
        created_by: userId,
      },
    ]);
  } catch (error: any) {
    logger.error(
      'Error updating inventory',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
        variantId,
        quantityChange,
      }
    );
    throw error;
  }
}

/**
 * Get inventory logs for a product
 */
export async function getInventoryLogs(
  productId: string,
  variantId?: string
): Promise<InventoryLog[]> {
  try {
    let query = supabaseClient
      .from('inventory_logs')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching inventory logs',
      error instanceof Error ? error : new Error(String(error)),
      {
        productId,
        variantId,
      }
    );
    throw error;
  }
}

// ============================================================================
// Categories
// ============================================================================

/**
 * Get all categories for a shop
 */
export async function getCategories(shopId?: string): Promise<Category[]> {
  try {
    const query = supabaseClient
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error(
      'Error fetching categories',
      error instanceof Error ? error : new Error(String(error))
    );
    throw error;
  }
}

/**
 * Create a new category
 */
export async function createCategory(
  categoryData: Omit<Category, 'id' | 'created_at' | 'updated_at'>
): Promise<Category> {
  try {
    const { data, error } = await supabaseClient
      .from('categories')
      .insert([categoryData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error creating category',
      error instanceof Error ? error : new Error(String(error)),
      {
        categoryName: categoryData.name,
      }
    );
    throw error;
  }
}

/**
 * Update a category
 */
export async function updateCategory(
  categoryId: string,
  updates: Partial<Category>
): Promise<Category> {
  try {
    const { data, error } = await supabaseClient
      .from('categories')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', categoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error(
      'Error updating category',
      error instanceof Error ? error : new Error(String(error)),
      {
        categoryId,
      }
    );
    throw error;
  }
}

/**
 * Get products by category
 */
export async function getProductsByCategory(
  categoryId: string,
  filters?: QueryFilters
): Promise<PaginatedResponse<Product>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = supabaseClient
      .from('products')
      .select('*', { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_active', true);

    // Sorting
    const sortBy = filters?.sortBy || 'created_at';
    const sortOrder = filters?.sortOrder === 'asc' ? { ascending: true } : { ascending: false };
    query = query.order(sortBy, sortOrder);

    // Pagination
    query = query.range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize,
    };
  } catch (error: any) {
    logger.error(
      'Error fetching products by category',
      error instanceof Error ? error : new Error(String(error)),
      {
        categoryId,
        filters,
      }
    );
    throw error;
  }
}
