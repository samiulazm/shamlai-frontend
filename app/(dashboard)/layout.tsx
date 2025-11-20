'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { insforgeClient, ShopService } from '@/lib';
import { getActiveTheme } from '@/lib/services/shop';
import { logger } from '@/lib/utils/logger';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { ThemeInjector } from '@/components/theme/ThemeInjector';
import type { Theme } from '@/lib/types/database';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [shopName, setShopName] = useState<string>('Shamlai');
  const [shopId, setShopId] = useState<string>('');
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    checkAuth();
    // Run migrations on dashboard load (only once)
    runMigrationsOnce();
  }, [router]);

  const runMigrationsOnce = async () => {
    try {
      // Check if migrations have been run before (using sessionStorage)
      const migrationsRun = sessionStorage.getItem('migrations_run');
      if (migrationsRun === 'true') {
        return; // Already run in this session
      }

      // Call migration API
      const response = await fetch('/api/migrations', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.migrationsRun > 0) {
          console.log(`✅ Ran ${result.migrationsRun} migration(s)`);
        }
        sessionStorage.setItem('migrations_run', 'true');
      }
    } catch (error) {
      // Silently fail - migrations can be run manually
      console.warn('Migration check failed:', error);
    }
  };

  const checkAuth = async () => {
    try {
      // Try to get user from API route first (server-side, no mixed content issues)
      let userData = null;

      // First, try to get token from localStorage (set during login)
      let tokenFromStorage: string | null = null;
      try {
        if (typeof window !== 'undefined') {
          tokenFromStorage = localStorage.getItem('insforge_access_token');
        }
      } catch (e) {
        // localStorage not available
      }

      try {
        // Include token in query if available from localStorage
        const apiUrl = tokenFromStorage
          ? `/api/auth/user?token=${encodeURIComponent(tokenFromStorage)}`
          : '/api/auth/user';

        const apiResponse = await fetch(apiUrl, {
          credentials: 'include', // Important: include cookies
        });

        if (apiResponse.ok) {
          const apiData = await apiResponse.json();
          if (apiData?.user) {
            userData = apiData;
          }
        } else if (apiResponse.status === 401) {
          // 401 is expected if not logged in - try SDK
          console.log('API auth returned 401, trying SDK...');
        }
      } catch (apiErr) {
        // API route failed, try SDK directly
        console.warn('API auth check failed, trying SDK:', apiErr);
      }

      // If API route didn't work, try SDK directly
      if (!userData) {
        const { data, error } = await insforgeClient.auth.getCurrentUser();
        if (error || !data?.user) {
          router.push('/login');
          return;
        }
        userData = data;
      }

      setUser(userData);
      const currentShopId = userData.user.id;
      setShopId(currentShopId);

      // Fetch shop settings to get shop name
      try {
        const shopSettings = await ShopService.getShopSettings(currentShopId);
        if (shopSettings?.shop_name) {
          setShopName(shopSettings.shop_name);
          // Update document title
          document.title = `${shopSettings.shop_name} - Dashboard`;
        }
      } catch (shopErr) {
        logger.error(
          'Error fetching shop settings',
          shopErr instanceof Error ? shopErr : new Error(String(shopErr)),
          {
            shopId: user?.user?.id,
          }
        );
        // Continue with default name
      }

      // Fetch active theme
      try {
        const activeTheme = await getActiveTheme(currentShopId);
        setTheme(activeTheme);
      } catch (themeErr) {
        logger.error(
          'Error fetching theme',
          themeErr instanceof Error ? themeErr : new Error(String(themeErr)),
          {
            shopId: currentShopId,
          }
        );
        // Continue with default theme (null)
      }

      setLoading(false);
    } catch (err) {
      logger.error('Auth check error', err instanceof Error ? err : new Error(String(err)));
      router.push('/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto"
            style={{ borderColor: 'var(--theme-primary)' }}
          ></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider initialTheme={theme}>
      <ThemeInjector />
      <div className="min-h-screen bg-gray-50">
        <Topbar title={shopName} user={user} shopId={shopId} />
        <div className="flex">
          <Sidebar />
          <main className="flex-1">
            <div className="container-responsive py-6">{children}</div>
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
