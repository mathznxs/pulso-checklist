"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"
import type { Task, TaskSubmission } from "@/lib/types"

export async function getTodayTasks(
  setor?: string,
  status?: string
): Promise<Task[]> {
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  let query = supabase
    .from("tasks")
    .select(
      "*, atribuido_profile:profiles!tasks_atribuido_para_fkey(*), criado_profile:profiles!tasks_criado_por_fkey(*)"
    )
    .gte("prazo", `${today}T00:00:00`)
    .lte("prazo", `${today}T23:59:59`)
    .order("prazo", { ascending: true })

  if (setor) query = query.eq("setor", setor)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) {
    console.error("Error fetching tasks:", error)
    return []
  }
  return (data as Task[]) ?? []
}

export async function createTask(formData: FormData): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: "Nao autenticado" }

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
  if (!user) return { error: "Nao autenticado" }

  const { data: submission, error: fetchErr } = await supabase
    .from("task_submissions")
    .select("task_id")
    .eq("id", submissionId)
    .single()

  if (fetchErr || !submission) return { error: "Submissao nao encontrada" }

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
