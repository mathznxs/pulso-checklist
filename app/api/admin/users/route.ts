export const runtime = 'nodejs'

import { createClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

async function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function requireLideranca() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data: profile } = await supabase
    .from("profiles")
    .select("cargo")
    .eq("id", user.id)
    .single()

  const liderancaCargos = ["lideranca", "liderança", "gerente", "supervisão", "admin", "embaixador"]
  if (!profile || !liderancaCargos.includes(profile.cargo)) {
    return null
  }
  return user
}

export async function POST(request: Request) {
  const caller = await requireLideranca()
  if (!caller) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body = await request.json()
  const { matricula, nome, cpf, cargo, setor_base } = body

  if (!matricula || !nome || !cpf || !cargo) {
    return NextResponse.json(
      { error: "Campos obrigatórios: matrícula, nome, cpf, cargo" },
      { status: 400 }
    )
  }

  const cleanCpf = cpf.replace(/\D/g, "")
  if (cleanCpf.length !== 11) {
    return NextResponse.json({ error: "CPF inválido" }, { status: 400 })
  }

  const email = `${matricula}@pulso.centauro.local`

  const adminSupabase = await getAdminSupabase()

  // Create the auth user with admin API (bypasses email confirmation)
  const { data: authData, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email,
      password: cleanCpf,
      email_confirm: true,
      user_metadata: {
        matricula,
        nome,
        cpf: cleanCpf,
        cargo,
        setor_base: setor_base || null,
      },
    })

  if (authError) {
    if (authError.message.includes("already been registered")) {
      return NextResponse.json(
        { error: "Matrícula já cadastrada no sistema" },
        { status: 409 }
      )
    }
    return NextResponse.json({ error: authError.message }, { status: 500 })
  }

  // Update the profile row (trigger should have created it, but let's ensure fields are correct)
  const { error: profileError } = await adminSupabase
    .from("profiles")
    .upsert({
      id: authData.user.id,
      matricula,
      nome,
      cpf: cleanCpf,
      cargo,
      setor_base: setor_base || null,
      ativo: true,
    })

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, userId: authData.user.id })
}

export async function PATCH(request: Request) {
  const caller = await requireLideranca()
  if (!caller) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 })
  }

  const body = await request.json()
  const { userId, nome, cargo, setor_base, ativo } = body

  if (!userId) {
    return NextResponse.json({ error: "userId obrigatório" }, { status: 400 })
  }

  const adminSupabase = await getAdminSupabase()

  const updates: Record<string, unknown> = {}
  if (nome !== undefined) updates.nome = nome
  if (cargo !== undefined) updates.cargo = cargo
  if (setor_base !== undefined) updates.setor_base = setor_base
  if (ativo !== undefined) updates.ativo = ativo

  const { error } = await adminSupabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // If deactivating user, also ban them from auth
  if (ativo === false) {
    await adminSupabase.auth.admin.updateUserById(userId, {
      ban_duration: "876000h", // ~100 years
    })
  } else if (ativo === true) {
    await adminSupabase.auth.admin.updateUserById(userId, {
      ban_duration: "none",
    })
  }

  return NextResponse.json({ success: true })
}
