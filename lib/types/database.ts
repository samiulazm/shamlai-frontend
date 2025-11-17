// Database TypeScript Types for InsForge E-Commerce Platform
// Auto-generated from DATABASE_SCHEMA.md

// ============================================================================
// Core Product Types
// ============================================================================

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent_id?: string;
  image_url?: string;
  is_active: boolean;
  sort_order: number;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  slug: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  base_price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  sku?: string;
  barcode?: string;
  track_inventory: boolean;
  inventory_quantity: number;
  allow_backorder: boolean;
  weight?: number;
  weight_unit?: string;
  is_active: boolean;
  is_featured: boolean;
  has_variants: boolean;
  meta_title?: string;
  meta_description?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  image_key: string;
  alt_text?: string;
  sort_order: number;
  is_primary: boolean;
  created_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  sku?: string;
  barcode?: string;
  price: number;
  compare_at_price?: number;
  cost_per_item?: number;
  inventory_quantity: number;
  weight?: number;
  option1_name?: string;
  option1_value?: string;
  option2_name?: string;
  option2_value?: string;
  option3_name?: string;
  option3_value?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryLog {
  id: string;
  product_id?: string;
  variant_id?: string;
  change_type: 'sale' | 'restock' | 'adjustment' | 'return';
  quantity_change: number;
  quantity_after: number;
  reason?: string;
  reference_id?: string;
  created_by?: string;
  created_at: string;
}

// ============================================================================
// Customer & Order Types
// ============================================================================

