export const runtime = 'nodejs'

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Arquivo não enviado" }, { status: 400 })
  }

  // Validate file type
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo não permitido. Use JPG, PNG ou WebP." },
      { status: 400 }
    )
  }

  // Max 5MB
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "Arquivo muito grande. Maximo 5MB." },
      { status: 400 }
    )
  }

  const ext = file.name.split(".").pop() ?? "jpg"
  const fileName = `${user.id}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("task-images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    // If bucket doesn't exist, try to create it
    if (uploadError.message.includes("not found") || uploadError.message.includes("Bucket")) {
      // Try uploading to a different path or return a helpful error
      return NextResponse.json(
        { error: `Erro no upload: ${uploadError.message}. Verifique se o bucket 'task-images' existe no Supabase Storage.` },
        { status: 500 }
      )
    }
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: urlData } = supabase.storage
    .from("task-images")
    .getPublicUrl(fileName)

  return NextResponse.json({ url: urlData.publicUrl })
}
