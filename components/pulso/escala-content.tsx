"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Profile, Shift, FixedSchedule } from "@/lib/types";
import type { TodaySchedule, WeekScheduleDay } from "@/lib/actions/schedule";
import { createTemporarySchedule } from "@/lib/actions/schedule";
import { updateFixedSchedule, deleteFixedSchedule } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Clock,
  CalendarDays,
  Plus,
  Loader2,
  AlertTriangle,
  Edit2,
  Trash2,
} from "lucide-react";

const SETORES = [
  "Masculino",
  "Feminino",
  "Futebol",
  "Ilha",
  "Infantil",
  "Anfitrião",
  "Caixa",
  "OMS",
  "Provador",
  "Estoque",
];

const DIAS_SEMANA = [
  { value: 0, label: "Dom" },
  { value: 1, label: "Seg" },
  { value: 2, label: "Ter" },
  { value: 3, label: "Qua" },
  { value: 4, label: "Qui" },
  { value: 5, label: "Sex" },
  { value: 6, label: "Sáb" },
];

/** Cores por setor para os cards (borda + fundo suave). */
const SETOR_COLORS: Record<
  string,
  { border: string; bg: string; badge: string; badgeText: string }
> = {
  Masculino: { border: "#dc2626", bg: "#fef2f2", badge: "#dc2626", badgeText: "#fff" },
  Feminino: { border: "#db2777", bg: "#fdf2f8", badge: "#db2777", badgeText: "#fff" },
  Futebol: { border: "#ca8a04", bg: "#fefce8", badge: "#ca8a04", badgeText: "#fff" },
  Ilha: { border: "#16a34a", bg: "#f0fdf4", badge: "#16a34a", badgeText: "#fff" },
  Infantil: { border: "#0ea5e9", bg: "#f0f9ff", badge: "#0ea5e9", badgeText: "#fff" },
  Anfitrião: { border: "#7c3aed", bg: "#f5f3ff", badge: "#7c3aed", badgeText: "#fff" },
  Caixa: { border: "#0891b2", bg: "#ecfeff", badge: "#0891b2", badgeText: "#fff" },
  OMS: { border: "#ea580c", bg: "#fff7ed", badge: "#ea580c", badgeText: "#fff" },
  Provador: { border: "#be185d", bg: "#fff1f2", badge: "#be185d", badgeText: "#fff" },
  Estoque: { border: "#475569", bg: "#f8fafc", badge: "#475569", badgeText: "#fff" },
};

function getSetorStyle(setorNome: string) {
  const c = SETOR_COLORS[setorNome] ?? {
    border: "var(--border)",
    bg: "var(--card)",
    badge: "var(--primary)",
    badgeText: "var(--primary-foreground)",
  };
  return {
    borderColor: c.border,
    backgroundColor: c.bg,
  };
}

function getSetorBadgeStyle(setorNome: string) {
  const c = SETOR_COLORS[setorNome] ?? {
    badge: "var(--primary)",
    badgeText: "var(--primary-foreground)",
  };
  return { backgroundColor: c.badge, color: c.badgeText };
}

interface EscalaContentProps {
  todaySchedule: TodaySchedule | null;
  weekSchedule: WeekScheduleDay[];
  allSchedules: {
    userId: string;
    nome: string;
    matricula: string;
    setor: string;
    turno_nome: string;
    tipo: "fixa" | "provisória";
  }[];
  fixedSchedules?: FixedSchedule[];
  shifts: Shift[];
  profiles: Profile[];
  isLideranca: boolean;
  currentProfile: Profile;
}

