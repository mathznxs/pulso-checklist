"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Download, Printer } from "lucide-react"

export interface EmployeePerformance {
  matricula: string
  nome: string
  setor: string
  concluidas: number
  pendentes: number
  ressalvas: number
  percentual: number
}

type SortKey = keyof EmployeePerformance

interface PerformanceTableProps {
  data: EmployeePerformance[]
}

export function PerformanceTable({ data }: PerformanceTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("percentual")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDirection("desc")
    }
  }

  const sortedData = [...data].sort((a, b) => {
    const valA = a[sortKey]
    const valB = b[sortKey]
    if (typeof valA === "string" && typeof valB === "string") {
      return sortDirection === "asc"
        ? valA.localeCompare(valB)
        : valB.localeCompare(valA)
    }
    return sortDirection === "asc"
      ? (valA as number) - (valB as number)
      : (valB as number) - (valA as number)
  })

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return null
    return sortDirection === "asc" ? (
      <ChevronUp className="ml-1 inline h-3 w-3" />
    ) : (
      <ChevronDown className="ml-1 inline h-3 w-3" />
    )
  }

  const getPercentColor = (p: number) =>
    p >= 80 ? "text-emerald-600" : p >= 50 ? "text-amber-600" : "text-red-600"

  const columns: { key: SortKey; label: string }[] = [
    { key: "matricula", label: "Matrícula" },
    { key: "nome", label: "Funcionário" },
    { key: "setor", label: "Setor" },
    { key: "concluidas", label: "Concluídas" },
    { key: "pendentes", label: "Pendentes" },
    { key: "ressalvas", label: "Ressalvas" },
    { key: "percentual", label: "%" },
  ]

  function exportCSV() {
    const today = new Date().toISOString().split("T")[0]
    const header = "Matrícula;Funcionário;Setor;Concluídas;Pendentes;Ressalvas;Percentual\n"
    const rows = sortedData
      .map(
        (e) =>
          `${e.matricula};${e.nome};${e.setor};${e.concluidas};${e.pendentes};${e.ressalvas};${e.percentual}%`
      )
      .join("\n")

    const bom = "\uFEFF"
    const blob = new Blob([bom + header + rows], {
      type: "text/csv;charset=utf-8;",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = `pulso-performance-${today}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handlePrint() {
    window.print()
  }

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Performance por Funcionario
        </h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={exportCSV}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar</span> CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Printer className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[600px] text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="cursor-pointer px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => handleSort(col.key)}
                >
                  {col.label}
                  <SortIcon column={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-card">
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  Nenhum dado de performance disponível para hoje
                </td>
              </tr>
            ) : (
              sortedData.map((employee) => (
                <tr
                  key={employee.matricula}
                  className="border-b border-border transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                    {employee.matricula}
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground">
                    {employee.nome}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {employee.setor}
                  </td>
                  <td className="px-4 py-3 font-medium text-emerald-600">
                    {employee.concluidas}
                  </td>
                  <td className="px-4 py-3 font-medium text-amber-600">
                    {employee.pendentes}
                  </td>
                  <td className="px-4 py-3 font-medium text-red-600">
                    {employee.ressalvas}
                  </td>
                  <td
                    className={`px-4 py-3 font-bold ${getPercentColor(employee.percentual)}`}
                  >
                    {employee.percentual}%
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
