import { Navbar } from "@/components/pulso/navbar"
import { getCurrentUser } from "@/lib/actions/auth"
import { getActiveChallenges, getChallengeScores } from "@/lib/actions/challenges"
import { getAllProfiles } from "@/lib/actions/admin"
import { GincanasContent } from "@/components/pulso/gincanas-content"

export default async function GincanasPage() {
  const [{ profile }, challenges, profiles] = await Promise.all([
    getCurrentUser(),
    getActiveChallenges(),
    getAllProfiles(),
  ])

  const activeChallenge = challenges[0]
  const scores = activeChallenge
    ? await getChallengeScores(activeChallenge.id)
    : []

  const isLideranca =
    profile?.cargo === "lideranca" ||
    profile?.cargo === "gerente" ||
    profile?.cargo === "admin"

  return (
    <div className="min-h-screen bg-background">
      <Navbar profile={profile} />
      <main className="mx-auto max-w-7xl px-4 py-6 lg:px-6">
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
