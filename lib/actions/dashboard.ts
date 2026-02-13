"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  DashboardStats,
  SectorStats,
  OperationalStatus,
  Announcement,
} from "@/lib/types"

/** Métricas reais: todas as tarefas (sem filtro apenas por hoje). */
export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, setor")

  const stats: DashboardStats = {
    concluidas: 0,
    pendentes: 0,
    ressalvas: 0,
    expiradas: 0,
  }

  if (tasks) {
    for (const t of tasks) {
      if (t.status === "concluida") stats.concluidas++
      else if (t.status === "pendente" || t.status === "aguardando")
        stats.pendentes++
      else if (t.status === "ressalva") stats.ressalvas++
      else if (t.status === "expirada") stats.expiradas++
    }
  }

  return stats
}

/** Estatísticas por setor (todas as tarefas). */
export async function getSectorStats(): Promise<SectorStats[]> {
  const supabase = await createClient()

  const { data: tasks } = await supabase.from("tasks").select("status, setor")

  const sectorMap = new Map<
    string,
    { concluidas: number; total: number; pendentes: number }
  >()

  if (tasks) {
    for (const t of tasks) {
      const setor = t.setor ?? "Sem Setor"
      if (!sectorMap.has(setor))
        sectorMap.set(setor, { concluidas: 0, total: 0, pendentes: 0 })
      const s = sectorMap.get(setor)!
      s.total++
      if (t.status === "concluida") s.concluidas++
      else s.pendentes++
    }
  }

  return Array.from(sectorMap.entries()).map(([name, data]) => ({
    name,
    percentage: data.total > 0 ? Math.round((data.concluidas / data.total) * 100) : 0,
    concluidas: data.concluidas,
    total: data.total,
    pendentes: data.pendentes,
  }))
}

export async function getOperationalStatus(): Promise<OperationalStatus> {
  const stats = await getDashboardStats()
  const total =
    stats.concluidas + stats.pendentes + stats.ressalvas + stats.expiradas
  if (total === 0) return "crítico"
  const pct = (stats.concluidas / total) * 100
  if (pct >= 90) return "ótimo"
  if (pct >= 70) return "normal"
  if (pct >= 50) return "atenção"
  return "crítico"
}

export async function getChecklistPercentage(): Promise<number> {
  const stats = await getDashboardStats()
  const total =
    stats.concluidas + stats.pendentes + stats.ressalvas + stats.expiradas
  if (total === 0) return 0
  return Math.round((stats.concluidas / total) * 100)
}

export async function getActiveAnnouncement(): Promise<Announcement | null> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("announcements")
    .select("*")
    .eq("ativo", true)
    .order("criado_em", { ascending: false })
    .limit(1)
    .single()
  return data as Announcement | null
}

export async function getWeeklyPerformance(): Promise<
  { day: string; percentage: number }[]
> {
  const supabase = await createClient()
  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay())
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)

  const startStr = startOfWeek.toISOString().split("T")[0]
  const endStr = endOfWeek.toISOString().split("T")[0]

  const { data: tasks } = await supabase
    .from("tasks")
    .select("status, prazo")
    .gte("prazo", `${startStr}T00:00:00`)
    .lte("prazo", `${endStr}T23:59:59`)

  const dayMap = new Map<number, { total: number; concluidas: number }>()

  if (tasks) {
    for (const t of tasks) {
      const taskDate = new Date(t.prazo)
      const dayIdx = taskDate.getDay()
      if (!dayMap.has(dayIdx)) dayMap.set(dayIdx, { total: 0, concluidas: 0 })
      const d = dayMap.get(dayIdx)!
      d.total++
      if (t.status === "concluida") d.concluidas++
    }
  }

  return Array.from({ length: 7 }, (_, i) => {
    const d = dayMap.get(i)
    return {
      day: dayNames[i],
      percentage: d && d.total > 0 ? Math.round((d.concluidas / d.total) * 100) : 0,
    }
  })
}

/** Performance por funcionário (todas as tarefas). */
export async function getEmployeePerformance(): Promise<
  {
    matricula: string
    nome: string
    setor: string
    concluidas: number
    pendentes: number
    ressalvas: number
    percentual: number
  }[]
> {
  const supabase = await createClient()

  const { data: tasks } = await supabase
    .from("tasks")
    .select(
      "status, atribuido_para, atribuido_profile:profiles!tasks_atribuido_para_fkey(matricula, nome, setor_base)"
    )

  if (!tasks || tasks.length === 0) return []

  const empMap = new Map<
    string,
    {
      matricula: string
      nome: string
      setor: string
      concluidas: number
      pendentes: number
      ressalvas: number
      total: number
    }
  >()

  for (const t of tasks) {
    const profile = t.atribuido_profile as unknown as {
      matricula: string
      nome: string
      setor_base: string | null
    } | null
    if (!profile) continue
    const key = t.atribuido_para as string
    if (!empMap.has(key)) {
      empMap.set(key, {
        matricula: profile.matricula,
        nome: profile.nome,
        setor: profile.setor_base ?? "Sem Setor",
        concluidas: 0,
        pendentes: 0,
        ressalvas: 0,
        total: 0,
      })
    }
    const emp = empMap.get(key)!
    emp.total++
    if (t.status === "concluida") emp.concluidas++
    else if (t.status === "ressalva") emp.ressalvas++
    else emp.pendentes++
  }

  return Array.from(empMap.values()).map((emp) => ({
    matricula: emp.matricula,
    nome: emp.nome,
    setor: emp.setor,
    concluidas: emp.concluidas,
    pendentes: emp.pendentes,
    ressalvas: emp.ressalvas,
    percentual:
      emp.total > 0 ? Math.round((emp.concluidas / emp.total) * 100) : 0,
  }))
}
