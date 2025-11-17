'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  price: number;
  compare_at_price?: number;
  image: string;
  rating?: number;
  review_count?: number;
  in_stock: boolean;
  discount_percentage?: number;
}

interface MobileProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => Promise<void>;
  onToggleWishlist?: (productId: string) => Promise<void>;
  isWishlisted?: boolean;
}

export function MobileProductCard({
  product,
  onAddToCart,
  onToggleWishlist,
  isWishlisted = false,
}: MobileProductCardProps) {
  const [isWishlistedState, setIsWishlisted] = useState(isWishlisted);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!product.in_stock || !onAddToCart) return;

    setIsAddingToCart(true);
    try {
      await onAddToCart(product.id);
      toast.success('Added to cart!');
    } catch (error) {
      toast.error('Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!onToggleWishlist) return;

    try {
      await onToggleWishlist(product.id);
      setIsWishlisted(!isWishlistedState);
      toast.success(
        isWishlistedState ? 'Removed from wishlist' : 'Added to wishlist'
      );
    } catch (error) {
      toast.error('Failed to update wishlist');
    }
  };

  const discountPercentage =
    product.discount_percentage ||
    (product.compare_at_price
      ? Math.round(
          ((product.compare_at_price - product.price) /
            product.compare_at_price) *
            100
        )
      : 0);

  return (
    <div className="group relative bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Image Container */}
      <Link
        href={`/products/${product.id}`}
        className="block relative aspect-square"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {discountPercentage > 0 && (
            <Badge variant="destructive" className="text-xs">
              -{discountPercentage}%
            </Badge>
          )}
          {!product.in_stock && (
            <Badge variant="secondary" className="text-xs">
              Out of Stock
            </Badge>
          )}
        </div>

        {/* Wishlist Button - Optimized for thumb reach */}
        <button
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm active:scale-95 transition-transform shadow-sm touch-target"
          aria-label={isWishlistedState ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-4 w-4',
              isWishlistedState
                ? 'fill-red-500 text-red-500'
                : 'text-gray-600'
            )}
          />
        </button>
      </Link>

      {/* Product Info */}
      <div className="p-3 space-y-2">
        <Link href={`/products/${product.id}`}>
          <h3 className="text-sm font-medium line-clamp-2 min-h-[2.5rem] text-gray-900 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        {product.rating && product.rating > 0 && (
          <div className="flex items-center gap-1">
            <div className="flex items-center">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'h-3 w-3',
                    i < Math.floor(product.rating || 0)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  )}
                />
              ))}
            </div>
            <span className="text-xs text-gray-600">
              ({product.review_count || 0})
            </span>
          </div>
        )}

        {/* Price Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-lg font-bold text-gray-900">
              ৳{product.price.toLocaleString('en-BD')}
            </span>
            {product.compare_at_price && (
              <span className="text-xs text-gray-500 line-through">
                ৳{product.compare_at_price.toLocaleString('en-BD')}
              </span>
            )}
          </div>

          {/* Add to Cart Button - Large touch target */}
          <Button
            size="sm"
            className="h-9 w-9 p-0 touch-target"
            disabled={!product.in_stock || isAddingToCart}
            onClick={handleAddToCart}
            aria-label="Add to cart"
          >
            {isAddingToCart ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <ShoppingCart className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile Product Grid
 */
interface MobileProductGridProps {
  products: Product[];
  onAddToCart?: (productId: string) => Promise<void>;
  onToggleWishlist?: (productId: string) => Promise<void>;
  wishlistedProducts?: Set<string>;
}

export function MobileProductGrid({
  products,
  onAddToCart,
  onToggleWishlist,
  wishlistedProducts = new Set(),
}: MobileProductGridProps) {
  return (
    <div className="mobile-grid thumb-zone-safe">
      {products.map((product) => (
        <MobileProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isWishlisted={wishlistedProducts.has(product.id)}
        />
      ))}
    </div>
  );
}
