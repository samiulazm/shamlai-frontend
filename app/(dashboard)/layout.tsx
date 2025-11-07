'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { insforgeClient, ShopService } from "@/lib";
import { logger } from "@/lib/utils/logger";

export default function DashboardLayout({ children }: { children: React.ReactNode }){
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [shopName, setShopName] = useState<string>("Shamlai");
  const [shopId, setShopId] = useState<string>("");

  useEffect(() => {
    checkAuth();
  }, [router]);

  const checkAuth = async () => {
    try {
      const { data, error } = await insforgeClient.auth.getCurrentUser();

      if (error || !data?.user) {
        router.push('/login');
        return;
      }

      setUser(data);
      const currentShopId = data.user.id;
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
        logger.error('Error fetching shop settings', shopErr instanceof Error ? shopErr : new Error(String(shopErr)), {
          shopId: user?.user?.id,
        });
        // Continue with default name
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-indigo mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Topbar title={shopName} user={user} shopId={shopId} />
      <div className="flex">
        <Sidebar />
        <main className="flex-1">
          <div className="container-responsive py-6">{children}</div>
        </main>
      </div>
    </div>
  );
}
