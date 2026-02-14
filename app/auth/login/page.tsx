"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)

  function handleSignIn() {
    setLoading(true)
    signIn("microsoft-entra-id", { callbackUrl: "/" })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
              <svg
                viewBox="0 0 24 24"
                className="h-5 w-5 text-primary-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-foreground">
              CENTAURO <span className="text-primary">PULSO</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sistema de Execução Operacional
          </p>
        </div>

        <Button
          onClick={handleSignIn}
          disabled={loading}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecionando...
            </>
          ) : (
            <>
              <svg
                className="mr-2 h-5 w-5"
                viewBox="0 0 21 21"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <rect x="1" y="1" width="9" height="9" fill="currentColor" fillOpacity="0.8" />
                <rect x="11" y="1" width="9" height="9" fill="currentColor" fillOpacity="0.6" />
                <rect x="1" y="11" width="9" height="9" fill="currentColor" fillOpacity="0.6" />
                <rect x="11" y="11" width="9" height="9" fill="currentColor" fillOpacity="0.4" />
              </svg>
              Entrar com Microsoft
            </>
          )}
        </Button>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Centauro Pulso - Acesso restrito a colaboradores
        </p>
      </div>
    </div>
  )
}
