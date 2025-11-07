// React hooks for product operations
'use client';

import { useState, useEffect, useRef } from 'react';
import type { Product, Category, PaginatedResponse, QueryFilters, ProductInsert, ProductUpdate, ProductImage, ProductVariant } from '../types/database';
import * as productService from '../services/products';

/**
 * Custom hook to create stable reference for filters
 */
function useStableFilters(filters?: QueryFilters) {
  const filtersRef = useRef<string>('');
  const currentFilters = JSON.stringify(filters || {});

  if (filtersRef.current !== currentFilters) {
    filtersRef.current = currentFilters;
  }

  return filtersRef.current;
}

/**
 * Hook to fetch products with pagination and filtering
 */
export function useProducts(shopId: string, filters?: QueryFilters) {
  const [products, setProducts] = useState<PaginatedResponse<Product> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const stableFilters = useStableFilters(filters);

  useEffect(() => {
    let mounted = true;

    async function fetchProducts() {
      try {
        setLoading(true);
        const data = await productService.getProducts(shopId, filters);
        if (mounted) {
          setProducts(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch products');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      mounted = false;
    };
  }, [shopId, stableFilters]);

  return { products, loading, error };
}

/**
 * Hook to fetch a single product by ID
 */
export function useProduct(productId: string) {
  const [product, setProduct] = useState<(Product & {
    images?: ProductImage[];
    variants?: ProductVariant[];
    category?: Category;
  }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchProduct() {
      try {
        setLoading(true);
        const data = await productService.getProductById(productId);
        if (mounted) {
          setProduct(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch product');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (productId) {
      fetchProduct();
    }

    return () => {
      mounted = false;
    };
  }, [productId]);

  return { product, loading, error };
}

/**
 * Hook to fetch categories
 */
export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchCategories() {
      try {
        setLoading(true);
        const data = await productService.getCategories();
        if (mounted) {
          setCategories(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch categories');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchCategories();

    return () => {
      mounted = false;
    };
  }, []);

  return { categories, loading, error };
}

/**
 * Hook for product mutations (create, update, delete)
 */
export function useProductMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createProduct = async (productData: ProductInsert, images?: File[]) => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.createProduct(productData, images);
      setLoading(false);
      return product;
    } catch (err: any) {
      setError(err.message || 'Failed to create product');
      setLoading(false);
      throw err;
    }
  };

  const updateProduct = async (productId: string, updates: ProductUpdate) => {
    try {
      setLoading(true);
      setError(null);
      const product = await productService.updateProduct(productId, updates);
      setLoading(false);
      return product;
    } catch (err: any) {
      setError(err.message || 'Failed to update product');
      setLoading(false);
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      setLoading(true);
      setError(null);
      await productService.deleteProduct(productId);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to delete product');
      setLoading(false);
      throw err;
    }
  };

  const updateInventory = async (
    productId: string,
    quantityChange: number,
    variantId?: string,
    reason?: string
  ) => {
    try {
      setLoading(true);
      setError(null);
      await productService.updateInventory(productId, quantityChange, variantId, reason);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update inventory');
      setLoading(false);
      throw err;
    }
  };

  return {
    createProduct,
    updateProduct,
    deleteProduct,
    updateInventory,
    loading,
    error
  };
}



