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

  const dataInicio = formData.get("data_inicio") as string
  const dataFim = formData.get("data_fim") as string

  const { error } = await supabase.from("challenges").insert({
    nome: formData.get("nome") as string,
    descricao: (formData.get("descricao") as string) || null,
    data_inicio: dataInicio || null,
    data_fim: dataFim || null,
  })
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

/**
 * Increment a user's score by a given amount (can be negative for decrement).
 * If no score row exists, creates one with the given amount.
 * Blocks changes if the challenge has ended (data_fim < today).
 */
export async function incrementScore(
  challengeId: string,
  userId: string,
  amount: number
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Check if challenge has ended
  const { data: challenge } = await supabase
    .from("challenges")
    .select("data_fim")
    .eq("id", challengeId)
    .single()

  if (challenge?.data_fim) {
    const endDate = new Date(challenge.data_fim)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (endDate < today) {
      return { error: "Gincana encerrada" }
    }
  }

  // Read current score
  const { data: existing } = await supabase
    .from("challenge_scores")
    .select("id, pontos")
    .eq("challenge_id", challengeId)
    .eq("user_id", userId)
    .single()

  if (existing) {
    const newPontos = Math.max(0, existing.pontos + amount)
    const { error } = await supabase
      .from("challenge_scores")
      .update({
        pontos: newPontos,
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", existing.id)
    if (error) return { error: error.message }
  } else {
    const newPontos = Math.max(0, amount)
    const { error } = await supabase.from("challenge_scores").insert({
      challenge_id: challengeId,
      user_id: userId,
      pontos: newPontos,
      atualizado_em: new Date().toISOString(),
    })
    if (error) return { error: error.message }
  }

  revalidatePath("/gincanas")
  return {}
}

/**
 * Set exact score value (lideranca manual override).
 */
export async function setScore(
  challengeId: string,
  userId: string,
  pontos: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      user_id: userId,
      pontos: Math.max(0, pontos),
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" }
  )
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function toggleChallengeActive(
  challengeId: string,
  ativa: boolean
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("challenges")
    .update({ ativa })
    .eq("id", challengeId)
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}
