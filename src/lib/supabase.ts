import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create Supabase client with fallback for missing environment variables
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey && 
    supabaseUrl !== 'https://placeholder.supabase.co' && 
    supabaseAnonKey !== 'placeholder-key');
};

// Enhanced error handling for Supabase operations
export const safeSupabaseOperation = async <T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> => {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured, skipping operation');
      return fallback || null;
    }
    return await operation();
  } catch (error) {
    console.error('Supabase operation failed:', error);
    return fallback || null;
  }
}; 