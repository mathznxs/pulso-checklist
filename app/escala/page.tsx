export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getProfileForSession } from "@/lib/actions/auth"
import { getUserTodaySchedule, getUserWeekSchedule, getTodayAllSchedules } from "@/lib/actions/schedule"
import { getShifts, getAllProfiles, getFixedSchedules } from "@/lib/actions/admin"
import { EscalaContent } from "@/components/pulso/escala-content"
import { redirect } from "next/navigation"

export default async function EscalaPage() {
  const profile = await getProfileForSession()
  if (!profile) redirect("/auth/login")

  const isLideranca = profile.cargo === "gerente"

  const [todaySchedule, weekSchedule, shifts, allSchedules, profiles, fixedSchedules] = await Promise.all([
    getUserTodaySchedule(profile.id),
    getUserWeekSchedule(profile.id),
    getShifts(),
    isLideranca ? getTodayAllSchedules() : Promise.resolve([]),
    isLideranca ? getAllProfiles() : Promise.resolve([]),
    isLideranca ? getFixedSchedules() : Promise.resolve([]),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <EscalaContent
          todaySchedule={todaySchedule}
          weekSchedule={weekSchedule}
          allSchedules={allSchedules}
          fixedSchedules={fixedSchedules}
          shifts={shifts}
          profiles={profiles}
          isLideranca={isLideranca}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
