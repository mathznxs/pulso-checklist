"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Challenge, ChallengeScore, Profile } from "@/lib/types"
import {
  createChallenge,
  incrementScore,
  setScore,
  toggleChallengeActive,
} from "@/lib/actions/challenges"
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
} from "@/components/ui/dialog"
import {
  Trophy,
  Medal,
  Award,
  Star,
  Plus,
  Minus,
  Loader2,
  TrendingUp,
  Lock,
  Calendar,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface GincanasContentProps {
  challenges: Challenge[]
  scores: ChallengeScore[]
  profiles: Profile[]
  isLideranca: boolean
}

function PodiumCard({
  score,
  position,
}: {
  score: ChallengeScore
  position: 1 | 2 | 3
}) {
  const positionConfig = {
    1: { height: "h-32", bg: "bg-amber-50 border-amber-300 dark:bg-amber-950/30 dark:border-amber-700", icon: Trophy, iconColor: "text-amber-500", label: "1o" },
    2: { height: "h-24", bg: "bg-muted border-border", icon: Medal, iconColor: "text-muted-foreground", label: "2o" },
    3: { height: "h-20", bg: "bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-800", icon: Award, iconColor: "text-amber-700 dark:text-amber-400", label: "3o" },
  }
  const config = positionConfig[position]
  const IconComp = config.icon

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-1">
        <div className={cn("flex h-12 w-12 items-center justify-center rounded-full border-2", config.bg)}>
          <IconComp className={cn("h-6 w-6", config.iconColor)} />
        </div>
        <p className="text-sm font-bold text-foreground text-center">{score.profile?.nome ?? "N/A"}</p>
        <p className="text-xs text-muted-foreground">{score.profile?.setor_base ?? ""}</p>
        <p className="text-lg font-bold text-foreground">{score.pontos} pts</p>
      </div>
      <div className={cn("mt-2 flex w-20 items-end justify-center rounded-t-lg border-x border-t sm:w-24", config.bg, config.height)}>
        <span className="pb-2 text-2xl font-black text-foreground/30">{config.label}</span>
      </div>
    </div>
  )
}

