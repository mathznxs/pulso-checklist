interface SectorData {
  name: string
  percentage: number
  concluidas: number
  total: number
  pendentes: number
}

function SectorCard({ sector }: { sector: SectorData }) {
  const percentColor =
    sector.percentage >= 80
      ? "text-emerald-600"
      : sector.percentage >= 50
        ? "text-amber-600"
        : "text-red-600"

  const barColor =
    sector.percentage >= 80
      ? "bg-emerald-500"
      : sector.percentage >= 50
        ? "bg-amber-500"
        : "bg-red-500"

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">{sector.name}</h4>
        <span className={`text-lg font-bold ${percentColor}`}>
          {sector.percentage}%
        </span>
      </div>
      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
          style={{ width: `${sector.percentage}%` }}
        />
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-xs">
        <span className="text-muted-foreground">
          {sector.concluidas}/{sector.total} concluidas
        </span>
        <span className="text-red-500">
          {sector.pendentes} pendentes
        </span>
      </div>
    </div>
  )
}

export function SectorExecution({ sectors }: { sectors: SectorData[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Execucao por Setor
      </h3>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {sectors.map((sector) => (
          <SectorCard key={sector.name} sector={sector} />
        ))}
      </div>
    </div>
  )
}
