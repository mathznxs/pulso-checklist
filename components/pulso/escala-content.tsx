"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { Profile, Shift, Setor, EscalaEntry } from "@/lib/types"
import type { TodaySchedule } from "@/lib/actions/schedule"
import { createEscalaEntry, deleteEscalaEntry } from "@/lib/actions/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { MapPin, Clock, Plus, Loader2, AlertTriangle, Trash2, CalendarDays } from "lucide-react"

interface EscalaContentProps {
  todaySchedule: TodaySchedule | null
  todayEntries: EscalaEntry[]
  setores: Setor[]
  shifts: Shift[]
  profiles: Profile[]
  isGerente: boolean
  currentProfile: Profile
}

export function EscalaContent({
  todaySchedule,
  todayEntries,
  setores,
  shifts,
  profiles,
  isGerente,
  currentProfile,
}: EscalaContentProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0])
  const [addingToSetor, setAddingToSetor] = useState<Setor | null>(null)
  const [selectedTurno, setSelectedTurno] = useState("")
  const [selectedFuncionario, setSelectedFuncionario] = useState("")
  const [selectedTipo, setSelectedTipo] = useState<"fixa" | "provisoria">("fixa")
  const [isPending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | null>(null)
  const router = useRouter()

  // Group entries by setor
  const entriesBySetor = new Map<string, EscalaEntry[]>()
  for (const entry of todayEntries) {
    const setorId = entry.setor_id
    const existing = entriesBySetor.get(setorId) ?? []
    existing.push(entry)
    entriesBySetor.set(setorId, existing)
  }

  // Sort entries within each setor by shift hora_inicio
  for (const [, entries] of entriesBySetor) {
    entries.sort((a, b) => {
      const aStart = a.shift?.hora_inicio ?? ""
      const bStart = b.shift?.hora_inicio ?? ""
      return aStart.localeCompare(bStart)
    })
  }

  async function handleAddEntry() {
    if (!addingToSetor || !selectedTurno || !selectedFuncionario) return
    setFormError(null)

    startTransition(async () => {
      const result = await createEscalaEntry(
        addingToSetor.id,
        selectedTurno,
        selectedFuncionario,
        selectedDate,
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

  async function handleDeleteEntry(entryId: string) {
    startTransition(async () => {
      await deleteEscalaEntry(entryId)
      router.refresh()
    })
  }

  const activeProfiles = profiles.filter((p) => p.ativo)

  return (
    <div className="flex flex-col gap-6">
      {/* Banner - Seu setor hoje */}
      {todaySchedule ? (
        <div
          className="rounded-xl border-2 p-5"
          style={{
            borderColor: `${todaySchedule.setor_cor}66`,
            backgroundColor: `${todaySchedule.setor_cor}12`,
          }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ backgroundColor: todaySchedule.setor_cor }}
              >
                <MapPin className="h-6 w-6 text-foreground" />
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
              Voce nao tem uma escala configurada para hoje. Fale com a gerencia.
            </p>
          </div>
        </div>
      )}

      {/* Header + Date Picker */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Escala</h1>
          <p className="text-sm text-muted-foreground">
            {isGerente
              ? "Visualize e gerencie a escala por setor"
              : "Escala geral do dia"}
          </p>
        </div>
        {isGerente && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto"
              />
            </div>
          </div>
        )}
      </div>

      {/* Sector Cards Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {setores.map((setor) => {
          const entries = entriesBySetor.get(setor.id) ?? []
          return (
            <div
              key={setor.id}
              className="rounded-xl border-2 bg-card"
              style={{ borderColor: `${setor.cor}55` }}
            >
              {/* Sector Header */}
              <div
                className="flex items-center justify-between rounded-t-[10px] px-4 py-3"
                style={{ backgroundColor: `${setor.cor}25` }}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: setor.cor }}
                  />
                  <h3 className="text-sm font-bold text-foreground">{setor.nome}</h3>
                </div>
                {isGerente && (
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
                )}
              </div>

              {/* Entries */}
              <div className="flex flex-col gap-0 divide-y divide-border">
                {entries.length === 0 ? (
                  <div className="px-4 py-6 text-center">
                    <p className="text-xs text-muted-foreground">
                      Nenhum turno escalado
                    </p>
                  </div>
                ) : (
                  entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between px-4 py-3"
                    >
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
                      {isGerente && (
                        <button
                          type="button"
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={isPending}
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          aria-label="Remover entrada"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
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
            <DialogTitle>
              Adicionar Turno - {addingToSetor?.nome}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Data</Label>
              <Input type="date" value={selectedDate} disabled className="bg-muted" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="add-turno">Turno</Label>
              <select
                id="add-turno"
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
              <Label htmlFor="add-func">Funcionario</Label>
              <select
                id="add-func"
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
              <Label htmlFor="add-tipo">Tipo</Label>
              <select
                id="add-tipo"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value as "fixa" | "provisoria")}
                className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
              >
                <option value="fixa">Fixa</option>
                <option value="provisoria">Provisoria</option>
              </select>
            </div>
            {formError && (
              <p className="text-sm text-destructive">{formError}</p>
            )}
            <Button
              onClick={handleAddEntry}
              disabled={isPending || !selectedTurno || !selectedFuncionario}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