export function EscalaContent({
  todaySchedule,
  weekSchedule,
  allSchedules,
  fixedSchedules = [],
  shifts,
  profiles,
  isLideranca,
  currentProfile,
}: EscalaContentProps) {
  const [showTempDialog, setShowTempDialog] = useState(false);
  const [showEditSchedule, setShowEditSchedule] =
    useState<FixedSchedule | null>(null);
  const [scheduleToDelete, setScheduleToDelete] =
    useState<FixedSchedule | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(() =>
    new Date().getDay(),
  );
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const today = new Date();
  const dayOfWeek = today.getDay();

  // Escala Geral de Hoje: agrupar por setor (já são só quem trabalha hoje)
  const schedulesBySetor = new Map<
    string,
    EscalaContentProps["allSchedules"]
  >();
  for (const s of allSchedules) {
    if (!schedulesBySetor.has(s.setor)) schedulesBySetor.set(s.setor, []);
    schedulesBySetor.get(s.setor)!.push(s);
  }
  const setoresOrdenados = Array.from(schedulesBySetor.keys()).sort();

  // Escalas Fixas: filtrar pelo dia selecionado e agrupar por setor
  const fixedBySelectedDay = fixedSchedules.filter((s) =>
    s.dias_semana?.includes(selectedDayIndex),
  );
  const fixedBySetor = new Map<string, FixedSchedule[]>();
  for (const s of fixedBySelectedDay) {
    if (!fixedBySetor.has(s.setor)) fixedBySetor.set(s.setor, []);
    fixedBySetor.get(s.setor)!.push(s);
  }
  const fixedSetoresOrdenados = Array.from(fixedBySetor.keys()).sort();

  async function handleCreateTemp(formData: FormData) {
    startTransition(async () => {
      await createTemporarySchedule(formData);
      setShowTempDialog(false);
      router.refresh();
    });
  }

  async function handleEditSchedule(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!showEditSchedule) return;
    const form = e.currentTarget;
    const fd = new FormData(form);
    const dias = DIAS_SEMANA.filter(
      (d) => fd.get(`dia_edit_${d.value}`) === "on",
    ).map((d) => d.value);
    fd.set("dias_semana", dias.join(","));
    startTransition(async () => {
      await updateFixedSchedule(showEditSchedule.id, fd);
      setShowEditSchedule(null);
      router.refresh();
    });
  }

  async function handleDeleteSchedule() {
    if (!scheduleToDelete) return;
    startTransition(async () => {
      await deleteFixedSchedule(scheduleToDelete.id);
      setScheduleToDelete(null);
      router.refresh();
    });
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
                  Provisória
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
              Voce não tem uma escala configurada para hoje. Fale com a
              liderança.
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
              ? "Visualize a escala geral e crie alterações provisórias"
              : "Sua escala semanal"}
          </p>
        </div>
        {isLideranca && (
          <Dialog open={showTempDialog} onOpenChange={setShowTempDialog}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Escala Provisória
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Escala Provisória</DialogTitle>
              </DialogHeader>
              <form action={handleCreateTemp} className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="tp-user">Funcionário</Label>
                  <select
                    id="tp-user"
                    name="user_id"
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
                      <option key={s} value={s}>
                        {s}
                      </option>
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
                      <option key={s.id} value={s.id}>
                        {s.nome} ({s.hora_inicio.slice(0, 5)} -{" "}
                        {s.hora_fim.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-xs text-muted-foreground">
                  A escala provisória não afeta a escala fixa e se aplica apenas
                  ao dia selecionado.
                </p>
                <Button type="submit" disabled={isPending}>
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
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
              const isToday = day.dayIndex === dayOfWeek;
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
              );
            })}
          </div>
        </div>
      </div>

      {/* Lideranca: Escala Geral de Hoje — cards por setor (só quem está trabalhando hoje) */}
      {isLideranca && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escala Geral de Hoje
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Quem está em cada setor hoje. Quem está de folga não aparece.
          </p>
          {setoresOrdenados.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhuma escala configurada para hoje
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {setoresOrdenados.map((setorNome) => {
                const items = schedulesBySetor.get(setorNome) ?? [];
                return (
                  <div
                    key={setorNome}
                    className="rounded-xl border-2 p-4 transition-shadow hover:shadow-md"
                    style={getSetorStyle(setorNome)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                        style={getSetorBadgeStyle(setorNome)}
                      >
                        {setorNome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {items.length}{" "}
                        {items.length === 1 ? "pessoa" : "pessoas"}
                      </span>
                    </div>
                    <ul className="mt-3 flex flex-col gap-2">
                      {items.map((s) => (
                        <li
                          key={`${s.userId}-${s.setor}-${s.turno_nome}`}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {s.nome}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {s.matricula}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <span className="text-xs font-medium text-foreground">
                              {s.turno_nome}
                            </span>
                            {s.tipo === "provisória" && (
                              <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                Prov.
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Lideranca: Escalas fixas — seletor de dia + cards por setor */}
      {isLideranca && fixedSchedules.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Escalas fixas
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Escolha o dia e veja quem está em cada setor. Edite ou exclua pelas
            ações em cada linha.
          </p>

          {/* Menu de dias da semana */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {DIAS_SEMANA.map((d) => (
              <button
                key={d.value}
                type="button"
                onClick={() => setSelectedDayIndex(d.value)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedDayIndex === d.value
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {fixedSetoresOrdenados.length === 0 ? (
            <div className="mt-4 rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Nenhuma escala fixa para{" "}
              {DIAS_SEMANA.find((d) => d.value === selectedDayIndex)?.label ??
                "este dia"}
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {fixedSetoresOrdenados.map((setorNome) => {
                const items = fixedBySetor.get(setorNome) ?? [];
                return (
                  <div
                    key={setorNome}
                    className="rounded-xl border-2 p-4 transition-shadow hover:shadow-md"
                    style={getSetorStyle(setorNome)}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
                        style={getSetorBadgeStyle(setorNome)}
                      >
                        {setorNome}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {items.length}{" "}
                        {items.length === 1 ? "pessoa" : "pessoas"}
                      </span>
                    </div>
                    <ul className="mt-3 flex flex-col gap-2">
                      {items.map((s) => (
                        <li
                          key={s.id}
                          className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/50 bg-card/80 px-3 py-2"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-foreground">
                              {s.profile?.nome ?? "N/A"}
                            </p>
                            <p className="text-xs font-medium text-muted-foreground">
                              {s.shift?.nome ?? "N/A"}
                            </p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowEditSchedule(s)}
                              aria-label="Editar"
                            >
                              <Edit2 className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-red-600 hover:bg-red-50 hover:text-red-700"
                              onClick={() => setScheduleToDelete(s)}
                              disabled={isPending}
                              aria-label="Excluir"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          )}

          <Dialog
            open={showEditSchedule !== null}
            onOpenChange={(open) => !open && setShowEditSchedule(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Editar Escala Fixa</DialogTitle>
              </DialogHeader>
              {showEditSchedule && (
                <form
                  onSubmit={handleEditSchedule}
                  className="flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="es-user">Funcionário</Label>
                    <select
                      id="es-user"
                      name="user_id"
                      required
                      defaultValue={showEditSchedule.user_id}
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
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="es-setor">Setor</Label>
                    <select
                      id="es-setor"
                      name="setor"
                      required
                      defaultValue={showEditSchedule.setor}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Selecione</option>
                      {SETORES.map((sec) => (
                        <option key={sec} value={sec}>
                          {sec}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="es-turno">Turno</Label>
                    <select
                      id="es-turno"
                      name="turno_id"
                      required
                      defaultValue={showEditSchedule.turno_id}
                      className="flex h-10 w-full rounded-md border border-input bg-card px-3 py-2 text-sm text-foreground ring-offset-background"
                    >
                      <option value="">Selecione</option>
                      {shifts.map((sh) => (
                        <option key={sh.id} value={sh.id}>
                          {sh.nome} ({sh.hora_inicio} - {sh.hora_fim})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label>Dias da Semana</Label>
                    <div className="flex flex-wrap gap-3">
                      {DIAS_SEMANA.map((d) => (
                        <label
                          key={d.value}
                          className="flex items-center gap-1.5 text-sm"
                        >
                          <input
                            type="checkbox"
                            name={`dia_edit_${d.value}`}
                            defaultChecked={showEditSchedule.dias_semana?.includes(
                              d.value,
                            )}
                            className="h-4 w-4 rounded border-input"
                          />
                          {d.label}
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button type="submit" disabled={isPending}>
                    {isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Salvar Alterações
                  </Button>
                </form>
              )}
            </DialogContent>
          </Dialog>

          <Dialog
            open={scheduleToDelete !== null}
            onOpenChange={(open) => !open && setScheduleToDelete(null)}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Excluir escala</DialogTitle>
              </DialogHeader>
              {scheduleToDelete && (
                <>
                  <p className="text-sm text-muted-foreground">
                    Tem certeza que deseja excluir a escala fixa de{" "}
                    <strong>{scheduleToDelete.profile?.nome ?? "N/A"}</strong> (
                    {scheduleToDelete.setor}, {scheduleToDelete.shift?.nome})?
                    Esta ação não pode ser desfeita.
                  </p>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setScheduleToDelete(null)}
                      disabled={isPending}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteSchedule}
                      disabled={isPending}
                    >
                      {isPending && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      Excluir
                    </Button>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}
