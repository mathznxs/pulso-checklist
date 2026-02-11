"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Profile, Shift, FixedSchedule } from "@/lib/types"

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

export async function getFixedSchedules(): Promise<FixedSchedule[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("fixed_schedule")
    .select("*, profile:profiles(*), shift:shifts(*)")
    .order("setor", { ascending: true })

  return (data as FixedSchedule[]) ?? []
}

export async function createFixedSchedule(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const diasStr = formData.get("dias_semana") as string
  const dias = diasStr ? diasStr.split(",").map(Number) : []

  const { error } = await supabase.from("fixed_schedule").insert({
    user_id: formData.get("user_id") as string,
    setor: formData.get("setor") as string,
    turno_id: formData.get("turno_id") as string,
    dias_semana: dias,
  })
  if (error) return { error: error.message }
  revalidatePath("/admin")
  return {}
}

export async function updateAnnouncement(
  message: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

  // Deactivate existing
  await supabase.from("announcements").update({ ativo: false }).eq("ativo", true)

  // Create new
  const { error } = await supabase.from("announcements").insert({
    message,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/")
  return {}
}

export async function getDistinctSectors(): Promise<string[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("profiles")
    .select("setor_base")
    .not("setor_base", "is", null)

  if (!data) return []
  const sectors = new Set(data.map((d) => d.setor_base as string))
  return Array.from(sectors).sort()
}
