"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift } from "@/lib/types"
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

const SETORES = [
  "Masculino", "Feminino", "Futebol", "Ilha", "Infantil",
  "Anfitriao", "Caixa", "OMS", "Provador",
]

interface EscalaContentProps {
  todaySchedule: TodaySchedule | null
  weekSchedule: WeekScheduleDay[]
  allSchedules: {
    userId: string
    nome: string
    matricula: string
    setor: string
    turno_nome: string
    tipo: "fixa" | "provisoria"
  }[]
  shifts: Shift[]
  profiles: Profile[]
  isLideranca: boolean
  currentProfile: Profile
}

export function EscalaContent({
  todaySchedule,
  weekSchedule,
  allSchedules,
  shifts,
  profiles,
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
              Voce nao tem escala configurada para hoje. Fale com a lideranca.
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
                    {SETORES.map((s) => (
                      <option key={s} value={s}>{s}</option>
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
        <div className="mt-4 grid grid-cols-7 gap-2">
          {weekSchedule.map((day) => {
            const isToday = day.dayIndex === dayOfWeek
            return (
              <div
                key={day.dayIndex}
                className={`flex flex-col items-center rounded-lg border p-3 text-center transition-colors ${
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

      {/* Lideranca: Full schedule view */}
      {isLideranca && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escala Geral de Hoje
          </h3>
          <div className="mt-4 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[500px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Funcionario</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Setor</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Turno</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tipo</th>
                </tr>
              </thead>
              <tbody className="bg-card">
                {allSchedules.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                      Nenhuma escala configurada para hoje
                    </td>
                  </tr>
                ) : (
                  allSchedules.map((s) => (
                    <tr key={`${s.userId}-${s.setor}`} className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30">
                      <td className="px-4 py-3">
                        <p className="font-medium text-foreground">{s.nome}</p>
                        <p className="text-xs text-muted-foreground">{s.matricula}</p>
                      </td>
                      <td className="px-4 py-3 text-foreground">{s.setor}</td>
                      <td className="px-4 py-3 text-foreground">{s.turno_nome}</td>
                      <td className="px-4 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          s.tipo === "fixa"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}>
                          {s.tipo === "fixa" ? "Fixa" : "Provisoria"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
