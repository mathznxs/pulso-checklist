export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getSetores, getEscalaByDate, getUserTodaySchedule } from "@/lib/actions/schedule"
import { getShifts, getAllProfiles } from "@/lib/actions/admin"
import { EscalaContent } from "@/components/pulso/escala-content"
import { redirect } from "next/navigation"

export default async function EscalaPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const isGerente = profile.cargo === "gerente"

  const today = new Date().toISOString().slice(0, 10)

  const [setores, shifts, profiles, todayEntries, todaySchedule] = await Promise.all([
    getSetores(),
    getShifts(),
    isGerente ? getAllProfiles() : Promise.resolve([]),
    getEscalaByDate(today),
    getUserTodaySchedule(profile.id),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <EscalaContent
          todaySchedule={todaySchedule}
          todayEntries={todayEntries}
          setores={setores}
          shifts={shifts}
          profiles={profiles}
          isGerente={isGerente}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
