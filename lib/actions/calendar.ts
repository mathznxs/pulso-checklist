"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { CalendarEvent } from "@/lib/types"

export async function getCalendarEvents(
  month: number,
  year: number
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .gte("data_inicio", startDate)
    .lte("data_inicio", endDate)
    .order("data_inicio", { ascending: true })

  return (data as CalendarEvent[]) ?? []
}

export async function createCalendarEvent(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("calendar_events").insert({
    titulo: formData.get("titulo") as string,
    tipo: formData.get("tipo") as string,
    data_inicio: formData.get("data_inicio") as string,
    data_fim: (formData.get("data_fim") as string) || null,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/calendario")
  return {}
}

export async function deleteCalendarEvent(
  eventId: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
  if (error) return { error: error.message }
  revalidatePath("/calendario")
  return {}
}
