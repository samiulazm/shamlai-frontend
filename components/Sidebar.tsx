'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback } from 'react';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Users,
  Receipt,
  BarChart3,
  Settings,
  Globe,
  MessageSquare,
  CreditCard,
  Link as LinkIcon,
  Puzzle,
  ShieldCheck,
  Search,
  FileEdit,
  ScanLine,
  Truck,
  Workflow,
  UserCheck,
  Bell,
} from 'lucide-react';

function StoreIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="currentColor" d="M4 4h16l-1 5H5L4 4zm1 7h14v9H5v-9z" />
    </svg>
  );
}

interface MenuItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: MenuItem[];
}

// Organized menu items: Core → Operations → Management → Integrations → Settings
const menuItems: MenuItem[] = [
  // Core Navigation
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/search', label: 'Search', icon: Search },

  // Orders Management
  {
    href: '/orders',
    label: 'Approved Orders',
    icon: ShoppingBag,
    children: [
      { href: '/orders/new', label: 'New Order', icon: ShoppingBag },
      { href: '/orders', label: 'Order List', icon: ShoppingBag },
      { href: '/orders/all', label: 'All List', icon: ShoppingBag },
      { href: '/orders/super-edit', label: 'Super Edit', icon: FileEdit },
      { href: '/orders/preorders', label: 'Preorder List', icon: ShoppingBag },
      { href: '/orders/scan', label: 'Scan To Update', icon: ScanLine },
    ],
  },
  {
    href: '/web-orders',
    label: 'Web Orders',
    icon: Globe,
    children: [
      { href: '/web-orders', label: 'Web Order List', icon: Globe },
      { href: '/web-orders/preorders', label: 'Preorders', icon: Globe },
      { href: '/web-orders/manual', label: 'Manual Web Order', icon: ShoppingBag },
      { href: '/web-orders/additional-sites', label: 'Additional Sites', icon: Globe },
      { href: '/reports/web-orders', label: 'Web Order Report', icon: BarChart3 },
    ],
  },

  // Inventory & Products
  {
    href: '/products',
    label: 'Inventory',
    icon: Package,
    children: [
      { href: '/products/new', label: 'Add New Product', icon: Package },
      { href: '/products', label: 'Product List', icon: Package },
      { href: '/categories', label: 'Categories & Brands', icon: Tag },
      { href: '/products/sync', label: 'Sync Products', icon: Package },
      { href: '/inventory/adjustments/decrease', label: 'New Decrease Stock', icon: Package },
      { href: '/inventory/adjustments', label: 'Decrease Stock List', icon: Package },
      { href: '/inventory/adjustments/increase', label: 'New Increase Stock', icon: Package },
      { href: '/inventory/purchases', label: 'Increase Stock List', icon: Package },
      { href: '/inventory/transfer', label: 'Transfer Stock', icon: Package },
    ],
  },
  { href: '/customers', label: 'Customers', icon: Users },
  { href: '/promos', label: 'Promo Codes', icon: Receipt },

  // Delivery & Shipping
  {
    href: '/delivery-methods',
    label: 'Delivery Methods',
    icon: Truck,
    children: [
      { href: '/delivery-methods', label: 'Delivery Method List', icon: Truck },
      { href: '/delivery-methods/new', label: 'Add Delivery Method', icon: Truck },
      { href: '/delivery-methods/payment', label: 'Update Payment', icon: CreditCard },
    ],
  },

  // Marketing & Sales
  {
    href: '/marketing/meta-ads',
    label: 'Meta Ads',
    icon: Globe,
    children: [
      { href: '/marketing/meta-ads', label: 'Meta Ads Report', icon: BarChart3 },
      { href: '/marketing/campaigns', label: 'Campaign Products', icon: Globe },
    ],
  },
  { href: '/seo-marketing', label: 'SEO & Marketing', icon: Globe },
  { href: '/chatbot', label: 'AI Chatbot', icon: MessageSquare },

  // Financial Management
  {
    href: '/accounting',
    label: 'Accounting',
    icon: CreditCard,
    children: [
      { href: '/accounting/accounts', label: 'Accounts', icon: CreditCard },
      { href: '/accounting/expenses/new', label: 'New Expense', icon: Receipt },
      { href: '/accounting/expenses/ad', label: 'New Ad Expense', icon: Receipt },
      { href: '/accounting/expenses', label: 'Expenses List', icon: Receipt },
      { href: '/accounting/income', label: 'Income', icon: CreditCard },
      { href: '/accounting/liabilities', label: 'Liabilities', icon: CreditCard },
    ],
  },

  // Operations & Management
  {
    href: '/tasks',
    label: 'Task & Follow-up',
    icon: Bell,
    children: [
      { href: '/followups', label: 'My Follow-ups', icon: Bell },
      { href: '/followups/dashboard', label: 'Follow-up Dashboard', icon: LayoutDashboard },
      { href: '/followups/assign', label: 'Assign Follow-ups', icon: UserCheck },
      { href: '/followups/reports', label: 'Follow-up Reports', icon: BarChart3 },
      { href: '/tasks/new', label: 'New Task', icon: Bell },
      { href: '/tasks', label: 'Task List', icon: Bell },
      { href: '/tasks/auto-config', label: 'Auto Task Config', icon: Settings },
    ],
  },
  {
    href: '/hrm',
    label: 'HRM',
    icon: UserCheck,
    children: [
      { href: '/hrm/dashboard', label: 'Live Dashboard', icon: LayoutDashboard },
      { href: '/hrm/activities', label: 'Activities', icon: UserCheck },
      { href: '/hrm/attendance', label: 'Attendance Report', icon: BarChart3 },
    ],
  },
  {
    href: '/automation',
    label: 'Automation',
    icon: Workflow,
    children: [
      { href: '/automation', label: 'Workflows', icon: Workflow },
      { href: '/automation/builder', label: 'Create Workflow', icon: Workflow },
      { href: '/automation/templates', label: 'Templates', icon: Puzzle },
    ],
  },

  // Integrations
  {
    href: '/integrations',
    label: 'Integrations',
    icon: LinkIcon,
    children: [
      { href: '/integrations/woocommerce', label: 'WooCommerce', icon: LinkIcon },
      { href: '/integrations/delivery', label: 'Delivery', icon: Truck },
      { href: '/integrations/payments', label: 'Payment', icon: CreditCard },
      { href: '/web-orders/plugin-settings', label: 'Plugin Settings', icon: Settings },
    ],
  },

  // Security & Access
  {
    href: '/security',
    label: 'Security',
    icon: ShieldCheck,
    children: [
      { href: '/security/block-list', label: 'IP & Mobile Block', icon: ShieldCheck },
      { href: '/users', label: 'Users & Permissions', icon: UserCheck },
    ],
  },

  // Reports & Analytics
  { href: '/reports', label: 'Reports', icon: BarChart3 },

  // Settings & Configuration
  {
    href: '/settings',
    label: 'Settings',
    icon: Settings,
    children: [
      { href: '/shop', label: 'Shop Details', icon: StoreIcon },
      { href: '/theme', label: 'Theme', icon: Puzzle },
      { href: '/domain', label: 'Domain', icon: Globe },
      { href: '/billing', label: 'Billing', icon: CreditCard },
      { href: '/settings', label: 'General Settings', icon: Settings },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = useCallback(
    (href: string) => {
      return pathname === href || pathname?.startsWith(href + '/');
    },
    [pathname]
  );

  const isParentActive = useCallback(
    (item: MenuItem) => {
      if (isActive(item.href)) return true;
      return item.children?.some((child) => isActive(child.href)) || false;
    },
    [isActive]
  );

  return (
    <aside className="hidden md:block md:w-64 border-r bg-white">
      <div className="p-3">
        <div className="mb-3 rounded-xl bg-gradient-to-r from-brand-indigo to-indigo-400 p-4 text-white">
          <div className="text-xs opacity-90">Shamlai</div>
          <div className="text-lg font-semibold">Merchant Panel</div>
        </div>
        <nav className="flex flex-col gap-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            const parentActive = isParentActive(item);
            const hasChildren = item.children && item.children.length > 0;

            return (
              <div key={item.href}>
                {hasChildren ? (
                  <details className={parentActive ? 'open' : ''}>
                    <summary
                      className={`sidebar-link ${parentActive ? 'active' : ''} cursor-pointer`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{item.label}</span>
                      <svg
                        className="h-4 w-4 ml-auto"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const ChildIcon = child.icon;
                        const childActive = isActive(child.href);
                        return (
                          <Link
                            key={child.href}
                            href={child.href as any}
                            className={`sidebar-link ${childActive ? 'active' : ''} text-sm`}
                          >
                            <ChildIcon className="h-4 w-4" />
                            <span>{child.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </details>
                ) : (
                  <Link
                    href={item.href as any}
                    className={`sidebar-link ${active ? 'active' : ''}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
