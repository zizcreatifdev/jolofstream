import { createClient, type SupabaseClient } from "@supabase/supabase-js"

// Client Supabase du navigateur (cle anonyme uniquement). lib/supabase.ts
// instancie aussi le client service role et ne doit pas etre importe cote
// client. Cree a la demande pour ne pas echouer sans variables d'environnement.
let browserClient: SupabaseClient | null = null

export function getBrowserSupabase(): SupabaseClient {
  if (!browserClient) {
    browserClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return browserClient
}
