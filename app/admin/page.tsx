export const dynamic = "force-dynamic"
export const runtime = "nodejs"

import { Navbar } from "@/components/pulso/navbar"
import { getProfileForSession } from "@/lib/actions/auth"
import {
  getAllProfiles,
  getShifts,
  getFixedSchedules,
} from "@/lib/actions/admin"
import { getActiveSetores } from "@/lib/actions/setores"
import { getEscalaFixaSemanal } from "@/lib/actions/schedule"
import { AdminContent } from "@/components/pulso/admin-content"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const [profile, profiles, shifts, schedules, setores, escalaFixa] =
    await Promise.all([
      getProfileForSession(),
      getAllProfiles(),
      getShifts(),
      getFixedSchedules(),
      getActiveSetores(),
      getEscalaFixaSemanal(),
    ])

  if (!profile) redirect("/auth/login")

  if (profile.cargo !== "gerente") redirect("/")

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <AdminContent
          profiles={profiles}
          shifts={shifts}
          schedules={schedules}
          setores={setores}
          escalaFixa={escalaFixa}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
