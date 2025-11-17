'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { insforgeClient } from '@/lib/insforge';
import { logger } from '@/lib/utils/logger';

interface User {
  id: string;
  email: string;
  nickname?: string;
  role?: string;
  shop_id?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, shopName?: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Helper function to get shop_id from shop_settings by user_id
  const getShopIdByUserId = async (userId: string): Promise<string | undefined> => {
    try {
      const { data, error } = await insforgeClient.database
        .from('shop_settings')
        .select('shop_id')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        return undefined;
      }

      return data.shop_id;
    } catch (err) {
      logger.warn('Failed to fetch shop_id', err instanceof Error ? err : new Error(String(err)));
      return undefined;
    }
  };

  useEffect(() => {
    // Check for existing session
    checkUser();

    // Note: @insforge/sdk doesn't have onAuthStateChange yet
    // Polling for session changes every 5 minutes as a workaround
    const interval = setInterval(
      () => {
        checkUser();
      },
      5 * 60 * 1000
    );

    return () => {
      clearInterval(interval);
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await insforgeClient.auth.getCurrentUser();

      if (error) {
        logger.error('Failed to get current user', error);
        setUser(null);
      } else if (data?.user) {
        // Fetch shop_id from shop_settings
        const shopId = await getShopIdByUserId(data.user.id);

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.profile?.nickname || '',
          role: data.profile?.role || 'merchant',
          shop_id: shopId,
        });
      }
    } catch (err) {
      logger.error('Error checking user', err instanceof Error ? err : new Error(String(err)));
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await insforgeClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Fetch full user profile
        const userProfile = await insforgeClient.auth.getCurrentUser();
        const shopId = await getShopIdByUserId(data.user.id);

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: userProfile.data?.profile?.nickname || '',
          role: userProfile.data?.profile?.role || 'merchant',
          shop_id: shopId,
        });
      }

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Sign in error', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, shopName?: string) => {
    try {
      const { data, error } = await insforgeClient.auth.signUp({
        email,
        password,
        name: shopName || email.split('@')[0],
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Set profile with nickname and role
        try {
          await insforgeClient.auth.setProfile({
            nickname: shopName || email.split('@')[0],
            role: 'merchant',
          });
        } catch (profileError) {
          logger.warn(
            'Failed to set user profile',
            profileError instanceof Error ? profileError : new Error(String(profileError))
          );
        }

        // Create shop settings
        try {
          // Generate a unique subdomain for the shop
          const { generateUniqueSubdomain, generateUniqueShopId } = await import(
            '@/lib/services/shop'
          );
          const preferred = (shopName || email.split('@')[0] || 'shop').toString();
          const subdomain = await generateUniqueSubdomain(preferred);
          const shopId = await generateUniqueShopId();

          await insforgeClient.database.from('shop_settings').insert({
            user_id: data.user.id,
            shop_id: shopId,
            shop_name: shopName || 'My Shop',
            shop_username: subdomain,
            subdomain,
            shop_email: email,
            currency: 'USD',
            timezone: 'UTC',
            weight_unit: 'kg',
            enable_reviews: true,
            enable_wishlists: true,
            enable_guest_checkout: true,
          });

          // Set user with the generated shop_id
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            nickname: shopName,
            role: 'merchant',
            shop_id: shopId,
          });
        } catch (shopError) {
          logger.warn(
            'Failed to create shop settings',
            shopError instanceof Error ? shopError : new Error(String(shopError))
          );

          // Set user even if shop creation failed
          setUser({
            id: data.user.id,
            email: data.user.email || '',
            nickname: shopName,
            role: 'merchant',
          });
        }
      }

      return { error: null };
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      logger.error('Sign up error', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await insforgeClient.auth.signOut();
      setUser(null);
    } catch (err) {
      logger.error('Sign out error', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const refreshSession = async () => {
    // Note: @insforge/sdk doesn't have refreshSession method yet
    // Using checkUser as a workaround to refresh user state
    await checkUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
