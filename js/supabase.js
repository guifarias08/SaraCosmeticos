import { createClient } from '@supabase/supabase-js';

const supabaseUrl = String(import.meta.env.VITE_SUPABASE_URL || '').trim();
const publishableKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '').trim();

export const isSupabaseConfigured = Boolean(supabaseUrl && publishableKey);
export const PRODUCT_IMAGE_BUCKET = 'product-images';

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, publishableKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: false,
      persistSession: true,
    },
  })
  : null;

export function getProductImageUrl(path) {
  const value = String(path || '').trim();
  if (!value) return '';
  if (/^https:\/\//i.test(value)) return value;
  if (!supabase) return '';

  return supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(value).data.publicUrl;
}
