import { createServiceClient } from "./service"

/**
 * Creates a Supabase server client for use in Server Components and Server Actions.
 * Now uses the service-role client since authentication is handled by NextAuth
 * (not Supabase Auth), and we filter by loja_id in queries instead of relying on RLS.
 */
export async function createClient() {
  return createServiceClient()
}
