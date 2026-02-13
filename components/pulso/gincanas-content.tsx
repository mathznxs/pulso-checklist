"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Challenge, ChallengeScore, Profile } from "@/lib/types"
import {
  createChallenge,
  incrementScore,
  decrementScore,
  setScore,
} from "@/lib/actions/challenges"
import { isChallengeEditable } from "@/lib/utils/challenges.utils"
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
import { Trophy, Medal, Award, Star, Plus, Loader2, TrendingUp, Minus } from "lucide-react"

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
    1: { height: "h-32", bg: "bg-amber-50 border-amber-300", icon: Trophy, iconColor: "text-amber-500", label: "1o" },
    2: { height: "h-24", bg: "bg-muted border-border", icon: Medal, iconColor: "text-muted-foreground", label: "2o" },
    3: { height: "h-20", bg: "bg-amber-50/50 border-amber-200", icon: Award, iconColor: "text-amber-700", label: "3o" },
  }
  const config = positionConfig[position]
  const IconComp = config.icon

  return (
    <div className="flex flex-col items-center">
      <div className="flex flex-col items-center gap-1">
        <div className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${config.bg}`}>
          <IconComp className={`h-6 w-6 ${config.iconColor}`} />
        </div>
        <p className="text-sm font-bold text-foreground">{score.profile?.nome ?? "N/A"}</p>
        <p className="text-xs text-muted-foreground">{score.profile?.setor_base ?? ""}</p>
        <p className="text-lg font-bold text-foreground">{score.pontos} pts</p>
      </div>
      <div className={`mt-2 flex w-24 items-end justify-center rounded-t-lg border-x border-t ${config.bg} ${config.height}`}>
        <span className="pb-2 text-2xl font-black text-foreground/30">{config.label}</span>
      </div>
    </div>
  )
}

export function GincanasContent({ challenges, scores, profiles, isLideranca }: GincanasContentProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [showAddScore, setShowAddScore] = useState(false)
  const [editingScoreId, setEditingScoreId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const activeChallenge = challenges[0]
  const top3 = scores.slice(0, 3)
  const editable = activeChallenge ? isChallengeEditable(activeChallenge) : false

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
    const pontos = Number(formData.get("pontos"))
    startTransition(async () => {
      await setScore(activeChallenge.id, userId, pontos)
      setShowAddScore(false)
      router.refresh()
    })
  }

  async function handleIncrement(profileId: string) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await incrementScore(activeChallenge.id, profileId)
      router.refresh()
    })
  }

  async function handleDecrement(profileId: string) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await decrementScore(activeChallenge.id, profileId)
      router.refresh()
    })
  }

  async function handleSetScore(profileId: string, value: number) {
    if (!activeChallenge || !editable) return
    startTransition(async () => {
      await setScore(activeChallenge.id, profileId, value)
      setEditingScoreId(null)
      router.refresh()
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Gincanas</h1>
          <p className="text-sm text-muted-foreground">
            {activeChallenge
              ? `Ranking individual - ${activeChallenge.nome}`
              : "Nenhuma gincana ativa"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeChallenge && (
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
                <Star className="inline h-4 w-4 text-amber-500" />
                <span className="ml-1.5 text-sm font-semibold text-amber-700">Gincana Ativa</span>
              </div>
              {activeChallenge.data_fim && !editable && (
                <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                  Encerrada em {new Date(activeChallenge.data_fim).toLocaleDateString("pt-BR")}
                </span>
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
                      <Label htmlFor="descricao">Descrição (opcional)</Label>
                      <Input id="descricao" name="descricao" placeholder="Objetivo da gincana" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="data_inicio">Data início</Label>
                        <Input id="data_inicio" name="data_inicio" type="date" />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label htmlFor="data_fim">Data fim</Label>
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
              {activeChallenge && (
                <Dialog open={showAddScore} onOpenChange={setShowAddScore}>
                  <DialogTrigger asChild>
                    <Button size="sm" disabled={!editable}>
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
                        <Label htmlFor="user_id">Funcionário</Label>
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
                        <Label htmlFor="pontos">Pontos</Label>
                        <Input id="pontos" name="pontos" type="number" required min="0" />
                      </div>
                      <Button type="submit" disabled={isPending}>
                        {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </>
          )}
        </div>
      </div>

      {/* Podium */}
      {top3.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-6">
          <h3 className="text-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">Podio</h3>
          <div className="mt-6 flex items-end justify-center gap-6">
            {top3[1] && <PodiumCard score={top3[1]} position={2} />}
            {top3[0] && <PodiumCard score={top3[0]} position={1} />}
            {top3[2] && <PodiumCard score={top3[2]} position={3} />}
          </div>
        </div>
      )}

      {/* Full Ranking */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Ranking Completo</h3>
        <div className="mt-4 overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[500px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">#</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionário</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pontuação</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tendência</th>
              </tr>
            </thead>
            <tbody className="bg-card">
              {scores.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    {activeChallenge ? "Nenhuma pontuação registrada ainda" : "Crie uma gincana para começar"}
                  </td>
                </tr>
              ) : (
                scores.map((s, idx) => {
                  const isEditing = editingScoreId === s.user_id
                  return (
                    <tr key={s.id} className={`border-b border-border transition-colors last:border-b-0 hover:bg-muted/30 ${idx < 3 ? "bg-amber-50/30" : ""}`}>
                      <td className="px-4 py-3">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                          idx === 0 ? "bg-amber-100 text-amber-700" : idx === 1 ? "bg-muted text-muted-foreground" : idx === 2 ? "bg-amber-50 text-amber-600" : "text-foreground"
                        }`}>{idx + 1}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.profile?.nome ?? "N/A"}</p>
                        <p className="text-xs text-muted-foreground">{s.profile?.matricula}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.profile?.setor_base ?? ""}</td>
                      <td className="px-4 py-3">
                        {isLideranca && editable ? (
                          isEditing ? (
                            <form
                              className="flex items-center gap-1"
                              onSubmit={(e) => {
                                e.preventDefault()
                                const input = e.currentTarget.querySelector<HTMLInputElement>("input[name=pontos]")
                                if (input) {
                                  startTransition(async () => {
                                    await handleSetScore(s.user_id, Number(input.value))
                                  })
                                }
                              }}
                            >
                              <Input
                                name="pontos"
                                type="number"
                                min={0}
                                defaultValue={s.pontos}
                                className="h-8 w-20"
                              />
                              <Button type="submit" size="sm" disabled={isPending}>Ok</Button>
                              <Button type="button" size="sm" variant="ghost" onClick={() => setEditingScoreId(null)}>Cancelar</Button>
                            </form>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleDecrement(s.user_id)}
                                disabled={isPending || s.pontos <= 0}
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                              <span className="min-w-[2rem] text-center font-bold text-foreground">{s.pontos} pts</span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 shrink-0"
                                onClick={() => handleIncrement(s.user_id)}
                                disabled={isPending}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="text-xs"
                                onClick={() => setEditingScoreId(s.user_id)}
                              >
                                Editar
                              </Button>
                            </div>
                          )
                        ) : (
                          <span className="font-bold text-foreground">{s.pontos} pts</span>
                        )}
                      </td>
                      <td className="px-4 py-3"><TrendingUp className="h-4 w-4 text-emerald-500" /></td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
