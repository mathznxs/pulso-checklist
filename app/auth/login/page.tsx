"use client"

import React from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AlertCircle, Loader2 } from "lucide-react"

export default function LoginPage() {
  const [matricula, setMatricula] = useState("")
  const [cpf, setCpf] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  function formatCpf(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 11)
    if (digits.length <= 3) return digits
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length <= 9)
      return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
  }

  function handleCpfChange(e: React.ChangeEvent<HTMLInputElement>) {
    setCpf(formatCpf(e.target.value))
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const cleanMatricula = matricula.trim()
    const cleanCpf = cpf.replace(/\D/g, "")

    if (!cleanMatricula) {
      setError("Informe sua matricula.")
      setLoading(false)
      return
    }

    if (cleanCpf.length !== 11) {
      setError("CPF invalido. Informe os 11 digitos.")
      setLoading(false)
      return
    }

    const email = `${cleanMatricula}@pulso.centauro.local`

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: cleanCpf,
    })

    if (authError) {
      setError("Credenciais invalidas. Verifique sua matricula e CPF.")
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
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
              CENTAURO{" "}
              <span className="text-primary">PULSO</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Sistema de Execucao Operacional
          </p>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="matricula">Matricula</Label>
            <Input
              id="matricula"
              type="text"
              inputMode="numeric"
              placeholder="Ex: 10234"
              value={matricula}
              onChange={(e) => setMatricula(e.target.value.replace(/\D/g, ""))}
              required
              autoComplete="username"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cpf">CPF (senha)</Label>
            <Input
              id="cpf"
              type="text"
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={handleCpfChange}
              required
              autoComplete="current-password"
              maxLength={14}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Centauro Pulso v3.0 - Acesso restrito a colaboradores
        </p>
      </div>
    </div>
  )
}
