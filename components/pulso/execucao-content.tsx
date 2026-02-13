"use client"

import { useState, useTransition, useRef, useCallback } from "react"
import type { Task, Profile, TaskSubmission } from "@/lib/types"
import {
  createTask,
  updateTaskStatus,
  submitTask,
  deleteTask,
  validateSubmission,
  getSubmissionsForTask,
} from "@/lib/actions/tasks"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
  Camera,
  Upload,
  Image as ImageIcon,
  X,
  MessageSquare,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

const statusConfig = {
  pendente: {
    label: "Pendente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 border-amber-200",
    darkBg: "dark:bg-amber-950/30 dark:border-amber-800",
  },
  aguardando: {
    label: "Aguardando",
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-50 border-blue-200",
    darkBg: "dark:bg-blue-950/30 dark:border-blue-800",
  },
  concluida: {
    label: "Concluída",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50 border-emerald-200",
    darkBg: "dark:bg-emerald-950/30 dark:border-emerald-800",
  },
  expirada: {
    label: "Expirada",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 border-red-200",
    darkBg: "dark:bg-red-950/30 dark:border-red-800",
  },
  ressalva: {
    label: "Ressalva",
    icon: AlertTriangle,
    color: "text-orange-600",
    bg: "bg-orange-50 border-orange-200",
    darkBg: "dark:bg-orange-950/30 dark:border-orange-800",
  },
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
  const [showValidateDialog, setShowValidateDialog] = useState<string | null>(null)
  const [showDetailsDialog, setShowDetailsDialog] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)
  const [validateFeedback, setValidateFeedback] = useState("")
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const sectors = Array.from(
    new Set(profiles.map((p) => p.setor_base).filter(Boolean))
  ) as string[]

  const filteredTasks = initialTasks.filter((task) => {
    const matchesSearch =
      task.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.atribuido_profile?.nome?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || task.status === statusFilter
    const matchesSetor = setorFilter === "all" || task.setor === setorFilter
    return matchesSearch && matchesStatus && matchesSetor
  })

  function handlePhotoCapture(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPhotoFile(file)
    const reader = new FileReader()
    reader.onloadend = () => setPhotoPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  function clearPhoto() {
    setPhotoPreview(null)
    setPhotoFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  async function uploadPhoto(): Promise<string | null> {
    if (!photoFile) return null
    setUploadingPhoto(true)
    try {
      const formData = new FormData()
      formData.append("file", photoFile)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro no upload")
      return data.url
    } catch (err) {
      console.error("Upload error:", err)
      return null
    } finally {
      setUploadingPhoto(false)
    }
  }

  async function handleCreateTask(formData: FormData) {
    startTransition(async () => {
      await createTask(formData)
      setShowCreateDialog(false)
      router.refresh()
    })
  }

  async function handleSubmitTask(taskId: string, formData: FormData) {
    startTransition(async () => {
      const imageUrl = await uploadPhoto()
      if (imageUrl) {
        formData.set("imagem_url", imageUrl)
      }
      await submitTask(taskId, formData)
      setShowSubmitDialog(null)
      clearPhoto()
      router.refresh()
    })
  }

  async function handleDeleteTask(taskId: string) {
    startTransition(async () => {
      await deleteTask(taskId)
      router.refresh()
    })
  }

  const handleOpenValidate = useCallback(async (taskId: string) => {
    setShowValidateDialog(taskId)
    setValidateFeedback("")
    setLoadingSubmissions(true)
    const subs = await getSubmissionsForTask(taskId)
    setSubmissions(subs)
    setLoadingSubmissions(false)
  }, [])

  const handleOpenDetails = useCallback(async (taskId: string) => {
    setShowDetailsDialog(taskId)
    setLoadingSubmissions(true)
    const subs = await getSubmissionsForTask(taskId)
    setSubmissions(subs)
    setLoadingSubmissions(false)
  }, [])

  async function handleValidate(submissionId: string, approved: boolean) {
    startTransition(async () => {
      await validateSubmission(submissionId, approved, validateFeedback || null)
      setShowValidateDialog(null)
      setValidateFeedback("")
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Execução</h1>
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
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Nova Tarefa</DialogTitle>
              </DialogHeader>
              <form action={handleCreateTask} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" name="titulo" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="descricao">Descrição</Label>
                  <Textarea id="descricao" name="descricao" rows={3} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="prazo">Prazo</Label>
                  <Input id="prazo" name="prazo" type="datetime-local" required />
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
                      <option key={s} value={s}>{s}</option>
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
                    {profiles.filter((p) => p.ativo).map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nome} ({p.matricula})
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
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
            <SelectItem value="concluida">Concluídas</SelectItem>
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
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Task Cards */}
      <div className="flex flex-col gap-3">
        {filteredTasks.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-muted-foreground">Nenhuma tarefa encontrada para hoje</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const config = statusConfig[task.status as keyof typeof statusConfig]
            const StatusIcon = config.icon
            const isOwnTask = task.atribuido_para === currentProfile?.id
            const canSubmit = isOwnTask && task.status === "pendente"
            const canResubmit = isOwnTask && task.status === "ressalva"

            return (
              <div
                key={task.id}
                className={cn("rounded-lg border p-4 transition-colors", config.bg, config.darkBg)}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn("h-4 w-4 shrink-0", config.color)} />
                        <h3 className="font-semibold text-foreground">{task.titulo}</h3>
                      </div>
                      {task.descricao && (
                        <p className="mt-1 text-sm text-muted-foreground">{task.descricao}</p>
                      )}
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        {task.setor && (
                          <span className="rounded-full bg-card px-2 py-0.5 font-medium border border-border">
                            {task.setor}
                          </span>
                        )}
                        <span>Atribuído: {task.atribuido_profile?.nome ?? "N/A"}</span>
                        <span>
                          Prazo:{" "}
                          {new Date(task.prazo).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Status badge */}
                    <span className={cn("shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium", config.color, "bg-card border border-current/20")}>
                      {config.label}
                    </span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex flex-wrap items-center gap-2 border-t border-border/50 pt-3">
                    {/* Assistente submit */}
                    {(canSubmit || canResubmit) && (
                      <Dialog
                        open={showSubmitDialog === task.id}
                        onOpenChange={(open) => {
                          setShowSubmitDialog(open ? task.id : null)
                          if (!open) clearPhoto()
                        }}
                      >
                        <DialogTrigger asChild>
                          <Button size="sm" variant="default">
                            <Send className="mr-1.5 h-3.5 w-3.5" />
                            {canResubmit ? "Reenviar" : "Enviar"}
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>
                              {canResubmit ? "Reenviar Tarefa (Ressalva)" : "Enviar Tarefa"}
                            </DialogTitle>
                          </DialogHeader>
                          <form
                            action={(formData) => handleSubmitTask(task.id, formData)}
                            className="flex flex-col gap-4"
                          >
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="comentario">Comentário</Label>
                              <Textarea id="comentario" name="comentario" rows={3} placeholder="Descreva o que foi feito..." />
                            </div>

                            {/* Photo capture/upload */}
                            <div className="flex flex-col gap-2">
                              <Label>Foto da execução</Label>
                              {photoPreview ? (
                                <div className="relative">
                                  <img
                                    src={photoPreview}
                                    alt="Preview da foto"
                                    className="h-48 w-full rounded-lg border border-border object-cover"
                                  />
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="destructive"
                                    className="absolute right-2 top-2 h-7 w-7 p-0"
                                    onClick={clearPhoto}
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex gap-2">
                                  {/* Camera button (mobile) */}
                                  <input
                                    ref={cameraInputRef}
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={handlePhotoCapture}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => cameraInputRef.current?.click()}
                                  >
                                    <Camera className="mr-2 h-4 w-4" />
                                    Câmera
                                  </Button>

                                  {/* File upload button */}
                                  <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                                    className="hidden"
                                    onChange={handlePhotoCapture}
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => fileInputRef.current?.click()}
                                  >
                                    <Upload className="mr-2 h-4 w-4" />
                                    Galeria
                                  </Button>
                                </div>
                              )}
                            </div>

                            <Button type="submit" disabled={isPending || uploadingPhoto}>
                              {(isPending || uploadingPhoto) ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="mr-2 h-4 w-4" />
                              )}
                              {uploadingPhoto ? "Enviando foto..." : "Enviar"}
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
                    )}

                    {/* View details */}
                    {(task.status === "aguardando" || task.status === "concluida" || task.status === "ressalva") && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleOpenDetails(task.id)}
                      >
                        <Eye className="mr-1.5 h-3.5 w-3.5" />
                        Detalhes
                      </Button>
                    )}

                    {/* Lideranca validate */}
                    {isLideranca && task.status === "aguardando" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-blue-600 hover:bg-blue-50 bg-transparent dark:hover:bg-blue-950/50"
                        onClick={() => handleOpenValidate(task.id)}
                      >
                        <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                        Validar
                      </Button>
                    )}

                    {/* Lideranca delete */}
                    {isLideranca && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:bg-red-50 bg-transparent dark:hover:bg-red-950/50 ml-auto"
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

      {/* Details Dialog */}
      <Dialog
        open={showDetailsDialog !== null}
        onOpenChange={(open) => !open && setShowDetailsDialog(null)}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Submissão</DialogTitle>
          </DialogHeader>
          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nenhuma submissão encontrada.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions.map((sub) => (
                <div key={sub.id} className="rounded-lg border border-border bg-muted/30 p-4">
                  {sub.imagem_assistente && (
                    <img
                      src={sub.imagem_assistente}
                      alt="Foto da execução"
                      className="mb-3 h-48 w-full rounded-lg border border-border object-cover"
                    />
                  )}
                  {sub.comentario_assistente && (
                    <p className="text-sm text-foreground">{sub.comentario_assistente}</p>
                  )}
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span>
                      Status:{" "}
                      <span className={cn(
                        "font-medium",
                        sub.status_validacao === "aprovada" && "text-emerald-600",
                        sub.status_validacao === "devolvida" && "text-orange-600",
                        sub.status_validacao === "pendente" && "text-blue-600"
                      )}>
                        {sub.status_validacao === "aprovada" ? "Aprovada" : sub.status_validacao === "devolvida" ? "Devolvida" : "Pendente"}
                      </span>
                    </span>
                    <span>
                      Enviado em: {new Date(sub.criado_em).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {sub.feedback_lideranca && (
                    <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                      <p className="text-xs font-medium text-amber-800 dark:text-amber-300">Feedback da Liderança:</p>
                      <p className="mt-1 text-sm text-amber-700 dark:text-amber-400">{sub.feedback_lideranca}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Validate Dialog */}
      <Dialog
        open={showValidateDialog !== null}
        onOpenChange={(open) => {
          if (!open) {
            setShowValidateDialog(null)
            setValidateFeedback("")
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Validar Tarefa</DialogTitle>
          </DialogHeader>
          {loadingSubmissions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : submissions.length === 0 ? (
            <p className="py-4 text-sm text-muted-foreground">Nenhuma submissão pendente.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {submissions
                .filter((s) => s.status_validacao === "pendente")
                .map((sub) => (
                  <div key={sub.id} className="flex flex-col gap-4">
                    {sub.imagem_assistente && (
                      <img
                        src={sub.imagem_assistente}
                        alt="Foto da execucao"
                        className="h-56 w-full rounded-lg border border-border object-cover"
                      />
                    )}
                    {sub.comentario_assistente && (
                      <div className="rounded-md bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Comentário do Assistente:</p>
                        <p className="mt-1 text-sm text-foreground">{sub.comentario_assistente}</p>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="feedback">Feedback (opcional)</Label>
                      <Textarea
                        id="feedback"
                        value={validateFeedback}
                        onChange={(e) => setValidateFeedback(e.target.value)}
                        placeholder="Escreva seu feedback aqui..."
                        rows={3}
                      />
                    </div>
                    <DialogFooter className="flex gap-2 sm:gap-2">
                      <Button
                        variant="outline"
                        className="flex-1 border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-800 dark:hover:bg-orange-950/50"
                        onClick={() => handleValidate(sub.id, false)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <AlertTriangle className="mr-2 h-4 w-4" />
                        )}
                        Ressalva
                      </Button>
                      <Button
                        className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
                        onClick={() => handleValidate(sub.id, true)}
                        disabled={isPending}
                      >
                        {isPending ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                        )}
                        Aprovar
                      </Button>
                    </DialogFooter>
                  </div>
                ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
