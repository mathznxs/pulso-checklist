"use server"

import { createClient } from "@/lib/supabase/server"
import type { Setor } from "@/lib/types"

/** Busca todos os setores ativos, ordenados por nome. */
export async function getActiveSetores(): Promise<Setor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("setores")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true })

  return (data as Setor[]) ?? []
}

/** Busca todos os setores (para admin). */
export async function getAllSetores(): Promise<Setor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("setores")
    .select("*")
    .order("nome", { ascending: true })

  return (data as Setor[]) ?? []
}
