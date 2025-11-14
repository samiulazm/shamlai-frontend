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

  useEffect(() => {
    // Check for existing session
    checkUser();

    // Listen for auth state changes
    const { data: authListener } = insforgeClient.auth.onAuthStateChange(
      async (event, session) => {
        logger.info('Auth state changed', { event });

        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            nickname: session.user.user_metadata?.nickname,
            role: session.user.user_metadata?.role || 'merchant',
          });
        } else {
          setUser(null);
        }

        setLoading(false);
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const checkUser = async () => {
    try {
      const { data, error } = await insforgeClient.auth.getCurrentUser();

      if (error) {
        logger.error('Failed to get current user', error);
        setUser(null);
      } else if (data) {
        setUser({
          id: data.id,
          email: data.email || '',
          nickname: data.user_metadata?.nickname,
          role: data.user_metadata?.role || 'merchant',
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
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.user.user_metadata?.nickname,
          role: data.user.user_metadata?.role || 'merchant',
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
        options: {
          data: {
            nickname: shopName || email.split('@')[0],
            role: 'merchant',
          },
        },
      });

      if (error) {
        return { error };
      }

      if (data?.user) {
        // Create shop settings
        try {
          await insforgeClient.database
            .from('shop_settings')
            .insert({
              shop_id: data.user.id,
              shop_name: shopName || 'My Shop',
              shop_email: email,
              currency: 'USD',
              timezone: 'UTC',
              weight_unit: 'kg',
              enable_reviews: true,
              enable_wishlists: true,
              enable_guest_checkout: true,
            });
        } catch (shopError) {
          logger.warn('Failed to create shop settings', shopError instanceof Error ? shopError : new Error(String(shopError)));
        }

        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: shopName,
          role: 'merchant',
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
      await insforgeClient.auth.signOut();
      setUser(null);
    } catch (err) {
      logger.error('Sign out error', err instanceof Error ? err : new Error(String(err)));
    }
  };

  const refreshSession = async () => {
    try {
      const { data, error } = await insforgeClient.auth.refreshSession();

      if (error) {
        logger.error('Failed to refresh session', error);
        setUser(null);
      } else if (data?.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || '',
          nickname: data.user.user_metadata?.nickname,
          role: data.user.user_metadata?.role || 'merchant',
        });
      }
    } catch (err) {
      logger.error('Error refreshing session', err instanceof Error ? err : new Error(String(err)));
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