export function GincanasContent({ challenges, scores, profiles, isLideranca }: GincanasContentProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showAddScore, setShowAddScore] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [editScoreValue, setEditScoreValue] = useState("")
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const activeChallenge = challenges[0]

  const isEncerrada = (() => {
    if (!activeChallenge?.data_fim) return false
    const endDate = new Date(activeChallenge.data_fim)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    return endDate < today
  })()

  const top3 = scores.slice(0, 3)

  function formatDate(dateStr: string | null) {
    if (!dateStr) return null
    return new Date(dateStr + "T00:00:00").toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
  }

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createChallenge(formData)
      setShowCreate(false)
      router.refresh()
    })
  }

  async function handleAddScore(formData: FormData) {
    if (!activeChallenge) return
    const userId = formData.get("user_id") as string
    const amount = Number(formData.get("amount"))
    startTransition(async () => {
      await incrementScore(activeChallenge.id, userId, amount)
      setShowAddScore(false)
      router.refresh()
    })
  }

  async function handleIncrement(userId: string, amount: number) {
    if (!activeChallenge || isEncerrada) return
    startTransition(async () => {
      await incrementScore(activeChallenge.id, userId, amount)
      router.refresh()
    })
  }

  async function handleSetScore(userId: string) {
    if (!activeChallenge) return
    const pontos = Number(editScoreValue)
    if (isNaN(pontos) || pontos < 0) return
    startTransition(async () => {
      await setScore(activeChallenge.id, userId, pontos)
      setEditingScoreId(null)
      setEditScoreValue("")
      router.refresh()
    })
  }

  async function handleToggleActive() {
    if (!activeChallenge) return
    startTransition(async () => {
      await toggleChallengeActive(activeChallenge.id, !activeChallenge.ativa)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gincanas</h1>
          {activeChallenge ? (
            <div className="mt-1 flex flex-col gap-1">
              <p className="text-sm text-muted-foreground">
                {"Ranking individual - "}{activeChallenge.nome}
              </p>
              {activeChallenge.descricao && (
                <p className="text-xs text-muted-foreground">{activeChallenge.descricao}</p>
              )}
              {(activeChallenge.data_inicio || activeChallenge.data_fim) && (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3" />
                  <span>
                    {formatDate(activeChallenge.data_inicio) ?? "..."}{" - "}{formatDate(activeChallenge.data_fim) ?? "..."}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma gincana ativa</p>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {activeChallenge && (
            <div className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2",
              isEncerrada
                ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/30"
                : "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30"
            )}>
              {isEncerrada ? (
                <>
                  <Lock className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-semibold text-red-700 dark:text-red-400">Encerrada</span>
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-semibold text-amber-700 dark:text-amber-400">Ativa</span>
                </>
              )}
            </div>
          )}
          {isLideranca && (
            <>
              <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-1.5 h-3.5 w-3.5" />
                    Nova Gincana
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Criar Gincana</DialogTitle>
                  </DialogHeader>
                  <form action={handleCreate} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="nome">Nome</Label>
                      <Input id="nome" name="nome" required placeholder="Gincana Fevereiro 2026" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="descricao">Descricao</Label>
                      <Textarea id="descricao" name="descricao" rows={2} placeholder="Regras e objetivos da gincana..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="data_inicio">Data Inicio</Label>
                        <Input id="data_inicio" name="data_inicio" type="date" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="data_fim">Data Fim</Label>
                        <Input id="data_fim" name="data_fim" type="date" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Criar
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
              {activeChallenge && !isEncerrada && (
                <Dialog open={showAddScore} onOpenChange={setShowAddScore}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Adicionar Pontos
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Adicionar Pontos</DialogTitle>
                    </DialogHeader>
                    <form action={handleAddScore} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="user_id">Funcionario</Label>
                        <select
                          id="user_id"
                          name="user_id"
                          required
                          className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
                        >
                          <option value="">Selecione</option>
                          {profiles.filter((p) => p.ativo).map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({p.matricula})
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="amount">Pontos a adicionar</Label>
                        <Input id="amount" name="amount" type="number" required min="1" defaultValue="1" />
                      </div>
                      <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Adicionar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
              {activeChallenge && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleToggleActive}
                  disabled={isPending}
                >
                  {activeChallenge.ativa ? "Desativar" : "Ativar"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Podio</h3>
          <div className="mt-6 flex items-end justify-center gap-4 sm:gap-6">
            {top3[1] && <PodiumCard score={top3[1]} position={2} />}
            {top3[0] && <PodiumCard score={top3[0]} position={1} />}
            {top3[2] && <PodiumCard score={top3[2]} position={3} />}
          </div>
        </div>
      )}

      {/* Full Ranking */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranking Completo</h3>

        {/* Desktop table */}
        <div className="mt-4 hidden overflow-x-auto rounded-lg border border-border sm:block">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pontuacao</th>
                {isLideranca && !isEncerrada && (
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Acoes</th>
                )}
              </tr>
            </thead>
            <tbody className="bg-card">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={isLideranca && !isEncerrada ? 5 : 4} className="px-4 py-8 text-center text-muted-foreground">
                    {activeChallenge ? "Nenhuma pontuacao registrada ainda" : "Crie uma gincana para comecar"}
                  </td>
                </tr>
              ) : (
                scores.map((s, idx) => (
                  <tr key={s.id} className={cn("border-b border-border transition-colors last:border-b-0 hover:bg-muted/30", idx < 3 && "bg-amber-50/30 dark:bg-amber-950/10")}>
                    <td className="px-4 py-3">
                      <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                        idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" :
                        idx === 1 ? "bg-muted text-muted-foreground" :
                        idx === 2 ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500" :
                        "text-foreground"
                      )}>{idx + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{s.profile?.nome ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{s.profile?.matricula}</p>
                    </td>
                    <td className="px-4 py-3 text-foreground">{s.profile?.setor_base ?? ""}</td>
                    <td className="px-4 py-3">
                      {editingScoreId === s.id ? (
                        <form
                          className="flex items-center gap-2"
                          onSubmit={(e) => {
                            e.preventDefault()
                            if (s.profile) handleSetScore(s.profile.id)
                          }}
                        >
                          <Input
                            type="number"
                            value={editScoreValue}
                            onChange={(e) => setEditScoreValue(e.target.value)}
                            className="h-8 w-20"
                            min="0"
                            autoFocus
                          />
                          <Button size="sm" type="submit" disabled={isPending} className="h-8 px-2">
                            OK
                          </Button>
                          <Button size="sm" type="button" variant="ghost" className="h-8 px-2" onClick={() => setEditingScoreId(null)}>
                            X
                          </Button>
                        </form>
                      ) : (
                        <button
                          type="button"
                          className={cn("font-bold text-foreground", isLideranca && !isEncerrada && "cursor-pointer hover:underline")}
                          onClick={() => {
                            if (isLideranca && !isEncerrada) {
                              setEditingScoreId(s.id)
                              setEditScoreValue(String(s.pontos))
                            }
                          }}
                          disabled={!isLideranca || isEncerrada}
                        >
                          {s.pontos} pts
                        </button>
                      )}
                    </td>
                    {isLideranca && !isEncerrada && (
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => s.profile && handleIncrement(s.profile.id, -1)}
                            disabled={isPending || s.pontos <= 0}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={() => s.profile && handleIncrement(s.profile.id, 1)}
                            disabled={isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-4 flex flex-col gap-2 sm:hidden">
          {scores.length === 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-8 text-center text-sm text-muted-foreground">
              {activeChallenge ? "Nenhuma pontuacao registrada ainda" : "Crie uma gincana para comecar"}
            </div>
          ) : (
            scores.map((s, idx) => (
              <div key={s.id} className={cn("rounded-lg border border-border bg-card p-4", idx < 3 && "bg-amber-50/30 border-amber-200 dark:bg-amber-950/10 dark:border-amber-800")}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className={cn("inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold",
                      idx === 0 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400" :
                      idx === 1 ? "bg-muted text-muted-foreground" :
                      idx === 2 ? "bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-500" :
                      "text-foreground"
                    )}>{idx + 1}</span>
                    <div>
                      <p className="font-medium text-foreground">{s.profile?.nome ?? "N/A"}</p>
                      <p className="text-xs text-muted-foreground">{s.profile?.setor_base ?? ""}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-foreground">{s.pontos} pts</span>
                    {isLideranca && !isEncerrada && (
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => s.profile && handleIncrement(s.profile.id, -1)}
                          disabled={isPending || s.pontos <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 w-7 p-0"
                          onClick={() => s.profile && handleIncrement(s.profile.id, 1)}
                          disabled={isPending}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
