export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getAllProfiles, getShifts, getFixedSchedules, getDistinctSectors } from "@/lib/actions/admin"
import { AdminContent } from "@/components/pulso/admin-content"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const [{ profile }, profiles, shifts, schedules, sectors] = await Promise.all([
    getCurrentUser(),
    getAllProfiles(),
    getShifts(),
    getFixedSchedules(),
    getDistinctSectors(),
  ])

  if (!profile) redirect("/auth/login")

  const isLideranca =
    profile.cargo === "supervisão" ||
    profile.cargo === "gerente" ||
    profile.cargo === "admin"

  if (!isLideranca) redirect("/")

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <AdminContent
          profiles={profiles}
          shifts={shifts}
          schedules={schedules}
          sectors={sectors}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
