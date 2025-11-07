// Analytics and performance monitoring utilities

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
    dataLayer?: any[];
    fbq?: (...args: any[]) => void;
  }
}

// Google Analytics
export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export function initGoogleAnalytics() {
  if (!GA_MEASUREMENT_ID) return;

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
}

export function trackPageView(url: string) {
  if (!GA_MEASUREMENT_ID || !window.gtag) return;
  
  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
}

export function trackEvent(
  action: string,
  category: string,
  label?: string,
  value?: number
) {
  if (!window.gtag) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
}

// E-commerce tracking
export function trackPurchase(orderId: string, value: number, items: any[]) {
  if (!window.gtag) return;

  window.gtag('event', 'purchase', {
    transaction_id: orderId,
    value: value,
    currency: 'BDT',
    items: items,
  });
}

export function trackAddToCart(item: {
  id: string;
  name: string;
  price: number;
  quantity: number;
}) {
  if (!window.gtag) return;

  window.gtag('event', 'add_to_cart', {
    currency: 'BDT',
    value: item.price * item.quantity,
    items: [
      {
        item_id: item.id,
        item_name: item.name,
        price: item.price,
        quantity: item.quantity,
      },
    ],
  });
}

export function trackProductView(product: {
  id: string;
  name: string;
  price: number;
  category?: string;
}) {
  if (!window.gtag) return;

  window.gtag('event', 'view_item', {
    currency: 'BDT',
    value: product.price,
    items: [
      {
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        item_category: product.category,
      },
    ],
  });
}

// Facebook Pixel
export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

export function initFacebookPixel() {
  if (!FB_PIXEL_ID) return;

  const script = document.createElement('script');
  script.innerHTML = `
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');
    fbq('init', '${FB_PIXEL_ID}');
    fbq('track', 'PageView');
  `;
  document.head.appendChild(script);
}

export function trackFBEvent(eventName: string, data?: any) {
  if (!window.fbq) return;
  window.fbq('track', eventName, data);
}

// Web Vitals monitoring
export function reportWebVitals(metric: any) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log(metric);
  }

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      event_category: 'Web Vitals',
      event_label: metric.id,
      non_interaction: true,
    });
  }

  // Send to custom endpoint
  if (process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT) {
    fetch(process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(metric),
    }).catch((err) => {
      console.error('Failed to send web vitals:', err);
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  startMeasure(name: string) {
    this.marks.set(name, performance.now());
  }

  endMeasure(name: string) {
    const startTime = this.marks.get(name);
    if (!startTime) {
      console.warn(`No start mark found for: ${name}`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.marks.delete(name);

    // Track in analytics
    trackEvent('performance', name, undefined, Math.round(duration));

    return duration;
  }

  measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    this.startMeasure(name);
    return operation().finally(() => {
      this.endMeasure(name);
    });
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Error tracking
export function trackError(error: Error, context?: Record<string, any>) {
  // Log to console
  console.error('Error tracked:', error, context);

  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'exception', {
      description: error.message,
      fatal: false,
      ...context,
    });
  }

  // Send to error tracking service (e.g., Sentry)
  // if (window.Sentry) {
  //   window.Sentry.captureException(error, { extra: context });
  // }
}

// User identification
export function identifyUser(userId: string, traits?: Record<string, any>) {
  if (window.gtag) {
    window.gtag('set', { user_id: userId });
    if (traits) {
      window.gtag('set', 'user_properties', traits);
    }
  }

  if (window.fbq) {
    window.fbq('init', FB_PIXEL_ID!, { external_id: userId });
  }
}

// Session tracking
export function trackSession() {
  const sessionId = getOrCreateSessionId();
  
  if (window.gtag) {
    window.gtag('set', { session_id: sessionId });
  }

  return sessionId;
}

function getOrCreateSessionId(): string {
  const key = 'analytics_session_id';
  let sessionId = sessionStorage.getItem(key);
  
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

// Initialize all analytics
export function initAnalytics() {
  if (typeof window === 'undefined') return;

  initGoogleAnalytics();
  initFacebookPixel();
  trackSession();
}

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackPurchase,
  trackAddToCart,
  trackProductView,
  trackError,
  identifyUser,
  performanceMonitor,
  reportWebVitals,
};

