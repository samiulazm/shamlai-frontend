// Marketing Service - Discount codes, reviews, wishlists, and email marketing
import { insforgeClient, STORAGE_BUCKETS } from '../insforge';
import { logger } from '../utils/logger';
import type {
  DiscountCode,
  ProductReview,
  ReviewImage,
  Wishlist,
  EmailSubscriber,
  PaginatedResponse,
  QueryFilters
} from '../types/database';

// ============================================================================
// Discount Codes
// ============================================================================

/**
 * Get all discount codes for a shop
 */
export async function getDiscountCodes(
  shopId: string,
  filters?: QueryFilters & { isActive?: boolean }
): Promise<PaginatedResponse<DiscountCode>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = insforgeClient.database
      .from('discount_codes')
      .select('*', { count: 'exact' })
      .eq('shop_id', shopId);

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    }

    if (filters?.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query
      .order(filters?.sortBy || 'created_at', {
        ascending: filters?.sortOrder === 'asc'
      })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize
    };
  } catch (error: any) {
    logger.error('Error fetching discount codes', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      filters,
    });
    throw error;
  }
}

/**
 * Create a new discount code
 */
export async function createDiscountCode(
  discountData: Omit<DiscountCode, 'id' | 'created_at' | 'updated_at' | 'usage_count'>
): Promise<DiscountCode> {
  try {
    const { data, error } = await insforgeClient.database
      .from('discount_codes')
      .insert([{ ...discountData, usage_count: 0 }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error creating discount code', error instanceof Error ? error : new Error(String(error)), {
      shopId: discountData.shop_id,
      code: discountData.code,
    });
    throw error;
  }
}

/**
 * Update a discount code
 */
export async function updateDiscountCode(
  codeId: string,
  updates: Partial<DiscountCode>
): Promise<DiscountCode> {
  try {
    const { data, error } = await insforgeClient.database
      .from('discount_codes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', codeId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error updating discount code', error instanceof Error ? error : new Error(String(error)), {
      codeId,
    });
    throw error;
  }
}

/**
 * Validate and apply discount code
 */
export async function validateDiscountCode(
  shopId: string,
  code: string,
  customerId?: string,
  subtotal?: number
): Promise<{
  isValid: boolean;
  discount?: DiscountCode;
  reason?: string;
}> {
  try {
    const { data: discount, error } = await insforgeClient.database
      .from('discount_codes')
      .select('*')
      .eq('shop_id', shopId)
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !discount) {
      return { isValid: false, reason: 'Invalid discount code' };
    }

    const now = new Date();

    // Check start date
    if (discount.starts_at && new Date(discount.starts_at) > now) {
      return { isValid: false, reason: 'Discount code not yet active' };
    }

    // Check expiration
    if (discount.expires_at && new Date(discount.expires_at) < now) {
      return { isValid: false, reason: 'Discount code has expired' };
    }

    // Check usage limit
    if (discount.usage_limit && discount.usage_count >= discount.usage_limit) {
      return { isValid: false, reason: 'Discount code usage limit reached' };
    }

    // Check per-customer usage limit
    if (discount.usage_limit_per_customer && customerId) {
      const { data: usages } = await insforgeClient.database
        .from('discount_code_usage')
        .select('*')
        .eq('discount_code_id', discount.id)
        .eq('customer_id', customerId);

      if (usages && usages.length >= discount.usage_limit_per_customer) {
        return { isValid: false, reason: 'You have already used this discount code' };
      }
    }

    // Check minimum purchase
    if (discount.minimum_purchase && subtotal && subtotal < discount.minimum_purchase) {
      return {
        isValid: false,
        reason: `Minimum purchase of $${discount.minimum_purchase} required`
      };
    }

    return { isValid: true, discount };
  } catch (error: any) {
    logger.error('Error validating discount code', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      code,
    });
    return { isValid: false, reason: 'Error validating discount code' };
  }
}

// ============================================================================
// Product Reviews
// ============================================================================

/**
 * Get product reviews
 */
