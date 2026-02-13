"use client"

import { useState, useTransition, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { CalendarEvent, Profile } from "@/lib/types"
import { createCalendarEvent, deleteCalendarEvent, getCalendarEvents } from "@/lib/actions/calendar"
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
import { ChevronLeft, ChevronRight, Plus, Loader2, Trash2 } from "lucide-react"

const eventTypeConfig: Record<
  string,
  { label: string; dotClass: string; bgClass: string }
> = {
  evento: { label: "Evento", dotClass: "bg-blue-500", bgClass: "bg-blue-50 text-blue-700" },
  visita: { label: "Visita", dotClass: "bg-amber-500", bgClass: "bg-amber-50 text-amber-700" },
  lancamento: { label: "Lancamento", dotClass: "bg-emerald-500", bgClass: "bg-emerald-50 text-emerald-700" },
  folga: { label: "Folga", dotClass: "bg-muted-foreground", bgClass: "bg-muted text-muted-foreground" },
  critico: { label: "Data Critica", dotClass: "bg-red-500", bgClass: "bg-red-50 text-red-700" },
}

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
]

interface CalendarioContentProps {
  events: CalendarEvent[]
  isLideranca: boolean
  currentProfile: Profile | null
}

export function CalendarioContent({ events: initialEvents, isLideranca }: CalendarioContentProps) {
  const now = new Date()
  const [currentMonth, setCurrentMonth] = useState(now.getMonth())
  const [currentYear, setCurrentYear] = useState(now.getFullYear())
  const [events, setEvents] = useState<CalendarEvent[]>(initialEvents)
  const [showCreate, setShowCreate] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDay = new Date(currentYear, currentMonth, 1).getDay()

  const fetchEvents = useCallback(async (month: number, year: number) => {
    const data = await getCalendarEvents(month + 1, year)
    setEvents(data)
  }, [])

  const prevMonth = () => {
    const newMonth = currentMonth === 0 ? 11 : currentMonth - 1
    const newYear = currentMonth === 0 ? currentYear - 1 : currentYear
    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    fetchEvents(newMonth, newYear)
  }

  const nextMonth = () => {
    const newMonth = currentMonth === 11 ? 0 : currentMonth + 1
    const newYear = currentMonth === 11 ? currentYear + 1 : currentYear
    setCurrentMonth(newMonth)
    setCurrentYear(newYear)
    fetchEvents(newMonth, newYear)
  }

  const getEventsForDay = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    return events.filter((e) => e.data_inicio === dateStr)
  }

  const isToday = (day: number) =>
    day === now.getDate() &&
    currentMonth === now.getMonth() &&
    currentYear === now.getFullYear()

  async function handleCreate(formData: FormData) {
    startTransition(async () => {
      await createCalendarEvent(formData)
      setShowCreate(false)
      await fetchEvents(currentMonth, currentYear)
      router.refresh()
    })
  }

  async function handleDelete(eventId: string) {
    startTransition(async () => {
      await deleteCalendarEvent(eventId)
      await fetchEvents(currentMonth, currentYear)
      router.refresh()
    })
  }

  const sortedEvents = [...events].sort((a, b) =>
    a.data_inicio.localeCompare(b.data_inicio)
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Calendário Operacional</h1>
          <p className="text-sm text-muted-foreground">
            Eventos, visitas, lançamentos e datas importantes
          </p>
        </div>
        {isLideranca && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Evento</DialogTitle>
              </DialogHeader>
              <form action={handleCreate} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="titulo">Título</Label>
                  <Input id="titulo" name="titulo" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tipo">Tipo</Label>
                  <select
                    id="tipo"
                    name="tipo"
                    required
                    className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground"
                  >
                    {Object.entries(eventTypeConfig).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="data_inicio">Data</Label>
                  <Input id="data_inicio" name="data_inicio" type="date" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="data_fim">Data Fim (opcional)</Label>
                  <Input id="data_fim" name="data_fim" type="date" />
                </div>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Evento
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Calendar Grid */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-foreground sm:text-lg">
              {MONTHS[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-1">
              <button type="button" onClick={prevMonth} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button type="button" onClick={nextMonth} className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-7 gap-px">
            {DAYS.map((day) => (
              <div key={day} className="py-1.5 text-center text-[10px] font-semibold uppercase text-muted-foreground sm:py-2 sm:text-xs">{day}</div>
            ))}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square p-0.5 sm:aspect-auto sm:min-h-[80px] sm:p-1" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const dayEvents = getEventsForDay(day)
              return (
                <div
                  key={day}
                  className={`aspect-square rounded-md border p-0.5 transition-colors sm:aspect-auto sm:min-h-[80px] sm:p-1.5 ${
                    isToday(day) ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/50"
                  }`}
                >
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-medium sm:h-6 sm:w-6 sm:text-xs ${
                    isToday(day) ? "bg-primary text-primary-foreground" : "text-foreground"
                  }`}>{day}</span>
                  <div className="mt-0.5 flex flex-col items-start gap-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event.id} className={`block h-1.5 w-1.5 rounded-full sm:hidden ${eventTypeConfig[event.tipo]?.dotClass ?? "bg-muted-foreground"}`} />
                    ))}
                    {dayEvents.slice(0, 2).map((event) => (
                      <span key={event.id} className={`hidden w-full truncate rounded px-1 py-0.5 text-[10px] font-medium sm:block ${eventTypeConfig[event.tipo]?.bgClass ?? "bg-muted"}`}>
                        {event.titulo}
                      </span>
                    ))}
                    {dayEvents.length > 2 && (
                      <span className="text-[9px] text-muted-foreground sm:text-[10px]">+{dayEvents.length - 2}</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Próximos Eventos
          </h3>
          <div className="mt-4 flex flex-col gap-3">
            {sortedEvents.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum evento neste mês
              </p>
            ) : (
              sortedEvents.map((event) => {
                const config = eventTypeConfig[event.tipo] ?? eventTypeConfig.evento
                return (
                  <div key={event.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${config.dotClass}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">{event.titulo}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{event.data_inicio}</p>
                      <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${config.bgClass}`}>
                        {config.label}
                      </span>
                    </div>
                    {isLideranca && (
                      <button
                        type="button"
                        onClick={() => handleDelete(event.id)}
                        disabled={isPending}
                        className="shrink-0 text-muted-foreground hover:text-red-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
