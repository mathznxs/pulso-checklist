"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift, Setor, EscalaEntry } from "@/lib/types"
import { createShift, createEscalaEntry, deleteEscalaEntry, updateAnnouncement } from "@/lib/actions/admin"
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
  Users,
  UserPlus,
  Settings,
  Calendar,
  Search,
  Loader2,
  Edit2,
  Ban,
  CheckCircle2,
  Megaphone,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
} from "lucide-react"

const cargoConfig: Record<string, { label: string; bgClass: string }> = {
  assistente: { label: "Assistente", bgClass: "bg-blue-50 text-blue-700" },
  gerente: { label: "Gerente", bgClass: "bg-emerald-50 text-emerald-700" },
}

interface AdminContentProps {
  profiles: Profile[]
  shifts: Shift[]
  setores: Setor[]
  escalaEntries: EscalaEntry[]
  currentProfile: Profile
}

export function AdminContent({
  profiles,
  shifts,
  setores,
  escalaEntries,
  currentProfile,
}: AdminContentProps) {
  const [activeTab, setActiveTab] = useState<"usuarios" | "escalas" | "turnos" | "sistema">("usuarios")
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState<Profile | null>(null)
  const [showCreateShift, setShowCreateShift] = useState(false)
  const [showAnnouncement, setShowAnnouncement] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  // Escala state
  const [escalaDate, setEscalaDate] = useState(new Date().toISOString().split("T")[0])
  const [addingToSetor, setAddingToSetor] = useState<Setor | null>(null)
  const [selectedTurno, setSelectedTurno] = useState("")
  const [selectedFuncionario, setSelectedFuncionario] = useState("")
  const [selectedTipo, setSelectedTipo] = useState<"fixa" | "provisoria">("fixa")

  const filteredProfiles = profiles.filter(
    (p) =>
      p.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.matricula.includes(searchTerm)
  )

  const tabs = [
    { key: "usuarios" as const, label: "Usuarios", icon: Users },
    { key: "escalas" as const, label: "Escalas", icon: Calendar },
    { key: "turnos" as const, label: "Turnos", icon: Clock },
    { key: "sistema" as const, label: "Sistema", icon: Settings },
  ]

  // Group escala entries by setor
  const entriesBySetor = new Map<string, EscalaEntry[]>()
  for (const entry of escalaEntries) {
    const existing = entriesBySetor.get(entry.setor_id) ?? []
    existing.push(entry)
    entriesBySetor.set(entry.setor_id, existing)
  }
  for (const [, entries] of entriesBySetor) {
    entries.sort((a, b) => (a.shift?.hora_inicio ?? "").localeCompare(b.shift?.hora_inicio ?? ""))
  }

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
          matricula: formData.get("matricula"),
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

  // --- Add Escala Entry ---
  async function handleAddEscalaEntry() {
    if (!addingToSetor || !selectedTurno || !selectedFuncionario) return
    setFormError(null)

    startTransition(async () => {
      const result = await createEscalaEntry(
        addingToSetor.id,
        selectedTurno,
        selectedFuncionario,
        escalaDate,
        selectedTipo
      )
      if (result.error) {
        setFormError(result.error)
        return
      }
      setAddingToSetor(null)
      setSelectedTurno("")
      setSelectedFuncionario("")
      setFormError(null)
      router.refresh()
    })
  }

  // --- Delete Escala Entry ---
  async function handleDeleteEscalaEntry(id: string) {
    startTransition(async () => {
      await deleteEscalaEntry(id)
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

  const activeProfiles = profiles.filter((p) => p.ativo)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Administracao</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gerenciamento de usuarios, escalas e configuracoes
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="-mx-4 flex items-center gap-0 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:gap-1 sm:px-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-medium transition-colors sm:gap-2 sm:px-4 sm:text-sm ${
              activeTab === tab.key
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <tab.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
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
                placeholder="Buscar por nome ou matricula..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Novo Usuario
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Usuario</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="cu-matricula">Matricula</Label>
                    <Input id="cu-matricula" name="matricula" required placeholder="Ex: 10234" />
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
                      <option value="gerente">Gerente</option>
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
                      {setores.map((s) => (
                        <option key={s.id} value={s.nome}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                  {formError && (
                    <p className="text-sm text-destructive">{formError}</p>
                  )}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Criar Usuario
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile: Card list */}
          <div className="mt-4 flex flex-col gap-3 sm:hidden">
            {filteredProfiles.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Nenhum usuario encontrado</p>
            ) : (
              filteredProfiles.map((user) => {
                const cargo = cargoConfig[user.cargo] ?? cargoConfig.assistente
                return (
                  <div key={user.id} className="flex items-center justify-between rounded-lg border border-border bg-card p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">{user.nome ?? "-"}</p>
                        <span className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          user.ativo ? "bg-emerald-50 text-emerald-700" : "bg-muted text-muted-foreground"
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${user.ativo ? "bg-emerald-500" : "bg-muted-foreground"}`} />
                          {user.ativo ? "Ativo" : "Inativo"}
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => { setShowEditUser(user); setFormError(null) }}
                        className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Editar usuario"
                      >
                        <Edit2 className="h-4 w-4" />
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
                          {user.ativo ? <Ban className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Desktop: Table */}
          <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border sm:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Matricula</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cargo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    <span className="sr-only">Acoes</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {filteredProfiles.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhum usuario encontrado
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
                <DialogTitle>Editar Usuario</DialogTitle>
              </DialogHeader>
              {showEditUser && (
                <form onSubmit={handleEditUser} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <Label>Matricula</Label>
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
                      <option value="gerente">Gerente</option>
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
                      {setores.map((s) => (
                        <option key={s.id} value={s.nome}>{s.nome}</option>
                      ))}
                    </select>
                  </div>
                  {formError && <p className="text-sm text-destructive">{formError}</p>}
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar Alteracoes
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
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-sm font-semibold text-foreground">Escala por Setor</h3>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={escalaDate}
                onChange={(e) => setEscalaDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {setores.map((setor) => {
              const entries = entriesBySetor.get(setor.id) ?? []
              return (
                <div
                  key={setor.id}
                  className="rounded-xl border-2 bg-card"
                  style={{ borderColor: `${setor.cor}55` }}
                >
                  <div
                    className="flex items-center justify-between rounded-t-[10px] px-4 py-3"
                    style={{ backgroundColor: `${setor.cor}25` }}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: setor.cor }}
                      />
                      <h4 className="text-sm font-bold text-foreground">{setor.nome}</h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAddingToSetor(setor)
                        setFormError(null)
                        setSelectedTurno("")
                        setSelectedFuncionario("")
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground"
                      aria-label={`Adicionar turno ao setor ${setor.nome}`}
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex flex-col gap-0 divide-y divide-border">
                    {entries.length === 0 ? (
                      <div className="px-4 py-6 text-center">
                        <p className="text-xs text-muted-foreground">Nenhum turno escalado</p>
                      </div>
                    ) : (
                      entries.map((entry) => (
                        <div key={entry.id} className="flex items-center justify-between px-4 py-3">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {entry.profile?.nome ?? "N/A"}
                            </p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {entry.shift?.nome} ({entry.shift?.hora_inicio.slice(0, 5)} - {entry.shift?.hora_fim.slice(0, 5)})
                              </span>
                              {entry.tipo === "provisoria" && (
                                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                  Prov.
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteEscalaEntry(entry.id)}
                            disabled={isPending}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Remover entrada"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Add Entry Dialog */}
          <Dialog
            open={addingToSetor !== null}
            onOpenChange={(open) => {
              if (!open) {
                setAddingToSetor(null)
                setFormError(null)
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Adicionar Turno - {addingToSetor?.nome}</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Data</Label>
                  <Input type="date" value={escalaDate} disabled className="bg-muted" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-add-turno">Turno</Label>
                  <select
                    id="admin-add-turno"
                    value={selectedTurno}
                    onChange={(e) => setSelectedTurno(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione o turno</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.hora_inicio.slice(0, 5)} - {s.hora_fim.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-add-func">Funcionario</Label>
                  <select
                    id="admin-add-func"
                    value={selectedFuncionario}
                    onChange={(e) => setSelectedFuncionario(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione o funcionario</option>
                    {activeProfiles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.matricula})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="admin-add-tipo">Tipo</Label>
                  <select
                    id="admin-add-tipo"
                    value={selectedTipo}
                    onChange={(e) => setSelectedTipo(e.target.value as "fixa" | "provisoria")}
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="fixa">Fixa</option>
                    <option value="provisoria">Provisoria</option>
                  </select>
                </div>
                {formError && <p className="text-sm text-destructive">{formError}</p>}
                <Button
                  onClick={handleAddEscalaEntry}
                  disabled={isPending || !selectedTurno || !selectedFuncionario}
                >
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Confirmar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
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
                    <Label htmlFor="st-inicio">Hora Inicio</Label>
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
            <h4 className="text-sm font-semibold text-foreground">Informacoes do Sistema</h4>
            <div className="mt-4 flex flex-col gap-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Versao</span>
                <span className="font-medium text-foreground">4.0</span>
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
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Setores</span>
                <span className="font-medium text-foreground">{setores.length}</span>
              </div>
            </div>
          </div>

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