export async function getProductReviews(
  productId: string,
  filters?: QueryFilters & { isApproved?: boolean }
): Promise<PaginatedResponse<ProductReview & { images?: ReviewImage[] }>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;
    const offset = (page - 1) * pageSize;

    let query = insforgeClient.database
      .from('product_reviews')
      .select('*', { count: 'exact' })
      .eq('product_id', productId);

    if (filters?.isApproved !== undefined) {
      query = query.eq('is_approved', filters.isApproved);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data: reviews, error, count } = await query;

    if (error) throw error;

    // Fetch images for each review
    const reviewsWithImages = await Promise.all(
      (reviews || []).map(async (review) => {
        const { data: images } = await insforgeClient.database
          .from('review_images')
          .select('*')
          .eq('review_id', review.id);

        return {
          ...review,
          images: images || []
        };
      })
    );

    return {
      data: reviewsWithImages,
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize
    };
  } catch (error: any) {
    logger.error('Error fetching product reviews', error instanceof Error ? error : new Error(String(error)), {
      productId,
      filters,
    });
    throw error;
  }
}

/**
 * Create a product review
 */
export async function createProductReview(
  reviewData: Omit<ProductReview, 'id' | 'created_at' | 'updated_at' | 'helpful_count' | 'is_approved'>,
  images?: File[]
): Promise<ProductReview> {
  try {
    // Check if customer has purchased the product
    const { data: orderItem } = await insforgeClient.database
      .from('order_items')
      .select('*, orders!inner(customer_id)')
      .eq('product_id', reviewData.product_id)
      .eq('orders.customer_id', reviewData.customer_id)
      .limit(1)
      .single();

    const verifiedPurchase = !!orderItem;

    // Create review
    const { data: review, error } = await insforgeClient.database
      .from('product_reviews')
      .insert([{
        ...reviewData,
        verified_purchase: verifiedPurchase,
        is_approved: false, // Requires approval
        helpful_count: 0
      }])
      .select()
      .single();

    if (error) throw error;

    // Upload review images
    if (images && images.length > 0) {
      const uploadPromises = images.map(async (file, index) => {
        const fileName = `review-${review.id}-${Date.now()}-${index}.${file.name.split('.').pop()}`;
        
        const { data: uploadData, error: uploadError } = await insforgeClient.storage
          .from(STORAGE_BUCKETS.REVIEW_IMAGES)
          .upload(fileName, file);

        if (uploadError || !uploadData) throw uploadError || new Error('Upload failed');

        return {
          review_id: review.id,
          image_url: uploadData.url,
          image_key: uploadData.key
        };
      });

      const imageRecords = await Promise.all(uploadPromises);

      await insforgeClient.database
        .from('review_images')
        .insert(imageRecords);
    }

    return review;
  } catch (error: any) {
    logger.error('Error creating product review', error instanceof Error ? error : new Error(String(error)), {
      productId: reviewData.product_id,
      customerId: reviewData.customer_id,
    });
    throw error;
  }
}

/**
 * Update review helpful count
 */
export async function markReviewHelpful(reviewId: string): Promise<ProductReview> {
  try {
    // Get current count
    const { data: review } = await insforgeClient.database
      .from('product_reviews')
      .select('helpful_count')
      .eq('id', reviewId)
      .single();

    const { data, error } = await insforgeClient.database
      .from('product_reviews')
      .update({
        helpful_count: (review?.helpful_count || 0) + 1,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error marking review helpful', error instanceof Error ? error : new Error(String(error)), {
      reviewId,
    });
    throw error;
  }
}

/**
 * Approve a review
 */
export async function approveReview(reviewId: string): Promise<ProductReview> {
  try {
    const { data, error } = await insforgeClient.database
      .from('product_reviews')
      .update({
        is_approved: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error approving review', error instanceof Error ? error : new Error(String(error)), {
      reviewId,
    });
    throw error;
  }
}

/**
 * Get product rating statistics
 */
