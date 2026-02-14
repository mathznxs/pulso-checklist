"use server"

import { auth, signOut as nextAuthSignOut } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { redirect } from "next/navigation"
import type { Profile } from "@/lib/types"

export async function getCurrentUser(): Promise<{
  user: { id: string; email: string } | null
  profile: Profile | null
}> {
  const session = await auth()
  if (!session?.user) return { user: null, profile: null }

  const { profileId } = session.user

  if (!profileId) {
    return {
      user: { id: "", email: session.user.email ?? "" },
      profile: null,
    }
  }

  const supabase = createServiceClient()
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", profileId)
    .single()

  return {
    user: { id: profileId, email: session.user.email ?? "" },
    profile: profile as Profile | null,
  }
}

/**
 * Simplified helper: returns Profile | null directly.
 * Used by RSC pages that just need the profile object.
 */
export async function getProfileForSession(): Promise<Profile | null> {
  const { profile } = await getCurrentUser()
  return profile
}

/** Returns the loja_id from the current session for use in query filters. */
export async function getCurrentLojaId(): Promise<string | null> {
  const session = await auth()
  return session?.user?.lojaId ?? null
}

export async function signOut() {
  await nextAuthSignOut({ redirectTo: "/auth/login" })
}
