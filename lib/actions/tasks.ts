"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Task, TaskSubmission } from "@/lib/types"

/** Liderança: todas as tarefas da loja, qualquer data/usuário. Assistente: todas atribuídas a ele, qualquer data. */
export async function getTasksForRole(options: {
  userId: string
  isLideranca: boolean
  setor?: string
  status?: string
  dataInicio?: string
  dataFim?: string
  usuarioId?: string
}): Promise<Task[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  let query = supabase
    .from("tasks")
    .select(
      "*, atribuido_profile:profiles!tasks_atribuido_para_fkey(*), criado_profile:profiles!tasks_criado_por_fkey(*)"
    )
    .order("prazo", { ascending: false })

  if (options.isLideranca) {
    // Liderança: todas as tarefas; filtros opcionais
    if (options.usuarioId) query = query.eq("atribuido_para", options.usuarioId)
    if (options.dataInicio) query = query.gte("prazo", `${options.dataInicio}T00:00:00`)
    if (options.dataFim) query = query.lte("prazo", `${options.dataFim}T23:59:59`)
  } else {
    // Assistente: apenas tarefas atribuídas a ele, qualquer data
    query = query.eq("atribuido_para", options.userId)
  }

  if (options.setor) query = query.eq("setor", options.setor)
  if (options.status) query = query.eq("status", options.status)

  const { data, error } = await query
  if (error) {
    console.error("Error fetching tasks:", error)
    return []
  }

  const tasks = (data as Task[]) ?? []

  // Marcar PENDENTE com prazo < hoje como expirada (só visual; persistir em batch opcional)
  const normalized = tasks.map((t) => {
    if (t.status === "pendente" && t.prazo < `${today}T00:00:00`) {
      return { ...t, status: "expirada" as const }
    }
    return t
  })

  return normalized
}

/** @deprecated Use getTasksForRole. Mantido para compatibilidade. */
export async function getTodayTasks(
  setor?: string,
  status?: string
): Promise<Task[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const { data: profile } = await supabase
    .from("profiles")
    .select("cargo")
    .eq("id", user.id)
    .single()

  const isLideranca =
    profile?.cargo === "gerente" ||
    profile?.cargo === "supervisão"

  return getTasksForRole({
    userId: user.id,
    isLideranca: !!isLideranca,
    setor,
    status,
  })
}

export async function createTask(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { error } = await supabase.from("tasks").insert({
    titulo: formData.get("titulo") as string,
    descricao: (formData.get("descricao") as string) || null,
    prazo: formData.get("prazo") as string,
    setor: (formData.get("setor") as string) || null,
    atribuido_para: formData.get("atribuido_para") as string,
    criado_por: user.id,
  })

  if (error) return { error: error.message }
  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

export async function updateTaskStatus(
  taskId: string,
  status: string
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("tasks")
    .update({ status })
    .eq("id", taskId)

  if (error) return { error: error.message }
  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

export async function submitTask(
  taskId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createClient()

  const { error: subError } = await supabase.from("task_submissions").insert({
    task_id: taskId,
    comentario_assistente:
      (formData.get("comentario") as string) || null,
    imagem_assistente:
      (formData.get("imagem_url") as string) || null,
  })

  if (subError) return { error: subError.message }

  await supabase
    .from("tasks")
    .update({ status: "aguardando" })
    .eq("id", taskId)

  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

export async function validateSubmission(
  submissionId: string,
  approved: boolean,
  feedback: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Não autenticado" }

  const { data: submission, error: fetchErr } = await supabase
    .from("task_submissions")
    .select("task_id")
    .eq("id", submissionId)
    .single()

  if (fetchErr || !submission) return { error: "Submissão não encontrada" }

  const { error } = await supabase
    .from("task_submissions")
    .update({
      status_validacao: approved ? "aprovada" : "devolvida",
      feedback_lideranca: feedback,
      validado_por: user.id,
      validado_em: new Date().toISOString(),
    })
    .eq("id", submissionId)

  if (error) return { error: error.message }

  await supabase
    .from("tasks")
    .update({ status: approved ? "concluida" : "ressalva" })
    .eq("id", submission.task_id)

  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

export async function getSubmissionsForTask(
  taskId: string
): Promise<TaskSubmission[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from("task_submissions")
    .select("*")
    .eq("task_id", taskId)
    .order("criado_em", { ascending: false })

  return (data as TaskSubmission[]) ?? []
}

export async function deleteTask(taskId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase.from("tasks").delete().eq("id", taskId)
  if (error) return { error: error.message }
  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

/** Liderança: reabrir tarefa expirada (status → pendente). */
export async function reopenTask(taskId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("tasks")
    .update({ status: "pendente" })
    .eq("id", taskId)
    .eq("status", "expirada")
  if (error) return { error: error.message }
  revalidatePath("/execucao")
  revalidatePath("/")
  return {}
}

/** Marca como expirada todas as tarefas PENDENTE com prazo antes de hoje. */
export async function markExpiredTasks(): Promise<{ error?: string }> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]
  const { error } = await supabase
    .from("tasks")
    .update({ status: "expirada" })
    .eq("status", "pendente")
    .lt("prazo", `${today}T00:00:00`)
  if (error) return { error: error.message }
  // Sem revalidatePath aqui: esta função deve ser usada por ações/cron, nunca durante render.
  return {}
}
