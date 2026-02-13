import { CheckCircle2, Clock, AlertTriangle, XCircle } from "lucide-react"

interface StatusData {
  concluidas: number
  pendentes: number
  ressalvas: number
  expiradas: number
}

export function StatusCards({ data }: { data: StatusData }) {
  const cards = [
    {
      label: "Concluídas",
      value: data.concluidas,
      icon: CheckCircle2,
      bgClass: "bg-emerald-50",
      iconColor: "text-emerald-500",
      borderClass: "border-emerald-200",
    },
    {
      label: "Pendentes",
      value: data.pendentes,
      icon: Clock,
      bgClass: "bg-card",
      iconColor: "text-muted-foreground",
      borderClass: "border-border",
    },
    {
      label: "Ressalvas",
      value: data.ressalvas,
      icon: AlertTriangle,
      bgClass: "bg-amber-50",
      iconColor: "text-amber-500",
      borderClass: "border-amber-200",
    },
    {
      label: "Expiradas",
      value: data.expiradas,
      icon: XCircle,
      bgClass: "bg-red-50",
      iconColor: "text-red-500",
      borderClass: "border-red-200",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className={`flex items-center gap-3 rounded-lg border p-4 ${card.bgClass} ${card.borderClass}`}
        >
          <card.icon className={`h-5 w-5 shrink-0 ${card.iconColor}`} />
          <div>
            <p className="text-xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground">{card.label}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
