import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Validate required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing SUPABASE_URL environment variable. Please check your .env.dev file."
  );
}

if (!supabaseSecretKey) {
  throw new Error(
    "Missing SUPABASE_SECRET_KEY environment variable. Please check your .env.dev file."
  );
}

// Create singleton Supabase client instance
// Using secret key for server-side operations (bypasses RLS)
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    // Disable auto-refresh for service role key (not needed for server-side)
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Export types for convenience
export type { SupabaseClient } from "@supabase/supabase-js";
