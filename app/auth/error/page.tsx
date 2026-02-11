import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AuthErrorPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">
          Erro de Autenticacao
        </h1>
        <p className="mt-2 text-muted-foreground">
          Ocorreu um erro ao tentar autenticar. Tente novamente.
        </p>
        <Button asChild className="mt-4">
          <Link href="/auth/login">Voltar ao Login</Link>
        </Button>
      </div>
    </div>
  )
}
