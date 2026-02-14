"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift, Setor } from "@/lib/types"
import type { TodaySchedule, WeekScheduleDay } from "@/lib/actions/schedule"
import { createTemporarySchedule } from "@/lib/actions/schedule"
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
import { MapPin, Clock, CalendarDays, Plus, Loader2, AlertTriangle } from "lucide-react"

interface EscalaContentProps {
  todaySchedule: TodaySchedule | null
  weekSchedule: WeekScheduleDay[]
  allSchedules: {
    userId: string
    nome: string
    matricula: string
    setor: string
    turno_nome: string
    turno_inicio?: string
    turno_fim?: string
    tipo: "fixa" | "provisória"
  }[]
  shifts: Shift[]
  profiles: Profile[]
  setores: Setor[]
  isLideranca: boolean
  currentProfile: Profile
}

export function EscalaContent({
  todaySchedule,
  weekSchedule,
  allSchedules,
  shifts,
  profiles,
  setores,
  isLideranca,
  currentProfile,
}: EscalaContentProps) {
  const [showTempDialog, setShowTempDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const today = new Date()
  const dayOfWeek = today.getDay()

  async function handleCreateTemp(formData: FormData) {
    startTransition(async () => {
      await createTemporarySchedule(formData)
      setShowTempDialog(false)
      router.refresh()
    })
  }

  // Group allSchedules by setor for the sector-based view
  const schedulesBySetor = new Map<string, typeof allSchedules>()
  for (const s of allSchedules) {
    if (!schedulesBySetor.has(s.setor)) {
      schedulesBySetor.set(s.setor, [])
    }
    schedulesBySetor.get(s.setor)!.push(s)
  }

  // Sort each sector's schedules by turno_inicio
  for (const [, items] of schedulesBySetor) {
    items.sort((a, b) => (a.turno_inicio ?? "").localeCompare(b.turno_inicio ?? ""))
  }

  // Build a color map from setores
  const corMap = new Map<string, string>()
  for (const setor of setores) {
    corMap.set(setor.nome, setor.cor)
  }

  function getSetorStyle(setorNome: string) {
    const cor = corMap.get(setorNome)
    if (!cor) return {}
    return {
      backgroundColor: cor + "22",
      borderColor: cor + "66",
    }
  }

  function getSetorBadgeStyle(setorNome: string) {
    const cor = corMap.get(setorNome)
    if (!cor) return {}
    return {
      backgroundColor: cor,
      color: "#1a1a1a",
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Banner - Seu setor hoje */}
      {todaySchedule ? (
        <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
                <MapPin className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Seu setor hoje
                </p>
                <h2 className="text-xl font-bold text-foreground">{todaySchedule.setor}</h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {todaySchedule.turno_nome} ({todaySchedule.turno_inicio.slice(0, 5)} - {todaySchedule.turno_fim.slice(0, 5)})
                </span>
              </div>
              {todaySchedule.tipo === "provisoria" && (
                <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                  Provisoria
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              Voce nao tem uma escala configurada para hoje. Fale com a lideranca.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Escala</h1>
          <p className="text-sm text-muted-foreground">
            {isLideranca
              ? "Visualize a escala geral e crie alteracoes provisorias"
              : "Sua escala semanal"}
          </p>
        </div>
        {isLideranca && (
          <Dialog open={showTempDialog} onOpenChange={setShowTempDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Escala Provisoria
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Escala Provisoria</DialogTitle>
              </DialogHeader>
              <form action={handleCreateTemp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tp-user">Funcionario</Label>
                  <select
                    id="tp-user"
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
                  <Label htmlFor="tp-setor">Setor</Label>
                  <select
                    id="tp-setor"
                    name="setor"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione</option>
                    {setores.map((s) => (
                      <option key={s.id} value={s.nome}>{s.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tp-data">Data</Label>
                  <Input
                    id="tp-data"
                    name="data"
                    type="date"
                    required
                    defaultValue={today.toISOString().split("T")[0]}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tp-turno">Turno</Label>
                  <select
                    id="tp-turno"
                    name="turno_id"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                  >
                    <option value="">Selecione</option>
                    {shifts.map((s) => (
                      <option key={s.id} value={s.id}>{s.nome} ({s.hora_inicio.slice(0, 5)} - {s.hora_fim.slice(0, 5)})</option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  A escala provisoria nao afeta a escala fixa e se aplica apenas ao dia selecionado.
                </p>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Personal Week Schedule */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Minha Semana
          </h3>
        </div>
        <div className="-mx-5 mt-4 overflow-x-auto px-5 sm:mx-0 sm:px-0">
          <div className="flex gap-2 sm:grid sm:grid-cols-7">
            {weekSchedule.map((day) => {
              const isToday = day.dayIndex === dayOfWeek
              return (
                <div
                  key={day.dayIndex}
                  className={`flex min-w-[80px] flex-col items-center rounded-lg border p-3 text-center transition-colors sm:min-w-0 ${
                    isToday
                      ? "border-primary bg-primary/5"
                      : day.setor
                        ? "border-border bg-card"
                        : "border-border bg-muted/30"
                  }`}
                >
                  <span className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}>
                    {day.dayLabel}
                  </span>
                  {day.setor ? (
                    <>
                      <span className="mt-1 text-sm font-semibold text-foreground">{day.setor}</span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {day.turno_nome}
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground">Folga</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lideranca: Sector-based schedule view */}
      {isLideranca && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escala Geral de Hoje - Por Setor
          </h3>

          {allSchedules.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-12 text-center">
              <p className="text-muted-foreground">
                Nenhuma escala configurada para hoje
              </p>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {setores
                .filter((setor) => schedulesBySetor.has(setor.nome))
                .map((setor) => {
                  const items = schedulesBySetor.get(setor.nome) ?? []
                  return (
                    <div
                      key={setor.id}
                      className="rounded-xl border-2 p-4 transition-colors"
                      style={getSetorStyle(setor.nome)}
                    >
                      {/* Sector header */}
                      <div className="flex items-center gap-2">
                        <span
                          className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                          style={getSetorBadgeStyle(setor.nome)}
                        >
                          {setor.nome}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {items.length} {items.length === 1 ? "turno" : "turnos"}
                        </span>
                      </div>

                      {/* Turnos within sector */}
                      <div className="mt-3 flex flex-col gap-2">
                        {items.map((item) => (
                          <div
                            key={`${item.userId}-${item.turno_nome}`}
                            className="flex items-center justify-between rounded-lg border border-border/50 bg-card/80 px-3 py-2"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="truncate text-sm font-medium text-foreground">
                                {item.nome}
                              </p>
                              <p className="text-xs text-muted-foreground">{item.matricula}</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{item.turno_nome}</span>
                                {item.turno_inicio && item.turno_fim && (
                                  <span className="text-[10px]">
                                    ({item.turno_inicio.slice(0, 5)}-{item.turno_fim.slice(0, 5)})
                                  </span>
                                )}
                              </div>
                              {item.tipo === "provisória" && (
                                <span className="rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                  Prov.
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
