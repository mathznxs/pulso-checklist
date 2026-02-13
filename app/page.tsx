export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { AnnouncementBanner } from "@/components/pulso/announcement-banner"
import { OperationalDay } from "@/components/pulso/operational-day"
import { SectorExecution } from "@/components/pulso/sector-execution"
import { PerformanceTable } from "@/components/pulso/performance-table"
import { PerformanceChart } from "@/components/pulso/performance-chart"
import { getCurrentUser } from "@/lib/actions/auth"
import { redirect } from "next/navigation"
import {
  getDashboardStats,
  getSectorStats,
  getOperationalStatus,
  getChecklistPercentage,
  getActiveAnnouncement,
  getWeeklyPerformance,
  getEmployeePerformance,
} from "@/lib/actions/dashboard"

function formatDate(): string {
  const now = new Date()
  const days = [
    "Domingo",
    "Segunda-Feira",
    "Terça-Feira",
    "Quarta-Feira",
    "Quinta-Feira",
    "Sexta-Feira",
    "Sábado",
  ]
  const months = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ]
  return `${days[now.getDay()]}, ${now.getDate()} De ${months[now.getMonth()]} De ${now.getFullYear()}`
}

export default async function DashboardPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const [
    stats,
    sectors,
    operationalStatus,
    checklistPct,
    announcement,
    weeklyData,
    employeeData,
  ] = await Promise.all([
    getDashboardStats(),
    getSectorStats(),
    getOperationalStatus(),
    getChecklistPercentage(),
    getActiveAnnouncement(),
    getWeeklyPerformance(),
    getEmployeePerformance(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      {announcement && <AnnouncementBanner message={announcement.message} />}

      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <div className="flex flex-col gap-6">
          <OperationalDay
            date={formatDate()}
            status={operationalStatus}
            checklistPercentage={checklistPct}
            statusData={stats}
          />

          {sectors.length > 0 && <SectorExecution sectors={sectors} />}

          <PerformanceChart data={weeklyData} />

          <PerformanceTable data={employeeData} />
        </div>
      </main>
    </div>
  )
}
