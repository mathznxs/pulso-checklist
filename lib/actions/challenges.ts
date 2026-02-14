"use server"

import { createClient } from "@/lib/supabase/server"
import { getCurrentLojaId } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"
import type { Challenge, ChallengeScore } from "@/lib/types"

export async function getActiveChallenges(): Promise<Challenge[]> {
  const supabase = await createClient()
  const lojaId = await getCurrentLojaId()

  let query = supabase
    .from("challenges")
    .select("*")
    .eq("ativa", true)
    .order("criado_em", { ascending: false })

  if (lojaId) query = query.eq("loja_id", lojaId)

  const { data } = await query

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
  const lojaId = await getCurrentLojaId()
  const dataInicio = (formData.get("data_inicio") as string) || null
  const dataFim = (formData.get("data_fim") as string) || null
  const descricao = (formData.get("descricao") as string) || null
  const { error } = await supabase.from("challenges").insert({
    nome: formData.get("nome") as string,
    data_inicio: dataInicio,
    data_fim: dataFim,
    descricao: descricao,
    loja_id: lojaId,
  })
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function updateChallenge(
  id: string,
  data: { nome?: string; data_inicio?: string | null; data_fim?: string | null; descricao?: string | null }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("challenges").update(data).eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function incrementScore(
  challengeId: string,
  profileId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("challenge_scores")
    .select("pontos")
    .eq("challenge_id", challengeId)
    .eq("user_id", profileId)
    .single()
  const current = (existing?.pontos as number) ?? 0
  const { error } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      user_id: profileId,
      pontos: current + 1,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" }
  )
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function decrementScore(
  challengeId: string,
  profileId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: existing } = await supabase
    .from("challenge_scores")
    .select("pontos")
    .eq("challenge_id", challengeId)
    .eq("user_id", profileId)
    .single()
  const current = (existing?.pontos as number) ?? 0
  const newPontos = Math.max(0, current - 1)
  const { error } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      user_id: profileId,
      pontos: newPontos,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" }
  )
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function setScore(
  challengeId: string,
  profileId: string,
  value: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const pontos = Math.max(0, value)
  const { error } = await supabase.from("challenge_scores").upsert(
    {
      challenge_id: challengeId,
      user_id: profileId,
      pontos,
      atualizado_em: new Date().toISOString(),
    },
    { onConflict: "challenge_id,user_id" }
  )
  if (error) return { error: error.message }
  revalidatePath("/gincanas")
  return {}
}

export async function updateScore(
  challengeId: string,
  userId: string,
  pontos: number
): Promise<{ error?: string }> {
  return setScore(challengeId, userId, pontos)
}
