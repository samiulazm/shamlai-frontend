/**
 * Turn a name/email local-part into a DNS-safe subdomain slug.
 */
export function normalizeSubdomain(source: string): string {
  const normalized = (source || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // replace non-alphanumerics with hyphen
    .replace(/^-+|-+$/g, '') // trim hyphens
    .slice(0, 50); // enforce max length

  // Return normalized string if valid, otherwise use 'shop' as fallback
  return normalized || 'shop';
}