export interface Customer {
  id: string;
  user_id?: string;
  shop_id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  accepts_marketing: boolean;
  total_orders: number;
  total_spent: number;
  notes?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Address {
  id: string;
  customer_id: string;
  address_type: 'shipping' | 'billing';
  first_name: string;
  last_name: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export type OrderStatus =
  | 'pending'
  | 'rts' // Ready to Ship
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'pending_return'
  | 'returned'
  | 'partial'
  | 'cancelled'
  | 'pending_cancel'
  | 'preorder'
  | 'lost'
  | 'refunded';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type FulfillmentStatus = 'unfulfilled' | 'partial' | 'fulfilled';

export interface Order {
  id: string;
  shop_id: string;
  customer_id: string;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  fulfillment_status: FulfillmentStatus;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  tax_amount: number;
  total: number;
  customer_email: string;
  customer_phone?: string;
  shipping_first_name: string;
  shipping_last_name: string;
  shipping_phone?: string;
  shipping_address1: string;
  shipping_address2?: string;
  shipping_city: string;
  shipping_state: string;
  shipping_postal_code: string;
  shipping_country: string;
  billing_first_name: string;
  billing_last_name: string;
  billing_address1: string;
  billing_address2?: string;
  billing_city: string;
  billing_state: string;
  billing_postal_code: string;
  billing_country: string;
  notes?: string;
  tags?: string[];
  discount_code?: string;
  tracking_number?: string;
  tracking_url?: string;
  source?: string; // Order source: 'web', 'facebook', 'manual', 'phone', etc.
  delivery_method?: string; // Delivery method: 'pathao', 'steadfast', 'office', etc.
  sent_to_courier_at?: string; // Timestamp when order was sent to courier
  shipped_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  cancellation_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string;
  product_name: string;
  variant_name?: string;
  sku?: string;
  quantity: number;
  price: number;
  discount_amount: number;
  total: number;
  image_url?: string;
  created_at: string;
}

export interface OrderStatusHistory {
  id: string;
  order_id: string;
  status: OrderStatus;
  comment?: string;
  notify_customer: boolean;
  created_by?: string;
  created_at: string;
}

// ============================================================================
// Cart Types
// ============================================================================

export interface Cart {
  id: string;
  user_id?: string;
  session_id?: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

export interface CartItem {
  id: string;
  cart_id: string;
  product_id: string;
  variant_id?: string;
  quantity: number;
  price: number;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Payment & Shipping Types
// ============================================================================

export interface PaymentMethod {
  id: string;
  shop_id: string;
  provider: 'cash_on_delivery';
  name: string;
  is_active: boolean;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  payment_method_id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transaction_id?: string;
  payment_provider: string;
  provider_response?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface ShippingMethod {
  id: string;
  shop_id: string;
  name: string;
  description?: string;
  base_cost: number;
  cost_per_kg?: number;
  free_shipping_threshold?: number;
  estimated_days_min: number;
  estimated_days_max: number;
  is_active: boolean;
  available_countries?: string[];
  created_at: string;
  updated_at: string;
}

export interface TaxRate {
  id: string;
  shop_id: string;
  name: string;
  rate: number;
  country?: string;
  state?: string;
  city?: string;
  postal_code?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Marketing & Promotions Types
// ============================================================================

export type DiscountType = 'percentage' | 'fixed_amount' | 'free_shipping';
export type DiscountAppliesTo = 'all' | 'specific_products' | 'specific_categories';

export interface DiscountCode {
  id: string;
  shop_id: string;
  code: string;
  description?: string;
  discount_type: DiscountType;
  discount_value: number;
  minimum_purchase?: number;
  maximum_discount?: number;
  usage_limit?: number;
  usage_count: number;
  usage_limit_per_customer?: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  applies_to: DiscountAppliesTo;
  created_at: string;
  updated_at: string;
}

export interface DiscountCodeProduct {
  id: string;
  discount_code_id: string;
  product_id: string;
  created_at: string;
}

export interface DiscountCodeCategory {
  id: string;
  discount_code_id: string;
  category_id: string;
  created_at: string;
}

export interface DiscountCodeUsage {
  id: string;
  discount_code_id: string;
  order_id: string;
  customer_id: string;
  discount_amount: number;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  customer_id: string;
  order_id?: string;
  rating: number;
  title?: string;
  review?: string;
  verified_purchase: boolean;
  is_approved: boolean;
  is_featured: boolean;
  helpful_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReviewImage {
  id: string;
  review_id: string;
  image_url: string;
  image_key: string;
  created_at: string;
}

export interface Wishlist {
  id: string;
  customer_id: string;
  product_id: string;
  variant_id?: string;
  created_at: string;
}

export interface EmailSubscriber {
  id: string;
  shop_id: string;
  email: string;
  status: 'active' | 'unsubscribed' | 'bounced';
  tags?: string[];
  source?: string;
  created_at: string;
  updated_at: string;
}

export type NotificationType = 'order' | 'payment' | 'shipping' | 'review' | 'low_stock';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// Store Configuration Types
// ============================================================================

export interface ShopSettings {
  id: string;
  shop_id: string;
  shop_name: string;
  subdomain?: string;
  shop_description?: string;
  shop_email: string;
  shop_phone?: string;
  logo_url?: string;
  favicon_url?: string;
  currency: string;
  timezone: string;
  language?: string;
  weight_unit: string;
  address1?: string;
  address2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  meta_title?: string;
  meta_description?: string;
  google_analytics_id?: string;
  facebook_pixel_id?: string;
  terms_of_service?: string;
  privacy_policy?: string;
  refund_policy?: string;
  shipping_policy?: string;
  enable_reviews?: boolean;
  enable_wishlists?: boolean;
  enable_guest_checkout?: boolean;
  require_account_for_checkout?: boolean;
  auto_approve_reviews?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CustomDomain {
  id: string;
  shop_id: string;
  domain: string;
  is_primary: boolean;
  is_verified: boolean;
  verification_code: string;
  ssl_enabled: boolean;
  created_at: string;
  verified_at?: string;
  updated_at: string;
}

// Add User type for users page
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  role: 'admin' | 'merchant' | 'customer';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Theme {
  id: string;
  shop_id: string;
  name: string;
  is_active: boolean;
  is_custom: boolean;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  background_color?: string;
  text_color?: string;
  heading_font?: string;
  body_font?: string;
  header_style?: string;
  footer_style?: string;
  product_card_style?: string;
  custom_css?: string;
  custom_js?: string;
  created_at: string;
  updated_at: string;
}

export interface Page {
  id: string;
  shop_id: string;
  title: string;
  slug: string;
  content: string;
  meta_title?: string;
  meta_description?: string;
  is_published: boolean;
  show_in_footer: boolean;
  show_in_header: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type MenuLocation = 'header' | 'footer' | 'sidebar';

export interface NavigationMenu {
  id: string;
  shop_id: string;
  name: string;
  location: MenuLocation;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type MenuLinkType = 'page' | 'product' | 'category' | 'custom';

export interface MenuItem {
  id: string;
  menu_id: string;
  parent_id?: string;
  title: string;
  url: string;
  link_type: MenuLinkType;
  sort_order: number;
  created_at: string;
}

// ============================================================================
// Content Management Types
// ============================================================================

export interface BlogPost {
  id: string;
  shop_id: string;
  author_id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  featured_image_url?: string;
  is_published: boolean;
  published_at?: string;
  meta_title?: string;
  meta_description?: string;
  tags?: string[];
  views_count: number;
  created_at: string;
  updated_at: string;
}

export type ConversationStatus = 'active' | 'resolved' | 'archived';

export interface ChatbotConversation {
  id: string;
  shop_id: string;
  customer_id?: string;
  session_id: string;
  status: ConversationStatus;
  created_at: string;
  updated_at: string;
}

export type SenderType = 'customer' | 'bot' | 'admin';

export interface ChatbotMessage {
  id: string;
  conversation_id: string;
  sender_type: SenderType;
  message: string;
  attachments?: string[];
  created_at: string;
}

// ============================================================================
// Analytics Types
// ============================================================================

export type AnalyticsEventType = 'page_view' | 'product_view' | 'add_to_cart' | 'purchase';

export interface AnalyticsEvent {
  id: string;
  shop_id: string;
  event_type: AnalyticsEventType;
  event_data?: Record<string, any>;
  session_id: string;
  customer_id?: string;
  product_id?: string;
  created_at: string;
}

// ============================================================================
// Database Insert Types (without auto-generated fields)
// ============================================================================

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'updated_at'>;
export type CategoryInsert = Omit<Category, 'id' | 'created_at' | 'updated_at'>;
export type OrderInsert = Omit<Order, 'id' | 'created_at' | 'updated_at'>;
export type CustomerInsert = Omit<
  Customer,
  'id' | 'created_at' | 'updated_at' | 'total_orders' | 'total_spent'
>;
export type CartInsert = Omit<Cart, 'id' | 'created_at' | 'updated_at'>;
export type DiscountCodeInsert = Omit<
  DiscountCode,
  'id' | 'created_at' | 'updated_at' | 'usage_count'
>;

// ============================================================================
// Database Update Types (all fields optional except id)
// ============================================================================

export type ProductUpdate = Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>;
export type CategoryUpdate = Partial<Omit<Category, 'id' | 'created_at' | 'updated_at'>>;
export type OrderUpdate = Partial<Omit<Order, 'id' | 'created_at' | 'updated_at'>>;

// ============================================================================
// Utility Types
// ============================================================================

export interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface QueryFilters {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
