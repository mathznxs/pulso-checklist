"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Profile, Shift, Setor, EscalaEntry } from "@/lib/types"

// ─── PROFILES ───

export async function getAllProfiles(): Promise<Profile[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("nome", { ascending: true })

  return (data as Profile[]) ?? []
}

export async function updateProfile(
  userId: string,
  updates: Partial<Profile>
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)

  if (error) return { error: error.message }
  revalidatePath("/admin")
  return {}
}

// ─── SHIFTS ───

export async function getShifts(): Promise<Shift[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("shifts")
    .select("*")
    .order("hora_inicio", { ascending: true })

  return (data as Shift[]) ?? []
}

export async function createShift(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("shifts").insert({
    nome: formData.get("nome") as string,
    hora_inicio: formData.get("hora_inicio") as string,
    hora_fim: formData.get("hora_fim") as string,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin")
  return {}
}

// ─── SETORES ───

export async function getSetoresAtivos(): Promise<Setor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("setores")
    .select("*")
    .eq("ativo", true)
    .order("nome", { ascending: true })

  return (data as Setor[]) ?? []
}

export async function getAllSetores(): Promise<Setor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("setores")
    .select("*")
    .order("nome", { ascending: true })

  return (data as Setor[]) ?? []
}

// ─── ESCALA (NOVO MODELO POR SETOR) ───

export async function getEscalaByDate(data: string): Promise<EscalaEntry[]> {
  const supabase = await createClient()
  const { data: entries } = await supabase
    .from("escala")
    .select(`
      *,
      setor:setores(*),
      shift:shifts(*),
      profile:profiles(*)
    `)
    .eq("data", data)
    .order("setor_id", { ascending: true })

  return (entries as unknown as EscalaEntry[]) ?? []
}

export async function createEscalaEntry(
  setorId: string,
  turnoId: string,
  funcionarioId: string,
  data: string,
  tipo: "fixa" | "provisoria"
): Promise<{ error?: string }> {
  const supabase = await createClient()

  // Validacao 1: nao duplicar turno no mesmo setor na mesma data
  const { data: existing } = await supabase
    .from("escala")
    .select("id")
    .eq("setor_id", setorId)
    .eq("turno_id", turnoId)
    .eq("data", data)
    .limit(1)

  if (existing && existing.length > 0) {
    return { error: "Esse turno ja esta atribuido nesse setor para essa data." }
  }

  // Validacao 2: funcionario nao pode estar em dois setores no mesmo turno/data
  const { data: conflict } = await supabase
    .from("escala")
    .select("id, setor:setores(nome)")
    .eq("funcionario_id", funcionarioId)
    .eq("turno_id", turnoId)
    .eq("data", data)
    .limit(1)

  if (conflict && conflict.length > 0) {
    return { error: "Esse funcionario ja esta escalado em outro setor no mesmo turno e data." }
  }

  const { error } = await supabase.from("escala").insert({
    setor_id: setorId,
    turno_id: turnoId,
    funcionario_id: funcionarioId,
    data,
    tipo,
  })

  if (error) return { error: error.message }
  revalidatePath("/escala")
  revalidatePath("/admin")
  return {}
}

export async function deleteEscalaEntry(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("escala").delete().eq("id", id)
  if (error) return { error: error.message }
  revalidatePath("/escala")
  revalidatePath("/admin")
  return {}
}

// ─── ANNOUNCEMENTS ───

export async function updateAnnouncement(
  message: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

  await supabase.from("announcements").update({ ativo: false }).eq("ativo", true)

  const { error } = await supabase.from("announcements").insert({
    message,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/")
  return {}
}
