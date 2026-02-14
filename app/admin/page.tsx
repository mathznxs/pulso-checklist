export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getAllProfiles, getShifts } from "@/lib/actions/admin"
import { getSetores, getEscalaByDate } from "@/lib/actions/schedule"
import { AdminContent } from "@/components/pulso/admin-content"
import { redirect } from "next/navigation"

export default async function AdminPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const isGerente = profile.cargo === "gerente"
  if (!isGerente) redirect("/")

  const today = new Date().toISOString().slice(0, 10)

  const [profiles, shifts, setores, escalaHoje] = await Promise.all([
    getAllProfiles(),
    getShifts(),
    getSetores(),
    getEscalaByDate(today),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <AdminContent
          profiles={profiles}
          shifts={shifts}
          setores={setores}
          escalaEntries={escalaHoje}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
