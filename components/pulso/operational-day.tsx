import { StatusCards } from "./status-cards"

interface OperationalDayProps {
  date: string
  status: "crítico" | "atenção" | "normal" | "ótimo"
  checklistPercentage: number
  statusData: {
    concluidas: number
    pendentes: number
    ressalvas: number
    expiradas: number
  }
}

// Config usa chaves sem acento; o status é normalizado antes de acessar.
const statusConfig = {
  critico: { label: "Crítico", dotClass: "bg-red-500", textClass: "text-red-500" },
  atencao: { label: "Atenção", dotClass: "bg-amber-500", textClass: "text-amber-500" },
  normal: { label: "Normal", dotClass: "bg-blue-500", textClass: "text-blue-500" },
  otimo: { label: "Ótimo", dotClass: "bg-emerald-500", textClass: "text-emerald-500" },
} as const

export function OperationalDay({
  date,
  status,
  checklistPercentage,
  statusData,
}: OperationalDayProps) {
  const normalizedStatus =
    status
      ?.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") ?? "normal"

  const statusInfo =
    statusConfig[normalizedStatus as keyof typeof statusConfig] ?? statusConfig.normal
  const progressColor =
    checklistPercentage >= 80
      ? "bg-emerald-500"
      : checklistPercentage >= 50
        ? "bg-amber-500"
        : "bg-red-500"

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Dia Operacional
          </p>
          <h2 className="mt-1 text-lg font-bold text-foreground lg:text-xl">
            {date}
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2.5 w-2.5 rounded-full ${statusInfo.dotClass}`} />
          <span className={`text-sm font-semibold ${statusInfo.textClass}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {/* Checklist progress */}
      <div className="mt-5">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">Checklist do dia</p>
          <p className="text-2xl font-bold text-foreground">
            {checklistPercentage}%
          </p>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${checklistPercentage}%` }}
          />
        </div>
      </div>

      {/* Status cards */}
      <div className="mt-5">
        <StatusCards data={statusData} />
      </div>
    </div>
  )
}
