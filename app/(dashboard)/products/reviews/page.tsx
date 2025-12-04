'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabaseClient } from '@/lib';
import { logger } from '@/lib/utils/logger';

interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string;
  rating: number;
  review_text: string;
  reviewer_name: string;
  reviewer_email: string;
  is_verified: boolean;
  is_approved: boolean;
  created_at: string;
  product?: {
    name: string;
  };
  customer?: {
    full_name: string;
  };
}

export default function ProductReviews() {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'approved' | 'pending'>('all');

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const fetchReviews = async () => {
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

      // Build query
      let query = supabaseClient
        .from('product_reviews')
        .select(
          `
          *,
          product:products(name),
          customer:customers(full_name)
        `
        )
        .eq('shop_id', user.id)
        .order('created_at', { ascending: false });

      // Apply filter
      if (filter === 'approved') {
        query = query.eq('is_approved', true);
      } else if (filter === 'pending') {
        query = query.eq('is_approved', false);
      }

      const { data: reviewsData, error: reviewsError } = await query;

      if (reviewsError) {
        setError(reviewsError.message);
        return;
      }

      setReviews(reviewsData || []);
    } catch (err: any) {
      logger.error(
        'Error fetching product reviews',
        err instanceof Error ? err : new Error(String(err))
      );
      setError(err.message || 'Failed to fetch product reviews');
    } finally {
      setLoading(false);
    }
  };

  const approveReview = async (reviewId: string) => {
    try {
      const { error } = await supabaseClient
        .from('product_reviews')
        .update({ is_approved: true })
        .eq('id', reviewId);

      if (error) throw error;

      // Refresh reviews
      fetchReviews();
    } catch (err: any) {
      logger.error('Error approving review', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to approve review');
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
      const { error } = await supabaseClient.from('product_reviews').delete().eq('id', reviewId);

      if (error) throw error;

      // Refresh reviews
      fetchReviews();
    } catch (err: any) {
      logger.error('Error deleting review', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to delete review');
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading reviews...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid gap-4">
        <h1 className="text-2xl font-bold">Product Reviews</h1>
        <div className="card">
          <div className="card-pad">
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">Error: {error}</p>
              <button onClick={fetchReviews} className="btn btn-outline">
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
        <h1 className="text-2xl font-bold">Product Reviews</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-outline'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('approved')}
            className={`btn ${filter === 'approved' ? 'btn-primary' : 'btn-outline'}`}
          >
            Approved
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`btn ${filter === 'pending' ? 'btn-primary' : 'btn-outline'}`}
          >
            Pending
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-pad">
          {reviews.length > 0 ? (
            <div className="grid gap-4">
              {reviews.map((review) => (
                <div key={review.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <Link
                        href={`/products/${review.product_id}`}
                        className="font-medium text-brand-indigo hover:underline"
                      >
                        {(review.product as any)?.name || 'Product'}
                      </Link>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">
                          by{' '}
                          {review.reviewer_name ||
                            (review.customer as any)?.full_name ||
                            'Anonymous'}
                        </span>
                        {review.is_verified && (
                          <span className="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded">
                            Verified
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!review.is_approved && (
                        <button
                          onClick={() => approveReview(review.id)}
                          className="text-sm text-green-600 hover:underline"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => deleteReview(review.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-gray-700 mt-2">{review.review_text}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span>{new Date(review.created_at).toLocaleDateString()}</span>
                    {review.is_approved ? (
                      <span className="text-green-600">Approved</span>
                    ) : (
                      <span className="text-orange-600">Pending Approval</span>
                    )}
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
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
                <p className="text-lg font-medium">No reviews yet</p>
                <p className="text-sm mt-2">
                  Product reviews will appear here once customers leave feedback
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
