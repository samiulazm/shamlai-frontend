/**
 * Analytics Tracking Configuration
 *
 * This module provides analytics tracking for Google Analytics and Facebook Pixel.
 * It tracks page views, events, and e-commerce transactions.
 */

import { logger } from '../utils/logger';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    fbq?: (...args: any[]) => void;
  }
}

/**
 * Track page view
 */
export function trackPageView(url: string) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        page_path: url,
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'PageView');
    }
  } catch (error) {
    logger.error('Failed to track page view', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track custom event
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, any>
) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', eventName, params);
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', eventName, params);
    }

    logger.info('Event tracked', { eventName, params });
  } catch (error) {
    logger.error('Failed to track event', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track purchase/transaction
 */
export function trackPurchase(params: {
  transactionId: string;
  value: number;
  currency: string;
  items?: Array<{
    id: string;
    name: string;
    category?: string;
    quantity: number;
    price: number;
  }>;
}) {
  try {
    // Google Analytics - Enhanced Ecommerce
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'purchase', {
        transaction_id: params.transactionId,
        value: params.value,
        currency: params.currency,
        items: params.items,
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'Purchase', {
        value: params.value,
        currency: params.currency,
      });
    }

    logger.info('Purchase tracked', params);
  } catch (error) {
    logger.error('Failed to track purchase', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track add to cart
 */
export function trackAddToCart(params: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'add_to_cart', {
        items: [{
          id: params.id,
          name: params.name,
          price: params.price,
          quantity: params.quantity,
        }],
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'AddToCart', {
        content_ids: [params.id],
        content_name: params.name,
        value: params.price * params.quantity,
        currency: 'USD',
      });
    }
  } catch (error) {
    logger.error('Failed to track add to cart', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track begin checkout
 */
export function trackBeginCheckout(params: {
  value: number;
  currency: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    price: number;
  }>;
}) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'begin_checkout', {
        value: params.value,
        currency: params.currency,
        items: params.items,
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'InitiateCheckout', {
        value: params.value,
        currency: params.currency,
        num_items: params.items.length,
      });
    }
  } catch (error) {
    logger.error('Failed to track begin checkout', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track user signup
 */
export function trackSignup(method: string) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'sign_up', {
        method,
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'CompleteRegistration');
    }
  } catch (error) {
    logger.error('Failed to track signup', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track user login
 */
export function trackLogin(method: string) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'login', {
        method,
      });
    }
  } catch (error) {
    logger.error('Failed to track login', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Track search
 */
export function trackSearch(searchTerm: string) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('event', 'search', {
        search_term: searchTerm,
      });
    }

    // Facebook Pixel
    if (window.fbq && process.env.NEXT_PUBLIC_FB_PIXEL_ID) {
      window.fbq('track', 'Search', {
        search_string: searchTerm,
      });
    }
  } catch (error) {
    logger.error('Failed to track search', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Set user ID for analytics
 */
export function setUserId(userId: string) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('config', process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID, {
        user_id: userId,
      });
    }
  } catch (error) {
    logger.error('Failed to set user ID', error instanceof Error ? error : new Error(String(error)));
  }
}

/**
 * Set user properties
 */
export function setUserProperties(properties: Record<string, any>) {
  try {
    // Google Analytics
    if (window.gtag && process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
      window.gtag('set', 'user_properties', properties);
    }
  } catch (error) {
    logger.error('Failed to set user properties', error instanceof Error ? error : new Error(String(error)));
  }
}
