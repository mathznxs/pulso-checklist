"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift, Setor } from "@/lib/types"
import type {
  TodaySchedule,
  WeekScheduleDay,
  EscalaSetorGroup,
} from "@/lib/actions/schedule"
import { createEscalaEntry, deleteEscalaEntry } from "@/lib/actions/schedule"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MapPin,
  Clock,
  CalendarDays,
  Plus,
  Loader2,
  AlertTriangle,
  Trash2,
  Users,
} from "lucide-react"

interface EscalaContentProps {
  todaySchedule: TodaySchedule | null
  weekSchedule: WeekScheduleDay[]
  escalaHoje: EscalaSetorGroup[]
  shifts: Shift[]
  profiles: Profile[]
  setores: Setor[]
  isLideranca: boolean
  currentProfile: Profile
}

export function EscalaContent({
  todaySchedule,
  weekSchedule,
  escalaHoje,
  shifts,
  profiles,
  setores,
  isLideranca,
  currentProfile,
}: EscalaContentProps) {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  )
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [addSetorId, setAddSetorId] = useState("")
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const today = new Date()
  const dayOfWeek = today.getDay()

  function handleAddClick(setorId: string) {
    setAddSetorId(setorId)
    setError(null)
    setAddDialogOpen(true)
  }

  async function handleCreateEntry(formData: FormData) {
    startTransition(async () => {
      setError(null)
      const result = await createEscalaEntry({
        setorId: formData.get("setor_id") as string,
        turnoId: formData.get("turno_id") as string,
        funcionarioId: formData.get("funcionario_id") as string,
        tipo: "provisoria",
        data: formData.get("data") as string,
      })
      if (result.error) {
        setError(result.error)
      } else {
        setAddDialogOpen(false)
        router.refresh()
      }
    })
  }

  async function handleDeleteEntry(id: string) {
    startTransition(async () => {
      await deleteEscalaEntry(id)
      router.refresh()
    })
  }

  const activeProfiles = profiles.filter((p) => p.ativo)
  const selectedSetor = setores.find((s) => s.id === addSetorId)

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
                <h2 className="text-xl font-bold text-foreground">
                  {todaySchedule.setor}
                </h2>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">
                  {todaySchedule.turno_nome} (
                  {todaySchedule.turno_inicio.slice(0, 5)} -{" "}
                  {todaySchedule.turno_fim.slice(0, 5)})
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
              Voce nao tem uma escala configurada para hoje. Fale com a
              lideranca.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground">Escala</h1>
        <p className="text-sm text-muted-foreground">
          {isLideranca
            ? "Visualize e gerencie a escala por setor"
            : "Sua escala semanal"}
        </p>
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
                  <span
                    className={`text-xs font-bold ${isToday ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {day.dayLabel}
                  </span>
                  {day.setor ? (
                    <>
                      <span className="mt-1 text-sm font-semibold text-foreground">
                        {day.setor}
                      </span>
                      <span className="mt-0.5 text-[10px] text-muted-foreground">
                        {day.turno_nome}
                      </span>
                    </>
                  ) : (
                    <span className="mt-1 text-xs text-muted-foreground">
                      Folga
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Lideranca: Escala por Setor */}
      {isLideranca && (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Escala Geral
            </h3>
            <div className="flex items-center gap-2">
              <Label htmlFor="escala-date" className="sr-only">
                Data
              </Label>
              <Input
                id="escala-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>

          {/* Setor Cards Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {setores.map((setor) => {
              const grupo = escalaHoje.find((g) => g.setor.id === setor.id)
              return (
                <SetorCard
                  key={setor.id}
                  setor={setor}
                  turnos={grupo?.turnos ?? []}
                  isLideranca={isLideranca}
                  isPending={isPending}
                  onAdd={() => handleAddClick(setor.id)}
                  onDelete={handleDeleteEntry}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Add Entry Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Adicionar Turno{" "}
              {selectedSetor && (
                <span style={{ color: selectedSetor.cor }}>
                  - {selectedSetor.nome}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          <form action={handleCreateEntry} className="flex flex-col gap-4">
            <input type="hidden" name="setor_id" value={addSetorId} />
            <input type="hidden" name="data" value={selectedDate} />

            <div className="flex flex-col gap-2">
              <Label htmlFor="add-turno">Turno</Label>
              <select
                id="add-turno"
                name="turno_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
              >
                <option value="">Selecione</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome} ({s.hora_inicio.slice(0, 5)} -{" "}
                    {s.hora_fim.slice(0, 5)})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="add-func">Funcionario</Label>
              <select
                id="add-func"
                name="funcionario_id"
                required
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
              >
                <option value="">Selecione</option>
                {activeProfiles.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nome} ({p.matricula})
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            <p className="text-xs text-muted-foreground">
              Escala provisoria para {selectedDate}.
            </p>

            <Button type="submit" disabled={isPending}>
              {isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Adicionar
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ==========================================
// SetorCard component
// ==========================================

interface SetorCardProps {
  setor: Setor
  turnos: EscalaSetorGroup["turnos"]
  isLideranca: boolean
  isPending: boolean
  onAdd: () => void
  onDelete: (id: string) => void
}

function SetorCard({
  setor,
  turnos,
  isLideranca,
  isPending,
  onAdd,
  onDelete,
}: SetorCardProps) {
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Setor header with color */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: setor.cor + "22" }}
      >
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: setor.cor }}
          />
          <h4 className="text-sm font-bold text-foreground">{setor.nome}</h4>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">
            {turnos.length}
          </span>
        </div>
      </div>

      {/* Turno entries */}
      <div className="flex flex-1 flex-col">
        {turnos.length === 0 ? (
          <div className="flex flex-1 items-center justify-center px-4 py-6">
            <p className="text-xs text-muted-foreground">Sem escala</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {turnos.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between px-4 py-2.5"
              >
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">
                    {entry.funcionario.nome}
                  </span>
                  <span className="text-[11px] text-muted-foreground">
                    {entry.turno.nome} ({entry.turno.hora_inicio.slice(0, 5)} -{" "}
                    {entry.turno.hora_fim.slice(0, 5)})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {entry.tipo === "provisoria" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                      Prov.
                    </span>
                  )}
                  {isLideranca && (
                    <button
                      type="button"
                      onClick={() => onDelete(entry.id)}
                      disabled={isPending}
                      className="rounded p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remover ${entry.funcionario.nome}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add button */}
      {isLideranca && (
        <div className="border-t border-border p-2">
          <button
            type="button"
            onClick={onAdd}
            className="flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
            Adicionar Turno
          </button>
        </div>
      )}
    </div>
  )
}
