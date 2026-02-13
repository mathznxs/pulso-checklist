"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift, FixedSchedule } from "@/lib/types"
import { createShift, createFixedSchedule, updateAnnouncement } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Users,
  UserPlus,
  Settings,
  Calendar,
  ClipboardList,
  Search,
  Loader2,
  Edit2,
  Ban,
  CheckCircle2,
  Megaphone,
  Clock,
  Plus,
} from "lucide-react"

const cargoConfig: Record<string, { label: string; bgClass: string }> = {
  assistente: { label: "Assistente", bgClass: "bg-blue-50 text-blue-700" },
  supervisão: { label: "Supervisão", bgClass: "bg-amber-50 text-amber-700" },
  gerente: { label: "Gerente", bgClass: "bg-emerald-50 text-emerald-700" },
  admin: { label: "Admin", bgClass: "bg-red-50 text-red-700" },
}

const SETORES = [
  "Masculino", "Feminino", "Futebol", "Ilha", "Infantil",
  "Anfitrião", "Caixa", "OMS", "Provador", "estoque",
]

const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sab" },
]

interface AdminContentProps {
  profiles: Profile[]
  shifts: Shift[]
  schedules: FixedSchedule[]
  sectors: string[]
  currentProfile: Profile
}

export function AdminContent({
  profiles,
  shifts,
  schedules,
  sectors,
  currentProfile,
}: AdminContentProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "escalas" | "turnos" | "sistema">("usuarios")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState<Profile | null>(null)
  const [showCreateShift, setShowCreateShift] = useState(false)
  const [showCreateSchedule, setShowCreateSchedule] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  const filteredProfiles = profiles.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricula.includes(searchTerm)
  )

  const tabs = [
    { key: "usuarios" as const, label: "Usuários", icon: Users },
    { key: "escalas" as const, label: "Escalas", icon: Calendar },
    { key: "turnos" as const, label: "Turnos", icon: Clock },
    { key: "sistema" as const, label: "Sistema", icon: Settings },
  ]

  // --- Create User ---
  async function handleCreateUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setFormError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricula: formData.get("matrícula"),
          nome: formData.get("nome"),
          cpf: formData.get("cpf"),
          cargo: formData.get("cargo"),
          setor_base: formData.get("setor_base") || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error)
        return
      }
      setShowCreateUser(false)
      setFormError(null)
      router.refresh()
    })
  }

  // --- Edit User ---
  async function handleEditUser(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!showEditUser) return
    setFormError(null)
    const form = e.currentTarget
    const formData = new FormData(form)

    startTransition(async () => {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: showEditUser.id,
          nome: formData.get("nome"),
          cargo: formData.get("cargo"),
          setor_base: formData.get("setor_base") || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setFormError(data.error)
        return
      }
      setShowEditUser(null)
      setFormError(null)
      router.refresh()
    })
  }

  // --- Toggle Active ---
  async function handleToggleActive(user: Profile) {
    startTransition(async () => {
      await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          ativo: !user.ativo,
        }),
      })
      router.refresh()
    })
  }

  // --- Create Shift ---
  async function handleCreateShift(formData: FormData) {
    startTransition(async () => {
      await createShift(formData)
      setShowCreateShift(false)
      router.refresh()
    })
  }

  // --- Create Fixed Schedule ---
  async function handleCreateSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const fd = new FormData(form)
    // Collect checked days
    const dias = DIAS_SEMANA.filter(
      (d) => fd.get(`dia_${d.value}`) === "on"
    ).map((d) => d.value)
    fd.set("dias_semana", dias.join(","))

    startTransition(async () => {
      await createFixedSchedule(fd)
      setShowCreateSchedule(false)
      router.refresh()
    })
  }

  // --- Announcement ---
  async function handleAnnouncement(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const msg = fd.get("message") as string
    startTransition(async () => {
      await updateAnnouncement(msg)
      setShowAnnouncement(false)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Administração</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciamento de usuários, escalas e configurações
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* === USUARIOS TAB === */}
      {activeTab === "usuarios" && (
        <div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou matrícula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuário</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-matricula">Matrácula</Label>
                    <Input id="cu-matricula" name="matrícula" required placeholder="Ex: 10234" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-nome">Nome Completo</Label>
                    <Input id="cu-nome" name="nome" required placeholder="Ex: Lucas Almeida" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-cpf">CPF</Label>
                    <Input id="cu-cpf" name="cpf" required placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-cargo">Cargo</Label>
                    <select
                      id="cu-cargo"
                      name="cargo"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="assistente">Assistente</option>
                      <option value="supervisão">Supervisor</option>
                      <option value="gerente">Gerente</option>
                      <option value="embaixador">Embaixador</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-setor">Setor Base</Label>
                    <select
                      id="cu-setor"
                      name="setor_base"
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Nenhum</option>
                      {SETORES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuário
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matricula</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuário encontrado
                    </td>
                  </tr>
                ) : (
                  filteredProfiles.map((user) => {
                    const cargo = cargoConfig[user.cargo] ?? cargoConfig.assistente
                    return (
                      <tr key={user.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium text-foreground">{user.nome}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{user.matricula}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${cargo.bgClass}`}>
                            {cargo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-foreground">{user.setor_base ?? "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            user.ativo ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${user.ativo ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                            {user.ativo ? "Ativo" : "Inativo"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => { setShowEditUser(user); setFormError(null) }}
                              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label="Editar usuario"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </button>
                            {user.id !== currentProfile.id && (
                              <button
                                type="button"
                                onClick={() => handleToggleActive(user)}
                                disabled={isPending}
                                className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-muted ${
                                  user.ativo ? "text-red-500 hover:text-red-600" : "text-emerald-500 hover:text-emerald-600"
                                }`}
                                aria-label={user.ativo ? "Desativar" : "Ativar"}
                              >
                                {user.ativo ? <Ban className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Edit User Dialog */}
          <Dialog open={showEditUser !== null} onOpenChange={(open) => !open && setShowEditUser(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Usuário</DialogTitle>
              </DialogHeader>
              {showEditUser && (
                <form onSubmit={handleEditUser} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Matrícula</Label>
                    <Input value={showEditUser.matricula} disabled className="bg-muted" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="eu-nome">Nome</Label>
                    <Input id="eu-nome" name="nome" defaultValue={showEditUser.nome} required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="eu-cargo">Cargo</Label>
                    <select
                      id="eu-cargo"
                      name="cargo"
                      defaultValue={showEditUser.cargo}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="assistente">Assistente</option>
                      <option value="lideranca">Supervisão</option>
                      <option value="gerente">Gerente</option>
                      <option value="embaixador">Embaixador</option>
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="eu-setor">Setor Base</Label>
                    <select
                      id="eu-setor"
                      name="setor_base"
                      defaultValue={showEditUser.setor_base ?? ""}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Nenhum</option>
                      {SETORES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  {formError && <p className="text-sm text-destructive">{formError}</p>}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alterações
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* === ESCALAS TAB === */}
      {activeTab === "escalas" && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Escala Fixa</h3>
            <Dialog open={showCreateSchedule} onOpenChange={setShowCreateSchedule}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Criar Escala Fixa
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Escala Fixa</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateSchedule} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cs-user">Funcionário</Label>
                    <select
                      id="cs-user"
                      name="user_id"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Selecione</option>
                      {profiles.filter((p) => p.ativo).map((p) => (
                        <option key={p.id} value={p.id}>{p.nome} ({p.matricula})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cs-setor">Setor</Label>
                    <select
                      id="cs-setor"
                      name="setor"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Selecione</option>
                      {SETORES.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cs-turno">Turno</Label>
                    <select
                      id="cs-turno"
                      name="turno_id"
                      required
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Selecione</option>
                      {shifts.map((s) => (
                        <option key={s.id} value={s.id}>{s.nome} ({s.hora_inicio} - {s.hora_fim})</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Dias da Semana</Label>
                    <div className="flex flex-wrap gap-3">
                      {DIAS_SEMANA.map((d) => (
                        <label key={d.value} className="flex items-center gap-1.5 text-sm">
                          <input type="checkbox" name={`dia_${d.value}`} className="h-4 w-4 rounded border-input" />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Escala
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[600px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Dias</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {schedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma escala fixa cadastrada
                    </td>
                  </tr>
                ) : (
                  schedules.map((s) => (
                    <tr key={s.id} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium text-foreground">{s.profile?.nome ?? "N/A"}</td>
                      <td className="px-4 py-3 text-foreground">{s.setor}</td>
                      <td className="px-4 py-3 text-foreground">{s.shift?.nome ?? "N/A"}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {s.dias_semana.map((d) => (
                            <span key={d} className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                              {DIAS_SEMANA.find((ds) => ds.value === d)?.label ?? d}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* === TURNOS TAB === */}
      {activeTab === "turnos" && (
        <div>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">Turnos Configurados</h3>
            <Dialog open={showCreateShift} onOpenChange={setShowCreateShift}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Novo Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Turno</DialogTitle>
                </DialogHeader>
                <form action={handleCreateShift} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="st-nome">Nome</Label>
                    <Input id="st-nome" name="nome" required placeholder="Ex: Manha" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="st-inicio">Hora Início</Label>
                    <Input id="st-inicio" name="hora_inicio" type="time" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="st-fim">Hora Fim</Label>
                    <Input id="st-fim" name="hora_fim" type="time" required />
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Turno
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {shifts.length === 0 ? (
              <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
                Nenhum turno cadastrado. Crie turnos para configurar escalas.
              </p>
            ) : (
              shifts.map((turno) => (
                <div key={turno.id} className="rounded-lg border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{turno.nome}</p>
                  <p className="mt-1 text-lg font-bold text-primary">
                    {turno.hora_inicio.slice(0, 5)} - {turno.hora_fim.slice(0, 5)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* === SISTEMA TAB === */}
      {activeTab === "sistema" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground">Informações do Sistema</h4>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-medium text-foreground">3.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Banco</span>
                <span className="font-medium text-foreground">PostgreSQL (Supabase)</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Total Usuarios</span>
                <span className="font-medium text-foreground">{profiles.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Ativos</span>
                <span className="font-medium text-foreground">{profiles.filter((p) => p.ativo).length}</span>
              </div>
            </div>
          </div>

          {/* <div className="rounded-lg border border-border bg-card p-5">
            <h4 className="text-sm font-semibold text-foreground">Configuracoes de Login</h4>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Login via</span>
                <span className="font-medium text-foreground">Matrícula</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Senha</span>
                <span className="font-medium text-foreground">CPF</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Autenticação</span>
                <span className="font-medium text-foreground">Supabase Auth</span>
              </div>
            </div>
          </div> */}

          <div className="rounded-lg border border-border bg-card p-5 sm:col-span-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-foreground">Aviso / Banner</h4>
              <Dialog open={showAnnouncement} onOpenChange={setShowAnnouncement}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Megaphone className="mr-1.5 h-3.5 w-3.5" />
                    Atualizar Aviso
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Atualizar Banner</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAnnouncement} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="ann-message">Mensagem</Label>
                      <Input id="ann-message" name="message" required placeholder="Ex: Foco em IPC esta semana!" />
                    </div>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Publicar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              O banner e exibido no topo de todas as paginas para todos os colaboradores.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
