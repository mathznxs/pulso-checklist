import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getCalendarEvents } from "@/lib/actions/calendar"
import { CalendarioContent } from "@/components/pulso/calendario-content"

export default async function CalendarioPage() {
  const now = new Date()
  const [{ profile }, events] = await Promise.all([
    getCurrentUser(),
    getCalendarEvents(now.getMonth() + 1, now.getFullYear()),
  ])

  const isLideranca =
    profile?.cargo === "lideranca" ||
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
