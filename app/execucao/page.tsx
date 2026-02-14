export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getTasksForRole } from "@/lib/actions/tasks"
import { getAllProfiles } from "@/lib/actions/admin"
import { ExecucaoContent } from "@/components/pulso/execucao-content"
import { redirect } from "next/navigation"

export default async function ExecucaoPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const isLideranca = profile.cargo === "gerente"

  const [tasks, profiles] = await Promise.all([
    getTasksForRole({
      userId: profile.id,
      isLideranca,
      // Sem filtro de data: liderança vê todas; assistente vê todas atribuídas a ele
    }),
    getAllProfiles(),
  ])

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
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
