// React hooks for shop settings and configuration
'use client';

import { useState, useEffect } from 'react';
import type { ShopSettings, PaymentMethod, ShippingMethod } from '../types/database';
import * as shopService from '../services/shop';

/**
 * Hook to fetch shop settings
 */
export function useShopSettings(shopId: string) {
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchSettings() {
      try {
        setLoading(true);
        const data = await shopService.getShopSettings(shopId);
        if (mounted) {
          setSettings(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch shop settings');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (shopId) {
      fetchSettings();
    }

    return () => {
      mounted = false;
    };
  }, [shopId]);

  const updateSettings = async (updates: Partial<ShopSettings>) => {
    try {
      setLoading(true);
      setError(null);
      const updated = await shopService.upsertShopSettings(shopId, updates);
      setSettings(updated);
      setLoading(false);
      return updated;
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
      setLoading(false);
      throw err;
    }
  };

  return { settings, loading, error, updateSettings };
}

/**
 * Hook to fetch payment methods
 */
export function usePaymentMethods(shopId: string) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMethods() {
      try {
        setLoading(true);
        const data = await shopService.getPaymentMethods(shopId);
        if (mounted) {
          setMethods(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch payment methods');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (shopId) {
      fetchMethods();
    }

    return () => {
      mounted = false;
    };
  }, [shopId]);

  return { methods, loading, error };
}

/**
 * Hook to fetch shipping methods
 */
export function useShippingMethods(shopId: string) {
  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function fetchMethods() {
      try {
        setLoading(true);
        const data = await shopService.getShippingMethods(shopId);
        if (mounted) {
          setMethods(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to fetch shipping methods');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    if (shopId) {
      fetchMethods();
    }

    return () => {
      mounted = false;
    };
  }, [shopId]);

  return { methods, loading, error };
}





