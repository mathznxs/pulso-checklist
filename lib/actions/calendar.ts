"use server"

import { createClient } from "@/lib/supabase/server"
import { auth } from "@/lib/auth"
import { getCurrentLojaId } from "@/lib/actions/auth"
import { revalidatePath } from "next/cache"
import type { CalendarEvent } from "@/lib/types"

export async function getCalendarEvents(
  month: number,
  year: number
): Promise<CalendarEvent[]> {
  const supabase = await createClient()
  const lojaId = await getCurrentLojaId()
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`
  const endDate = new Date(year, month, 0).toISOString().split("T")[0]

  let query = supabase
    .from("calendar_events")
    .select("*")
    .gte("data_inicio", startDate)
    .lte("data_inicio", endDate)
    .order("data_inicio", { ascending: true })

  if (lojaId) query = query.eq("loja_id", lojaId)

  const { data } = await query

  return (data as CalendarEvent[]) ?? []
}

export async function createCalendarEvent(
  formData: FormData
): Promise<{ error?: string }> {
  const session = await auth()
  if (!session?.user?.profileId) return { error: "Nao autenticado" }

  const supabase = await createClient()
  const lojaId = await getCurrentLojaId()

  const { error } = await supabase.from("calendar_events").insert({
    titulo: formData.get("titulo") as string,
    tipo: formData.get("tipo") as string,
    data_inicio: formData.get("data_inicio") as string,
    data_fim: (formData.get("data_fim") as string) || null,
    criado_por: session.user.profileId,
    loja_id: lojaId,
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
