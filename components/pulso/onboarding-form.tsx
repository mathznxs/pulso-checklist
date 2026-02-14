"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertCircle, Loader2 } from "lucide-react"
import { completeOnboarding, getLojas } from "@/lib/actions/onboarding"
import type { Setor } from "@/lib/types"

interface OnboardingFormProps {
  setores: Setor[]
}

export function OnboardingForm({ setores }: OnboardingFormProps) {
  const [matricula, setMatricula] = useState("")
  const [nome, setNome] = useState("")
  const [cargo, setCargo] = useState<"assistente" | "gerente">("assistente")
  const [setorBase, setSetorBase] = useState<string>("")
  const [lojaNumero, setLojaNumero] = useState("")
  const [lojas, setLojas] = useState<
    { id: string; numero_loja: string; nome: string }[]
  >([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    getLojas().then(setLojas)
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    if (!matricula.trim()) {
      setError("Informe sua matricula.")
      setLoading(false)
      return
    }

    if (!nome.trim()) {
      setError("Informe seu nome.")
      setLoading(false)
      return
    }

    if (!lojaNumero) {
      setError("Selecione sua loja.")
      setLoading(false)
      return
    }

    const result = await completeOnboarding({
      matricula: matricula.trim(),
      nome: nome.trim(),
      cargo,
      setor_base: setorBase || null,
      loja_numero: lojaNumero,
    })

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
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
          <h1 className="text-lg font-semibold text-foreground">
            Complete seu cadastro
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Preencha seus dados para acessar o sistema
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="nome">Nome completo</Label>
            <Input
              id="nome"
              type="text"
              placeholder="Seu nome completo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              required
            />
          </div>

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
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="loja">Loja</Label>
            <Select value={lojaNumero} onValueChange={setLojaNumero}>
              <SelectTrigger id="loja">
                <SelectValue placeholder="Selecione sua loja" />
              </SelectTrigger>
              <SelectContent>
                {lojas.map((l) => (
                  <SelectItem key={l.id} value={l.numero_loja}>
                    {l.nome} ({l.numero_loja})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="cargo">Cargo</Label>
            <Select
              value={cargo}
              onValueChange={(v) => setCargo(v as "assistente" | "gerente")}
            >
              <SelectTrigger id="cargo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="assistente">Assistente</SelectItem>
                <SelectItem value="gerente">Gerente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="setor">Setor base (opcional)</Label>
            <Select value={setorBase} onValueChange={setSetorBase}>
              <SelectTrigger id="setor">
                <SelectValue placeholder="Selecione um setor" />
              </SelectTrigger>
              <SelectContent>
                {setores.map((s) => (
                  <SelectItem key={s.id} value={s.nome}>
                    {s.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                Salvando...
              </>
            ) : (
              "Concluir cadastro"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Centauro Pulso - Acesso restrito a colaboradores
        </p>
      </div>
    </div>
  )
}
