import { CART_SESSION_STORAGE_KEY, CART_UPDATED_EVENT } from '../constants';

/**
 * Ensure we have a stable cart session id for guest carts.
 * Falls back to a timestamp when running outside the browser (SSR/test).
 */
export function getOrCreateCartSessionId(): string {
  if (typeof window === 'undefined') {
    return `session_${Date.now()}`;
  }

  const existing = window.localStorage.getItem(CART_SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId = `session_${Date.now()}`;
  window.localStorage.setItem(CART_SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

/**
 * Dispatch a global cart update event so any subscribed component
 * (like the storefront header badge) can refresh automatically.
 */
export function dispatchCartUpdatedEvent(detail?: Record<string, unknown>) {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT, { detail }));
}
