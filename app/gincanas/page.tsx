export const dynamic = 'force-dynamic'

import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getActiveChallenges, getChallengeScores } from "@/lib/actions/challenges"
import { getAllProfiles } from "@/lib/actions/admin"
import { GincanasContent } from "@/components/pulso/gincanas-content"
import { redirect } from "next/navigation"

export default async function GincanasPage() {
  const { profile } = await getCurrentUser()
  if (!profile) redirect("/auth/login")

  const [challenges, profiles] = await Promise.all([
    getActiveChallenges(),
    getAllProfiles(),
  ])

  const activeChallenge = challenges[0]
  const scores = activeChallenge
    ? await getChallengeScores(activeChallenge.id)
    : []

  const isLideranca = profile?.cargo === "gerente"

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 pb-24 md:pb-6 lg:px-6">
        <GincanasContent
          challenges={challenges}
          scores={scores}
          profiles={profiles}
          isLideranca={isLideranca}
        />
      </main>
    </div>
  )
}
