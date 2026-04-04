/**
 * API routes return `{ error: { code, message, ... } }`. Use this when setting React state
 * or rendering so we never pass an object as a child (React error #31).
 */
export function formatApiErrorMessage(error: unknown, fallback: string): string {
  if (error == null) return fallback;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const m = (error as { message?: unknown }).message;
    if (typeof m === 'string' && m.length > 0) return m;
  }
  return fallback;
}
