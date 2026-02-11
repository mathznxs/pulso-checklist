"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Challenge, ChallengeScore } from "@/lib/types"

export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("challenges")
    .select("*")
    .eq("ativa", true)
    .order("criado_em", { ascending: false })

  return (data as Challenge[]) ?? []
}

export async function getChallengeScores(
  challengeId: string
): Promise<ChallengeScore[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("challenge_scores")
    .select("*, profile:profiles(*)")
    .eq("challenge_id", challengeId)
    .order("pontos", { ascending: false })

  return (data as ChallengeScore[]) ?? []
}

export async function createChallenge(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("challenges").insert({
    nome: formData.get("nome") as string,
  })
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function updateScore(
  challengeId: string,
  userId: string,
  pontos: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      pontos,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" }
  )
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}
