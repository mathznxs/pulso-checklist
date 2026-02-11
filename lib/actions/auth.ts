"use server"

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Profile } from "@/lib/types"

export async function getCurrentUser(): Promise<{
  user: { id: string; email: string } | null
  profile: Profile | null
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { user: null, profile: null }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  return {
    user: { id: user.id, email: user.email ?? "" },
    profile: profile as Profile | null,
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect("/auth/login")
}
