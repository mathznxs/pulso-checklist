export const dynamic = "force-dynamic"

import { Navbar } from "@/components/pulso/navbar"
import { getProfileForSession } from "@/lib/actions/auth"
import {
  getUserTodaySchedule,
  getUserWeekSchedule,
  getEscalaByDate,
} from "@/lib/actions/schedule"
import { getShifts, getAllProfiles } from "@/lib/actions/admin"
import { getActiveSetores } from "@/lib/actions/setores"
import { EscalaContent } from "@/components/pulso/escala-content"
import { redirect } from "next/navigation"

export default async function EscalaPage() {
  const profile = await getProfileForSession()
  if (!profile) redirect("/auth/login")

  const isLideranca = profile.cargo === "gerente"
  const todayStr = new Date().toISOString().split("T")[0]

  const [todaySchedule, weekSchedule, escalaHoje, shifts, profiles, setores] =
    await Promise.all([
      getUserTodaySchedule(profile.id),
      getUserWeekSchedule(profile.id),
      isLideranca ? getEscalaByDate(todayStr) : Promise.resolve([]),
      isLideranca ? getShifts() : Promise.resolve([]),
      isLideranca ? getAllProfiles() : Promise.resolve([]),
      isLideranca ? getActiveSetores() : Promise.resolve([]),
    ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <EscalaContent
          todaySchedule={todaySchedule}
          weekSchedule={weekSchedule}
          escalaHoje={escalaHoje}
          shifts={shifts}
          profiles={profiles}
          setores={setores}
          isLideranca={isLideranca}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
