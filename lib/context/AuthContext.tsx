'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseClient } from '@/lib/supabase';
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
      const { data, error } = await supabaseClient
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

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        checkUser();
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
      }
    });

    // Fallback polling if onAuthStateChange is not available
    const interval = setInterval(
      () => {
        checkUser();
      },
      5 * 60 * 1000
    );

    return () => {
      subscription?.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await supabaseClient.auth.getUser();

      if (error) {
        logger.error('Failed to get current user', error);
        setUser(null);
      } else if (data?.user) {
        // Fetch shop_id from shop_settings
        const shopId = await getShopIdByUserId(data.user.id);

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.user.user_metadata?.nickname || '',
          role: data.user.user_metadata?.role || 'merchant',
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
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Fetch shop ID
        const shopId = await getShopIdByUserId(data.user.id);

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.user.user_metadata?.nickname || '',
          role: data.user.user_metadata?.role || 'merchant',
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
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            nickname: shopName || email.split('@')[0],
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Set user immediately - shop creation is handled by signup page via /api/auth/complete-signup
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: shopName || email.split('@')[0],
          role: 'merchant',
          // shop_id will be set after shop creation via checkUser()
        });
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
      await supabaseClient.auth.signOut();
      setUser(null);
    } catch (err) {
      logger.error('Sign out error', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const refreshSession = async () => {
    try {
      // Refresh the session using Supabase
      const { data, error } = await supabaseClient.auth.refreshSession();

      if (error) {
        logger.error('Failed to refresh session', error);
      }

      // Update user state after refresh
      await checkUser();
    } catch (err) {
      logger.error('Refresh session error', err instanceof Error ? err : new Error(String(err)));
      // Fallback to checkUser
      await checkUser();
    }
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
