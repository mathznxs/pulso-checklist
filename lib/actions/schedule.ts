"use server"

import { createClient } from "@/lib/supabase/server"
import type { Shift, Setor, EscalaEntry } from "@/lib/types"

export async function getSetores(): Promise<Setor[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("setores")
    .select("*")
    .eq("ativo", true)
    .order("nome")
  return (data ?? []) as Setor[]
}

export async function getEscalaByDate(date: string): Promise<EscalaEntry[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("escala")
    .select(`
      *,
      setor:setores(*),
      shift:shifts(*),
      profile:profiles(id, nome, matricula, cargo, ativo)
    `)
    .eq("data", date)
    .order("criado_em")
  return (data ?? []) as unknown as EscalaEntry[]
}

export async function upsertEscala(entries: {
  setor_id: string
  turno_id: string
  funcionario_id: string
  data: string
  tipo: "fixa" | "provisoria"
}[]) {
  const supabase = await createClient()
  const { error } = await supabase
    .from("escala")
    .upsert(entries, { onConflict: "setor_id,turno_id,funcionario_id,data" })
  if (error) throw error
}

export async function removeEscalaEntry(id: string) {
  const supabase = await createClient()
  const { error } = await supabase.from("escala").delete().eq("id", id)
  if (error) throw error
}

export interface TodaySchedule {
  setor: string
  setor_cor: string
  turno_nome: string
  turno_inicio: string
  turno_fim: string
  tipo: "fixa" | "provisoria"
}

export interface TodayAllScheduleEntry {
  userId: string
  nome: string
  matricula: string
  setor_nome: string
  setor_cor: string
  turno_nome: string
  turno_inicio: string
  turno_fim: string
  tipo: "fixa" | "provisoria"
}

export async function getUserTodaySchedule(userId: string): Promise<TodaySchedule | null> {
  const supabase = await createClient()
  const todayStr = new Date().toISOString().split("T")[0]

  const { data: entry } = await supabase
    .from("escala")
    .select(`
      tipo,
      setor:setores(nome, cor),
      shift:shifts(nome, hora_inicio, hora_fim)
    `)
    .eq("funcionario_id", userId)
    .eq("data", todayStr)
    .limit(1)
    .single()

  if (!entry) return null

  const setor = entry.setor as unknown as { nome: string; cor: string } | null
  const shift = entry.shift as unknown as Shift | null

  if (!setor || !shift) return null

  return {
    setor: setor.nome,
    setor_cor: setor.cor,
    turno_nome: shift.nome,
    turno_inicio: shift.hora_inicio,
    turno_fim: shift.hora_fim,
    tipo: entry.tipo as "fixa" | "provisoria",
  }
}

export async function getTodayAllSchedules(): Promise<{
  entries: TodayAllScheduleEntry[]
  bySetor: Map<string, TodayAllScheduleEntry[]>
}> {
  const supabase = await createClient()
  const todayStr = new Date().toISOString().split("T")[0]

  const { data: entries } = await supabase
    .from("escala")
    .select(`
      funcionario_id,
      tipo,
      setor:setores(nome, cor),
      shift:shifts(nome, hora_inicio, hora_fim),
      profile:profiles(nome, matricula)
    `)
    .eq("data", todayStr)

  const result: TodayAllScheduleEntry[] = []

  if (entries) {
    for (const e of entries) {
      const setor = e.setor as unknown as { nome: string; cor: string } | null
      const shift = e.shift as unknown as { nome: string; hora_inicio: string; hora_fim: string } | null
      const profile = e.profile as unknown as { nome: string; matricula: string } | null

      if (setor && shift && profile) {
        result.push({
          userId: e.funcionario_id,
          nome: profile.nome,
          matricula: profile.matricula,
          setor_nome: setor.nome,
          setor_cor: setor.cor,
          turno_nome: shift.nome,
          turno_inicio: shift.hora_inicio,
          turno_fim: shift.hora_fim,
          tipo: e.tipo as "fixa" | "provisoria",
        })
      }
    }
  }

  // Group by setor
  const bySetor = new Map<string, TodayAllScheduleEntry[]>()
  for (const entry of result) {
    const existing = bySetor.get(entry.setor_nome) ?? []
    existing.push(entry)
    bySetor.set(entry.setor_nome, existing)
  }

  // Sort entries within each setor by turno_inicio
  for (const [, entries] of bySetor) {
    entries.sort((a, b) => a.turno_inicio.localeCompare(b.turno_inicio))
  }

  return { entries: result, bySetor }
}
