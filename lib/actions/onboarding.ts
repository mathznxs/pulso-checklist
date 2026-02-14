"use server"

import { auth } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { revalidatePath } from "next/cache"

export async function completeOnboarding(formData: {
  matricula: string
  nome: string
  cargo: "assistente" | "gerente"
  setor_base: string | null
  loja_numero: string
}) {
  const session = await auth()
  if (!session?.user?.microsoftId) {
    return { error: "Nao autenticado." }
  }

  const supabase = createServiceClient()

  // Validate loja exists
  const { data: loja, error: lojaError } = await supabase
    .from("lojas")
    .select("id")
    .eq("numero_loja", formData.loja_numero)
    .eq("ativo", true)
    .single()

  if (lojaError || !loja) {
    return { error: "Loja nao encontrada ou inativa." }
  }

  // Check if matricula is unique
  const { data: existingMatricula } = await supabase
    .from("profiles")
    .select("id")
    .eq("matricula", formData.matricula)
    .single()

  if (existingMatricula) {
    return { error: "Essa matricula ja esta em uso." }
  }

  // Check if microsoft_id already has a profile
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("microsoft_id", session.user.microsoftId)
    .single()

  if (existingProfile) {
    // Update existing profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        matricula: formData.matricula,
        nome: formData.nome,
        cargo: formData.cargo,
        setor_base: formData.setor_base,
        loja_id: loja.id,
        onboarding_completo: true,
      })
      .eq("id", existingProfile.id)

    if (updateError) {
      return { error: "Erro ao atualizar perfil: " + updateError.message }
    }
  } else {
    // Create new profile
    const { error: insertError } = await supabase.from("profiles").insert({
      microsoft_id: session.user.microsoftId,
      matricula: formData.matricula,
      nome: formData.nome,
      cargo: formData.cargo,
      setor_base: formData.setor_base,
      loja_id: loja.id,
      onboarding_completo: true,
      ativo: true,
    })

    if (insertError) {
      return { error: "Erro ao criar perfil: " + insertError.message }
    }
  }

  revalidatePath("/", "layout")
  return { success: true }
}

export async function getLojas() {
  const supabase = createServiceClient()
  const { data, error } = await supabase
    .from("lojas")
    .select("id, numero_loja, nome")
    .eq("ativo", true)
    .order("numero_loja")

  if (error) return []
  return data
}
