'use client';
import { useState, useEffect } from 'react';
import { Bell, Store, LogOut, User, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase';
import { logger } from '@/lib/utils/logger';

interface TopbarProps {
  title?: string;
  user?: any;
  shopId?: string;
  subdomain?: string;
}

export default function Topbar({ title, user, shopId, subdomain }: TopbarProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Generate storefront URL - prefer subdomain URL over path-based
  const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'shamlai.co';
  const storefrontUrl = subdomain
    ? `https://${subdomain}.${rootDomain}/`
    : shopId
      ? `/${shopId}`
      : null;

  // Debug: Log shop ID when it changes (development only)
  useEffect(() => {
    if (shopId && process.env.NODE_ENV === 'development') {
      logger.debug('Shop ID loaded', { shopId, subdomain, storefrontUrl });
    }
  }, [shopId, subdomain, storefrontUrl]);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      const { error } = await supabaseClient.auth.signOut();

      if (error) {
        logger.error('Logout error', error instanceof Error ? error : new Error(String(error)));
        alert('Failed to logout. Please try again.');
        setLoggingOut(false);
        return;
      }

      // Redirect to login
      router.push('/login');
    } catch (err) {
      logger.error('Logout error', err instanceof Error ? err : new Error(String(err)));
      alert('Failed to logout. Please try again.');
      setLoggingOut(false);
    }
  };

  const getUserInitials = () => {
    if (!user) return '?';
    const email = user.email || '';
    const nickname = user.user_metadata?.nickname || '';

    if (nickname) {
      return nickname.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  const getUserDisplayName = () => {
    if (!user) return 'User';
    return user.user_metadata?.nickname || user.email?.split('@')[0] || 'User';
  };

  return (
    <div className="sticky top-0 z-20 border-b bg-white">
      <div className="container-responsive h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5" style={{ color: 'var(--theme-primary)' }} />
          <span className="font-semibold">{title ?? 'Shamlai'}</span>
        </div>
        <div className="flex items-center gap-3">
          {subdomain ? (
            // External subdomain URL - use regular anchor
            <a
              href={storefrontUrl || '#'}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
              title="View your storefront in a new tab"
            >
              <Store className="h-4 w-4 mr-2" />
              View Storefront
            </a>
          ) : shopId ? (
            // Internal path - use Next.js Link (will redirect to subdomain via middleware)
            <Link
              href={`/${shopId}` as any}
              className="btn btn-outline"
              target="_blank"
              rel="noopener noreferrer"
              title="View your storefront in a new tab"
            >
              <Store className="h-4 w-4 mr-2" />
              View Storefront
            </Link>
          ) : (
            <Link href="/shop" className="btn btn-outline" title="Set up your shop first">
              <Store className="h-4 w-4 mr-2" />
              View Storefront
            </Link>
          )}
          <button className="btn btn-outline" aria-label="notifications">
            <Bell className="h-5 w-5" />
          </button>

          {/* User Menu Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 hover:bg-gray-50 rounded-lg px-2 py-1 transition-colors"
            >
              <div
                className="h-8 w-8 rounded-full text-white flex items-center justify-center text-sm font-semibold"
                style={{ backgroundColor: 'var(--theme-primary)' }}
              >
                {getUserInitials()}
              </div>
              <ChevronDown className="h-4 w-4 text-gray-500" />
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop to close menu */}
                <div className="fixed inset-0 z-10" onClick={() => setShowUserMenu(false)} />

                {/* Dropdown Menu */}
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-900">{getUserDisplayName()}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                  </div>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </Link>

                  <Link
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowUserMenu(false)}
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>

                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left disabled:opacity-50"
                    >
                      <LogOut className="h-4 w-4" />
                      {loggingOut ? 'Logging out...' : 'Logout'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
