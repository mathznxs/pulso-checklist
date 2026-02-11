"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts"

interface PerformanceChartProps {
  data: { day: string; percentage: number }[]
}

function getBarColor(value: number) {
  if (value >= 80) return "#22c55e"
  if (value >= 50) return "#eab308"
  if (value > 0) return "#ef4444"
  return "#e5e7eb"
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const chartData = data.map((d) => ({ name: d.day, execucao: d.percentage }))

  return (
    <div className="rounded-xl border border-border bg-card p-5 lg:p-6">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Execucao da Semana
      </h3>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barCategoryGap="20%">
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "#888" }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e5e7eb",
                fontSize: "13px",
              }}
              formatter={(value: number) => [`${value}%`, "Execucao"]}
            />
            <Bar dataKey="execucao" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={getBarColor(entry.execucao)}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
