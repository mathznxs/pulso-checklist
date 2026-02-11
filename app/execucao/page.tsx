import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getTodayTasks } from "@/lib/actions/tasks"
import { getAllProfiles } from "@/lib/actions/admin"
import { ExecucaoContent } from "@/components/pulso/execucao-content"
import { redirect } from "next/navigation"

export default async function ExecucaoPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const [tasks, profiles] = await Promise.all([
    getTodayTasks(),
    getAllProfiles(),
  ])

  const isLideranca =
    profile?.cargo === "lideranca" ||
    profile?.cargo === "gerente" ||
    profile?.cargo === "admin"

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
        <ExecucaoContent
          initialTasks={tasks}
          profiles={profiles}
          currentProfile={profile}
          isLideranca={isLideranca}
        />
      </main>
    </div>
  )
}
