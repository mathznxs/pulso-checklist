"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { FixedSchedule, Shift } from "@/lib/types"

const DIAS_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

export interface TodaySchedule {
  setor: string
  turno_nome: string
  turno_inicio: string
  turno_fim: string
  tipo: "fixa" | "provisoria"
}

export interface WeekScheduleDay {
  dayIndex: number
  dayLabel: string
  setor: string | null
  turno_nome: string | null
  turno_inicio: string | null
  turno_fim: string | null
}

export async function getUserTodaySchedule(userId: string): Promise<TodaySchedule | null> {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const dayOfWeek = today.getDay()

  // Check temporary schedule first (takes priority)
  const { data: temp } = await supabase
    .from("temporary_schedule")
    .select("setor, turno_id, shift:shifts(*)")
    .eq("user_id", userId)
    .eq("data", todayStr)
    .limit(1)
    .single()

  if (temp && temp.shift) {
    const shift = temp.shift as unknown as Shift
    return {
      setor: temp.setor,
      turno_nome: shift.nome,
      turno_inicio: shift.hora_inicio,
      turno_fim: shift.hora_fim,
      tipo: "provisoria",
    }
  }

  // Check fixed schedule
  const { data: fixed } = await supabase
    .from("fixed_schedule")
    .select("setor, turno_id, dias_semana, shift:shifts(*)")
    .eq("user_id", userId)
    .contains("dias_semana", [dayOfWeek])
    .limit(1)
    .single()

  if (fixed && fixed.shift) {
    const shift = fixed.shift as unknown as Shift
    return {
      setor: fixed.setor,
      turno_nome: shift.nome,
      turno_inicio: shift.hora_inicio,
      turno_fim: shift.hora_fim,
      tipo: "fixa",
    }
  }

  return null
}

export async function getUserWeekSchedule(userId: string): Promise<WeekScheduleDay[]> {
  const supabase = await createClient()
  const week: WeekScheduleDay[] = []

  // Get all fixed schedules for this user
  const { data: fixedSchedules } = await supabase
    .from("fixed_schedule")
    .select("setor, dias_semana, shift:shifts(*)")
    .eq("user_id", userId)

  for (let i = 0; i < 7; i++) {
    let found = false

    if (fixedSchedules) {
      for (const fs of fixedSchedules) {
        if (fs.dias_semana && (fs.dias_semana as number[]).includes(i)) {
          const shift = fs.shift as unknown as Shift
          week.push({
            dayIndex: i,
            dayLabel: DIAS_LABELS[i],
            setor: fs.setor,
            turno_nome: shift?.nome ?? null,
            turno_inicio: shift?.hora_inicio ?? null,
            turno_fim: shift?.hora_fim ?? null,
          })
          found = true
          break
        }
      }
    }

    if (!found) {
      week.push({
        dayIndex: i,
        dayLabel: DIAS_LABELS[i],
        setor: null,
        turno_nome: null,
        turno_inicio: null,
        turno_fim: null,
      })
    }
  }

  return week
}

export async function createTemporarySchedule(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

  const { error } = await supabase.from("temporary_schedule").insert({
    user_id: formData.get("user_id") as string,
    setor: formData.get("setor") as string,
    data: formData.get("data") as string,
    turno_id: formData.get("turno_id") as string,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/escala")
  revalidatePath("/admin")
  return {}
}

export async function getTodayAllSchedules(): Promise<
  {
    userId: string
    nome: string
    matricula: string
    setor: string
    turno_nome: string
    tipo: "fixa" | "provisoria"
  }[]
> {
  const supabase = await createClient()
  const today = new Date()
  const todayStr = today.toISOString().split("T")[0]
  const dayOfWeek = today.getDay()

  const result: {
    userId: string
    nome: string
    matricula: string
    setor: string
    turno_nome: string
    tipo: "fixa" | "provisoria"
  }[] = []

  // Get temp schedules for today
  const { data: temps } = await supabase
    .from("temporary_schedule")
    .select("user_id, setor, shift:shifts(nome), profile:profiles(nome, matricula)")
    .eq("data", todayStr)

  const tempUserIds = new Set<string>()
  if (temps) {
    for (const t of temps) {
      const profile = t.profile as unknown as { nome: string; matricula: string } | null
      const shift = t.shift as unknown as { nome: string } | null
      if (profile && shift) {
        result.push({
          userId: t.user_id,
          nome: profile.nome,
          matricula: profile.matricula,
          setor: t.setor,
          turno_nome: shift.nome,
          tipo: "provisoria",
        })
        tempUserIds.add(t.user_id)
      }
    }
  }

  // Get fixed schedules for today's day of week
  const { data: fixedAll } = await supabase
    .from("fixed_schedule")
    .select("user_id, setor, dias_semana, shift:shifts(nome), profile:profiles(nome, matricula)")
    .contains("dias_semana", [dayOfWeek])

  if (fixedAll) {
    for (const f of fixedAll) {
      if (tempUserIds.has(f.user_id)) continue // temp takes priority
      const profile = f.profile as unknown as { nome: string; matricula: string } | null
      const shift = f.shift as unknown as { nome: string } | null
      if (profile && shift) {
        result.push({
          userId: f.user_id,
          nome: profile.nome,
          matricula: profile.matricula,
          setor: f.setor,
          turno_nome: shift.nome,
          tipo: "fixa",
        })
      }
    }
  }

  return result.sort((a, b) => a.setor.localeCompare(b.setor))
}
