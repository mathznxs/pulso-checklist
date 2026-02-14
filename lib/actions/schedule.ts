"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Shift, ScaleDay } from "@/lib/types"
import { DIAS_LABELS } from "@/lib/utils/schedule.utils"

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

  // Check scale_days (novo modelo semanal)
  const { data: scaleDay } = await supabase
    .from("scale_days")
    .select("setor, turno_id, shift:shifts(*)")
    .eq("profile_id", userId)
    .eq("dia_semana", dayOfWeek)
    .limit(1)
    .single()

  if (scaleDay && scaleDay.setor && scaleDay.shift) {
    const shift = scaleDay.shift as unknown as Shift
    return {
      setor: scaleDay.setor,
      turno_nome: shift.nome,
      turno_inicio: shift.hora_inicio,
      turno_fim: shift.hora_fim,
      tipo: "fixa",
    }
  }

  // Fallback: fixed_schedule (modelo antigo)
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

/** Retorna escala semanal do usuário (prefer scale_days, fallback fixed_schedule). */
export async function getUserWeekSchedule(userId: string): Promise<WeekScheduleDay[]> {
  const supabase = await createClient()
  const week: WeekScheduleDay[] = []

  // Novo modelo: scale_days (um registro por dia)
  const { data: scaleDays } = await supabase
    .from("scale_days")
    .select("dia_semana, setor, turno_id, shift:shifts(*)")
    .eq("profile_id", userId)

  if (scaleDays && scaleDays.length > 0) {
    const byDay = new Map<number, { setor: string | null; shift: Shift | null }>()
    for (const sd of scaleDays) {
      const shift = Array.isArray(sd.shift) ? sd.shift[0] : sd.shift
      byDay.set(sd.dia_semana as number, {
        setor: sd.setor ?? null,
        shift: (shift as unknown as Shift) ?? null,
      })
    }
    for (let i = 0; i < 7; i++) {
      const d = byDay.get(i)
      week.push({
        dayIndex: i,
        dayLabel: DIAS_LABELS[i],
        setor: d?.setor ?? null,
        turno_nome: d?.shift?.nome ?? null,
        turno_inicio: d?.shift?.hora_inicio ?? null,
        turno_fim: d?.shift?.hora_fim ?? null,
      })
    }
    return week
  }

  // Fallback: fixed_schedule (modelo antigo)
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

/** Retorna registros scale_days do usuário (para edição em grid). */
export async function getScaleDaysForUser(profileId: string): Promise<ScaleDay[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("scale_days")
    .select("id, profile_id, dia_semana, setor, turno_id, shift:shifts(*)")
    .eq("profile_id", profileId)
    .order("dia_semana", { ascending: true })
  return (data as unknown as ScaleDay[]) ?? []
}

/** Salva escala semanal: upsert por (profile_id, dia_semana), evita duplicidade. */
export async function saveWeeklySchedule(
  profileId: string,
  days: { diaSemana: number; setor: string | null; turnoId: string | null }[]
): Promise<{ error?: string }> {
  const supabase = await createClient()
  for (const d of days) {
    if (d.setor && d.turnoId) {
      const { error } = await supabase.from("scale_days").upsert(
        {
          profile_id: profileId,
          dia_semana: d.diaSemana,
          setor: d.setor,
          turno_id: d.turnoId,
        },
        { onConflict: "profile_id,dia_semana" }
      )
      if (error) return { error: error.message }
    } else {
      await supabase
        .from("scale_days")
        .delete()
        .eq("profile_id", profileId)
        .eq("dia_semana", d.diaSemana)
    }
  }
  revalidatePath("/escala")
  revalidatePath("/admin")
  return {}
}

/** Remove um dia da escala. */
export async function deleteScheduleDay(
  profileId: string,
  diaSemana: number
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("scale_days")
    .delete()
    .eq("profile_id", profileId)
    .eq("dia_semana", diaSemana)
  if (error) return { error: error.message }
  revalidatePath("/escala")
  revalidatePath("/admin")
  return {}
}

export async function createTemporarySchedule(
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

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
    tipo: "fixa" | "provisória"
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
    tipo: "fixa" | "provisória"
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
          tipo: "provisória",
        })
        tempUserIds.add(t.user_id)
      }
    }
  }

  // scale_days (novo modelo)
  const { data: scaleDaysAll } = await supabase
    .from("scale_days")
    .select("profile_id, setor, shift:shifts(nome), profile:profiles(nome, matricula)")
    .eq("dia_semana", dayOfWeek)
    .not("setor", "is", null)

  if (scaleDaysAll) {
    for (const sd of scaleDaysAll) {
      if (tempUserIds.has(sd.profile_id)) continue
      const profile = sd.profile as unknown as { nome: string; matricula: string } | null
      const shift = sd.shift as unknown as { nome: string } | null
      if (profile && shift && sd.setor) {
        result.push({
          userId: sd.profile_id,
          nome: profile.nome,
          matricula: profile.matricula,
          setor: sd.setor,
          turno_nome: shift.nome,
          tipo: "fixa",
        })
        tempUserIds.add(sd.profile_id)
      }
    }
  }

  // Fallback: fixed_schedule (modelo antigo)
  const { data: fixedAll } = await supabase
    .from("fixed_schedule")
    .select("user_id, setor, dias_semana, shift:shifts(nome), profile:profiles(nome, matricula)")
    .contains("dias_semana", [dayOfWeek])

  if (fixedAll) {
    for (const f of fixedAll) {
      if (tempUserIds.has(f.user_id)) continue
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
