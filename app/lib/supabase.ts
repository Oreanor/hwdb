import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

/**
 * The Supabase client, created on first use.
 *
 * Lazy on purpose: in local mode (see LOCAL_BACKEND) nothing ever calls this,
 * so a dev checkout needs no Supabase credentials at all. Creating the client
 * at module scope would instead throw on import, taking the whole app down.
 */
export const getSupabase = (): SupabaseClient => {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are required for the cloud backend'
    );
  }

  client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: 'public',
    },
  });
  return client;
};
