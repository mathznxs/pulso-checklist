"use client"

import { useState, useTransition } from "react"
import type { Task, Profile } from "@/lib/types"
import { createTask, updateTaskStatus, submitTask, deleteTask } from "@/lib/actions/tasks"
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
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Loader2,
  Eye,
  Trash2,
  Send,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const statusConfig = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
  aguardando: { label: "Aguardando", icon: Eye, color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  concluida: { label: "Concluida", icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  expirada: { label: "Expirada", icon: XCircle, color: "text-red-600", bg: "bg-red-50 border-red-200" },
  ressalva: { label: "Ressalva", icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
}

interface ExecucaoContentProps {
  initialTasks: Task[]
  profiles: Profile[]
  currentProfile: Profile | null
  isLideranca: boolean
}

export function ExecucaoContent({
  initialTasks,
  profiles,
  currentProfile,
  isLideranca,
}: ExecucaoContentProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [setorFilter, setSetorFilter] = useState<string>("all")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showSubmitDialog, setShowSubmitDialog] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const sectors = Array.from(
    new Set(profiles.map((p) => p.setor_base).filter(Boolean))
  ) as string[]

  const filteredTasks = initialTasks.filter((task) => {
    const matchesSearch =
      task.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.atribuido_profile?.nome
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase())
    const matchesStatus =
      statusFilter === "all" || task.status === statusFilter
    const matchesSetor = setorFilter === "all" || task.setor === setorFilter
    return matchesSearch && matchesStatus && matchesSetor
  })

  async function handleCreateTask(formData: FormData) {
    startTransition(async () => {
      await createTask(formData)
      setShowCreateDialog(false)
      router.refresh()
    })
  }

  async function handleSubmitTask(taskId: string, formData: FormData) {
    startTransition(async () => {
      await submitTask(taskId, formData)
      setShowSubmitDialog(null)
      router.refresh()
    })
  }

  async function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId)
      router.refresh()
    })
  }

  async function handleStatusChange(taskId: string, status: string) {
    startTransition(async () => {
      await updateTaskStatus(taskId, status)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Execucao</h1>
          <p className="text-sm text-muted-foreground">
            {initialTasks.length} tarefas para hoje
          </p>
        </div>
        {isLideranca && (
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Tarefa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <form action={handleCreateTask} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titulo">Titulo</Label>
                  <Input id="titulo" name="titulo" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descricao">Descricao</Label>
                  <Input id="descricao" name="descricao" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input
                    id="prazo"
                    name="prazo"
                    type="datetime-local"
                    required
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="setor">Setor</Label>
                  <select
                    id="setor"
                    name="setor"
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione</option>
                    {sectors.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="atribuido_para">Atribuir Para</Label>
                  <select
                    id="atribuido_para"
                    name="atribuido_para"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione</option>
                    {profiles
                      .filter((p) => p.ativo)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nome} ({p.matricula})
                        </option>
                      ))}
                  </select>
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Criar Tarefa
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pendente">Pendentes</SelectItem>
            <SelectItem value="aguardando">Aguardando</SelectItem>
            <SelectItem value="concluida">Concluidas</SelectItem>
            <SelectItem value="ressalva">Ressalvas</SelectItem>
            <SelectItem value="expirada">Expiradas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={setorFilter} onValueChange={setSetorFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Setor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            {sectors.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Cards */}
      <div className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-muted-foreground">
              Nenhuma tarefa encontrada para hoje
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const config =
              statusConfig[task.status as keyof typeof statusConfig]
            const StatusIcon = config.icon
            const isOwnTask = task.atribuido_para === currentProfile?.id
            const canSubmit =
              isOwnTask && task.status === "pendente"

            return (
              <div
                key={task.id}
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  config.bg
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <StatusIcon className={cn("h-4 w-4", config.color)} />
                      <h3 className="font-semibold text-foreground">
                        {task.titulo}
                      </h3>
                    </div>
                    {task.descricao && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {task.descricao}
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      {task.setor && (
                        <span className="rounded-full bg-card px-2 py-0.5 font-medium">
                          {task.setor}
                        </span>
                      )}
                      <span>
                        Atribuido:{" "}
                        {task.atribuido_profile?.nome ?? "N/A"}
                      </span>
                      <span>
                        Prazo:{" "}
                        {new Date(task.prazo).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {canSubmit && (
                      <Dialog
                        open={showSubmitDialog === task.id}
                        onOpenChange={(open) =>
                          setShowSubmitDialog(open ? task.id : null)
                        }
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            Enviar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Enviar Tarefa</DialogTitle>
                          </DialogHeader>
                          <form
                            action={(formData) =>
                              handleSubmitTask(task.id, formData)
                            }
                            className="flex flex-col gap-4"
                          >
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="comentario">Comentario</Label>
                              <Input id="comentario" name="comentario" />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="imagem_url">
                                URL da Imagem (opcional)
                              </Label>
                              <Input
                                id="imagem_url"
                                name="imagem_url"
                                placeholder="https://..."
                              />
                            </div>
                            <Button type="submit" disabled={isPending}>
                              {isPending ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : null}
                              Enviar
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {isLideranca && task.status === "aguardando" && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-emerald-600 hover:bg-emerald-50 bg-transparent"
                          onClick={() =>
                            handleStatusChange(task.id, "concluida")
                          }
                          disabled={isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 hover:bg-orange-50 bg-transparent"
                          onClick={() =>
                            handleStatusChange(task.id, "ressalva")
                          }
                          disabled={isPending}
                        >
                          <AlertTriangle className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}

                    {isLideranca && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 bg-transparent"
                        onClick={() => handleDeleteTask(task.id)}
                        disabled={isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
