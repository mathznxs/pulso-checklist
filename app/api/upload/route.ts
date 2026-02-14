export const runtime = "nodejs"

import { auth } from "@/lib/auth"
import { createServiceClient } from "@/lib/supabase/service"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user?.profileId) {
    return NextResponse.json({ error: "Nao autenticado" }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get("file") as File | null

  if (!file) {
    return NextResponse.json({ error: "Arquivo nao enviado" }, { status: 400 })
  }

  // Validate file type
  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
  ]
  if (!allowed.includes(file.type)) {
    return NextResponse.json(
      { error: "Tipo de arquivo nao permitido. Use JPG, PNG ou WebP." },
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

  const supabase = createServiceClient()

  const ext = file.name.split(".").pop() ?? "jpg"
  const fileName = `${session.user.profileId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from("task-images")
    .upload(fileName, file, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    if (
      uploadError.message.includes("not found") ||
      uploadError.message.includes("Bucket")
    ) {
      return NextResponse.json(
        {
          error: `Erro no upload: ${uploadError.message}. Verifique se o bucket 'task-images' existe no Supabase Storage.`,
        },
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
