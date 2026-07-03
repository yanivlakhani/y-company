import { createClient } from "@supabase/supabase-js";

/** Cookieless client for public catalog reads (build-time safe, no session). */
export function createPublicClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
