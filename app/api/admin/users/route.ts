export const runtime = "nodejs"

import { auth } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

async function requireLideranca() {
  const session = await auth()
  if (!session?.user?.profileId || session.user.cargo !== "gerente") {
    return null
  }
  return session.user
}

export async function POST(request: Request) {
  const caller = await requireLideranca()
  if (!caller) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
  }

  const body = await request.json()
  const { matricula, nome, cargo, setor_base } = body

  if (!matricula || !nome || !cargo) {
    return NextResponse.json(
      { error: "Campos obrigatorios: matricula, nome, cargo" },
      { status: 400 }
    )
  }

  const supabase = createServiceClient()

  // Check if matricula already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("matricula", matricula)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: "Matricula ja cadastrada no sistema" },
      { status: 409 }
    )
  }

  // Create profile (no Supabase Auth user needed)
  const { data: newProfile, error: profileError } = await supabase
    .from("profiles")
    .insert({
      matricula,
      nome,
      cargo,
      setor_base: setor_base || null,
      loja_id: caller.lojaId,
      ativo: true,
      onboarding_completo: false,
    })
    .select("id")
    .single()

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: newProfile.id })
}

export async function PATCH(request: Request) {
  const caller = await requireLideranca()
  if (!caller) {
    return NextResponse.json({ error: "Sem permissao" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, nome, cargo, setor_base, ativo } = body

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatorio" }, { status: 400 })
  }

  const supabase = createServiceClient()

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (cargo !== undefined) updates.cargo = cargo
  if (setor_base !== undefined) updates.setor_base = setor_base
  if (ativo !== undefined) updates.ativo = ativo

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
