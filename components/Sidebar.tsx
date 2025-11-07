"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, Package, Tag, Users, Receipt, BarChart3, Settings, Globe, MessageSquare, KeySquare, CreditCard, Link as LinkIcon, Puzzle, ShieldCheck } from "lucide-react";

function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return <svg {...props} viewBox="0 0 24 24" className="h-5 w-5"><path fill="currentColor" d="M4 4h16l-1 5H5L4 4zm1 7h14v9H5v-9z"/></svg>;
}

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/shop", label: "Shop Details", icon: StoreIcon },
  { href: "/theme", label: "Theme", icon: Puzzle },
  { href: "/products", label: "Products", icon: Package },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/orders", label: "Orders", icon: ShoppingBag },
  { href: "/customers", label: "Customers", icon: Users },
  { href: "/integrations/delivery", label: "Delivery", icon: LinkIcon },
  { href: "/integrations/payments", label: "Payment", icon: CreditCard },
  { href: "/promos", label: "Promo Codes", icon: Receipt },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/seo-marketing", label: "SEO & Marketing", icon: Globe },
  { href: "/chatbot", label: "AI Chatbot", icon: MessageSquare },
  { href: "/users", label: "Users & Permissions", icon: ShieldCheck },
  { href: "/domain", label: "Domain", icon: Globe },
  { href: "/billing", label: "Billing", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar(){
  const pathname = usePathname();
  return (
    <aside className="hidden md:block md:w-64 border-r bg-white">
      <div className="p-3">
        <div className="mb-3 rounded-xl bg-gradient-to-r from-brand-indigo to-indigo-400 p-4 text-white">
          <div className="text-xs opacity-90">Shamlai</div>
          <div className="text-lg font-semibold">Merchant Panel</div>
        </div>
        <nav className="flex flex-col gap-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname?.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href as any} className={"sidebar-link " + (active ? "active" : "")}>
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
