import { createBrowserClient } from '@supabase/ssr';
import { getSupabaseAnonKey, getSupabaseUrl } from './env';

const supabaseUrl = getSupabaseUrl();
const supabaseKey = getSupabaseAnonKey();

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing Supabase environment variables: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)'
  );
}

export const createClient = () => {
  return createBrowserClient(supabaseUrl, supabaseKey);
};
