"use client"

import { signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { ShieldX } from "lucide-react"

export default function BlockedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
            <ShieldX className="h-8 w-8 text-destructive" />
          </div>
        </div>

        <h1 className="text-xl font-semibold text-foreground">
          Acesso bloqueado
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Sua conta foi desativada pelo administrador. Entre em contato com a
          gerencia da sua loja para mais informacoes.
        </p>

        <Button
          variant="outline"
          className="mt-6 w-full"
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
        >
          Voltar ao login
        </Button>
      </div>
    </div>
  )
}
