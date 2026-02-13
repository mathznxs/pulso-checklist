export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getCalendarEvents } from "@/lib/actions/calendar"
import { CalendarioContent } from "@/components/pulso/calendario-content"
import { redirect } from "next/navigation"

export default async function CalendarioPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const now = new Date()
  const events = await getCalendarEvents(now.getMonth() + 1, now.getFullYear())

  const isLideranca =
    profile?.cargo === "supervisão" ||
    profile?.cargo === "gerente" ||
    profile?.cargo === "admin"

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <CalendarioContent
          events={events}
          isLideranca={isLideranca}
          currentProfile={profile}
        />
      </main>
    </div>
  )
}
