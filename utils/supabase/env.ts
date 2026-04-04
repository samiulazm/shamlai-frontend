/**
 * Resolves Supabase URL and anon/publishable keys from env.
 * Supports the standard anon key and Supabase publishable default key naming.
 */
export function getSupabaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_INSFORGE_URL ||
    ''
  );
}

export function getSupabaseAnonKey(): string {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY ||
    process.env.NEXT_PUBLIC_INSFORGE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    ''
  );
}