export async function getProductRatingStats(productId: string): Promise<{
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
}> {
  try {
    const { data: reviews, error } = await insforgeClient.database
      .from('product_reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('is_approved', true);

    if (error) throw error;

    const totalReviews = reviews?.length || 0;
    const averageRating =
      totalReviews > 0
        ? reviews!.reduce((sum, r) => sum + r.rating, 0) / totalReviews
        : 0;

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews?.forEach((r) => {
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    });

    return {
      averageRating,
      totalReviews,
      ratingDistribution
    };
  } catch (error: any) {
    logger.error('Error fetching product rating stats', error instanceof Error ? error : new Error(String(error)), {
      productId,
    });
    throw error;
  }
}

// ============================================================================
// Wishlists
// ============================================================================

/**
 * Get customer wishlist
 */
export async function getWishlist(customerId: string): Promise<Wishlist[]> {
  try {
    const { data, error } = await insforgeClient.database
      .from('wishlists')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error: any) {
    logger.error('Error fetching wishlist', error instanceof Error ? error : new Error(String(error)), {
      customerId,
    });
    throw error;
  }
}

/**
 * Add product to wishlist
 */
export async function addToWishlist(
  customerId: string,
  productId: string,
  variantId?: string
): Promise<Wishlist> {
  try {
    // Check if already in wishlist
    let query = insforgeClient.database
      .from('wishlists')
      .select('*')
      .eq('customer_id', customerId)
      .eq('product_id', productId);

    if (variantId) {
      query = query.eq('variant_id', variantId);
    }

    const { data: existing } = await query.single();

    if (existing) {
      return existing;
    }

    // Add to wishlist
    const { data, error } = await insforgeClient.database
      .from('wishlists')
      .insert([{
        customer_id: customerId,
        product_id: productId,
        variant_id: variantId
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error adding to wishlist', error instanceof Error ? error : new Error(String(error)), {
      customerId,
      productId,
    });
    throw error;
  }
}

/**
 * Remove product from wishlist
 */
export async function removeFromWishlist(wishlistId: string): Promise<void> {
  try {
    const { error } = await insforgeClient.database
      .from('wishlists')
      .delete()
      .eq('id', wishlistId);

    if (error) throw error;
  } catch (error: any) {
    logger.error('Error removing from wishlist', error instanceof Error ? error : new Error(String(error)), {
      wishlistId,
    });
    throw error;
  }
}

// ============================================================================
// Email Marketing
// ============================================================================

/**
 * Subscribe email to newsletter
 */
export async function subscribeToNewsletter(
  shopId: string,
  email: string,
  source?: string
): Promise<EmailSubscriber> {
  try {
    const { data, error } = await insforgeClient.database
      .from('email_subscribers')
      .upsert([{
        shop_id: shopId,
        email,
        status: 'active',
        source: source || 'website'
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: any) {
    logger.error('Error subscribing to newsletter', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      email,
    });
    throw error;
  }
}

/**
 * Unsubscribe from newsletter
 */
export async function unsubscribeFromNewsletter(
  shopId: string,
  email: string
): Promise<void> {
  try {
    const { error } = await insforgeClient.database
      .from('email_subscribers')
      .update({
        status: 'unsubscribed',
        updated_at: new Date().toISOString()
      })
      .eq('shop_id', shopId)
      .eq('email', email);

    if (error) throw error;
  } catch (error: any) {
    logger.error('Error unsubscribing from newsletter', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      email,
    });
    throw error;
  }
}

/**
 * Get all subscribers
 */
export async function getSubscribers(
  shopId: string,
  filters?: QueryFilters & { status?: 'active' | 'unsubscribed' | 'bounced' }
): Promise<PaginatedResponse<EmailSubscriber>> {
  try {
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 50;
    const offset = (page - 1) * pageSize;

    let query = insforgeClient.database
      .from('email_subscribers')
      .select('*', { count: 'exact' })
      .eq('shop_id', shopId);

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      data: data || [],
      total: count || 0,
      page,
      pageSize,
      hasMore: (count || 0) > offset + pageSize
    };
  } catch (error: any) {
    logger.error('Error fetching subscribers', error instanceof Error ? error : new Error(String(error)), {
      shopId,
      filters,
    });
    throw error;
  }
}

